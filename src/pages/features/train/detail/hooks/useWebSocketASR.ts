import { useState, useRef, useCallback, useEffect } from 'react';
import { message } from 'antd';
import useAuthStore from '../../../../../store/auth';
// Removed SaveUserTrainDataAPI import
import { PracticeDetailAPI, PracticeDetailReqType, DysarthriaResult } from '../../../../../api/train';
import { useTextContext } from '../context/TextContext';


interface UseWebSocketASRProps {
  onTranscriptionUpdate?: (text: string) => void;
  onScoreUpdate?: (score: DysarthriaResult) => void; // 类型保持 DysarthriaResult
  isEvaluationMode: boolean;
  selectedText: string; // 当前选中的目标文本 (用于 target_text)
  textUuid: string; // 训练文本的 UUID
  originalFullText: string; // 原始完整文本 (用于判断 finished)
  isTaskFinished: boolean; // 新增：任务是否已完成
}

export const useWebSocketASR = ({
  onTranscriptionUpdate,
  onScoreUpdate,
  isEvaluationMode,
  selectedText, // 这个现在是 target_text
  textUuid,
  originalFullText, // 新增 prop
  isTaskFinished, // 新增 prop
}: UseWebSocketASRProps) => {
  // console.log("[useWebSocketASR Hook] Initializing with textUuid:", textUuid); // 移除日志

  const [isAnalyzing, setIsAnalyzing] = useState(false); // WebSocket 连接/处理状态
  const [transcription, setTranscription] = useState(""); // ASR 结果文本 (用于 UI 显示)
  const [recordingUuid, setRecordingUuid] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { token } = useAuthStore();
  const { setDysarthriaResult } = useTextContext(); // 获取 context setter 用于评分
  const connectionPromiseRef = useRef<{ resolve: () => void; reject: (reason?: any) => void } | null>(null); // 用于存储 promise 处理程序的 Ref
  const audioBufferRef = useRef<ArrayBuffer[]>([]); // 音频块缓冲区
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null); // 发送间隔计时器
  const latestTranscriptionRef = useRef<string>(""); // 使用 Ref 存储最新的转录文本

  const cleanupWebSocket = useCallback((keepAnalyzingState = false) => {
    // console.log('[cleanupWebSocket] Cleaning up WebSocket...'); // 移除日志
    // 清除计时器
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    // 清除缓冲区
    audioBufferRef.current = [];
    // 重置最新转录文本 ref
    latestTranscriptionRef.current = "";

    if (connectionPromiseRef.current) {
      connectionPromiseRef.current.reject(new Error("WebSocket cleanup initiated before connection."));
      connectionPromiseRef.current = null;
    }
    if (wsRef.current) { // 关闭前检查 wsRef.current 是否存在
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
    }
    wsRef.current = null;
    if (!keepAnalyzingState) { // 仅在未明确要求保留时重置分析状态
      setIsAnalyzing(false);
    }
    // setTranscription(""); // 不再需要在此处清除 transcription
    setRecordingUuid(null);
  }, []);

  // 修改 processScoreAndSave 以构造新请求体并移除保存逻辑
  const processScoreAndSave = useCallback(async (recUuid: string) => {
    const transcriptionText = latestTranscriptionRef.current; // ASR 结果

    if (!textUuid) {
      message.error("缺少文本ID，无法获取评分");
      cleanupWebSocket();
      return;
    }
    if (!selectedText) { // 检查 target_text 是否为空
      message.error("缺少目标文本，无法获取评分");
      cleanupWebSocket();
      return;
    }

    try {
      message.loading("正在获取评分...", 0);

      // 计算 finished 字段的值
      const finishedValue = isTaskFinished || (isEvaluationMode && selectedText === originalFullText);

      // 构造新的请求体，根据 save (isEvaluationMode) 决定是否包含 recording_uuid
      const requestData: PracticeDetailReqType = {
        user_text: transcriptionText, // ASR识别结果
        text_uuid: textUuid,
        target_text: selectedText, // 当前选中的文本
        save: isEvaluationMode, // 是否为测评模式
        // 如果 save 为 true，则包含 recording_uuid
        recording_uuid: recUuid,
        finished: finishedValue, // 应用新的 finished 逻辑
      };
      // console.log('[processScoreAndSave] Request data prepared:', requestData); // Debug log

      const scoreResponse = await PracticeDetailAPI(requestData);
      message.destroy();

      if (scoreResponse.status === 0 && scoreResponse.score !== undefined && scoreResponse.char_scores !== undefined) {
        message.success("评分获取成功");

        const mappedResult: DysarthriaResult = {
          total_score: scoreResponse.score,
          single_score: scoreResponse.char_scores,
          intelligibility_score: scoreResponse.intelligibility_score
          // sd, sm, ym are no longer available from this API
        };

        setDysarthriaResult(mappedResult);
        if (onScoreUpdate) onScoreUpdate(mappedResult);

        // 移除保存逻辑: 后端会在 save=true 时自动保存

      } else {
        message.error(`获取评分失败: ${scoreResponse.message || '评分接口返回错误'}`);
        console.error("Error getting score:", scoreResponse);
        setDysarthriaResult({ single_score: [] });
        if (onScoreUpdate) onScoreUpdate({ single_score: [] });
      }

    } catch (error: any) {
      message.destroy();
      message.error(`调用评分接口时出错: ${error.message || '网络错误'}`);
      console.error("Error processing score:", error);
      setDysarthriaResult({ single_score: [] });
      if (onScoreUpdate) onScoreUpdate({ single_score: [] });
    } finally {
      cleanupWebSocket();
    }
  }, [
    cleanupWebSocket,
    isEvaluationMode,
    onScoreUpdate,
    selectedText, // 依赖 target_text
    setDysarthriaResult,
    textUuid,
    originalFullText, // 依赖 originalFullText
    isTaskFinished, // 添加 isTaskFinished 作为依赖
    // latestTranscriptionRef // ref 不需要作为依赖项
  ]);


  const connectAndStartStreaming = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!token) {
        message.error("用户未登录，无法开始录音");
        reject(new Error("User not logged in"));
        return;
      }
      if (wsRef.current) {
        reject(new Error("WebSocket connection already exists or is in progress."));
        return;
      }

      // 存储 promise 处理程序
      connectionPromiseRef.current = { resolve, reject };

      // console.log("clear2") // 移除日志
      // 为新会话重置状态和 ref
      setTranscription("");
      latestTranscriptionRef.current = ""; // 重置 ref
      setRecordingUuid(null);
      setDysarthriaResult({});
      audioBufferRef.current = []; // 在开始时清除缓冲区
      if (sendIntervalRef.current) { // 清除任何残留的计时器
        clearInterval(sendIntervalRef.current);
        sendIntervalRef.current = null;
      }

      const wsUrl = `wss://${import.meta.env.VITE_API_WS_URL}/asr`;
      try {
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.binaryType = 'arraybuffer'; // 确保接收和发送的是 ArrayBuffer
      } catch (error) {
        message.error("创建 WebSocket 连接失败");
        setIsAnalyzing(false);
        connectionPromiseRef.current = null;
        reject(error);
        return;
      }
      setIsAnalyzing(true);
      message.loading("正在连接语音服务...", 0);

      // 直接为新实例分配处理程序
      const currentWs = wsRef.current;

      currentWs.onopen = () => {
        // ... (onopen 内部逻辑不变) ...
        message.destroy();
        try {
          currentWs.send(token); // 发送令牌

          // 在令牌发送后启动 100ms 的发送间隔
          if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current);
          }
          sendIntervalRef.current = setInterval(() => {
            // 检查 ws 状态和缓冲区内容
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && audioBufferRef.current.length > 0) {
              // 连接缓冲区
              const buffersToSend = [...audioBufferRef.current]; // 复制缓冲区内容
              audioBufferRef.current = []; // 立即清除缓冲区

              const totalLength = buffersToSend.reduce((acc, val) => acc + val.byteLength, 0);
              if (totalLength === 0) return;

              const combinedBuffer = new Uint8Array(totalLength);
              let offset = 0;
              buffersToSend.forEach(buffer => {
                combinedBuffer.set(new Uint8Array(buffer), offset);
                offset += buffer.byteLength;
              });

              try {
                wsRef.current.send(combinedBuffer.buffer); // 发送底层的 ArrayBuffer
              } catch (error) {
                console.error("WebSocket send error (interval):", error); // 保留错误日志
                message.error("发送音频数据时出错");
                cleanupWebSocket(); // 发送错误时停止所有操作
              }
            }
          }, 100); // 每 100ms 发送一次

          if (connectionPromiseRef.current) {
            connectionPromiseRef.current.resolve(); // 解析连接 promise
            connectionPromiseRef.current = null;
          }
        } catch (error) {
          message.error("发送认证令牌失败");
          if (connectionPromiseRef.current) {
            connectionPromiseRef.current.reject(error);
            connectionPromiseRef.current = null;
          }
          cleanupWebSocket();
        }
      };

      currentWs.onmessage = async (event) => {
        try {
          // 检查是否为 ArrayBuffer
          if (event.data instanceof ArrayBuffer) {
            // console.log("Received binary data (ArrayBuffer)"); // 移除日志
            return; // 忽略二进制数据（可能是音频回显或其他）
          }

          // 假定其他消息是 JSON 字符串
          const data = JSON.parse(event.data as string);
          // console.log("Received WebSocket message:", data); // 移除日志

          switch (data.event) {
            case "result-generated":
              // console.log("Received 'result-generated' event:", data); // 移除日志
              const newTranscription = data.text || "";
              setTranscription(newTranscription); // 更新状态以供显示
              latestTranscriptionRef.current = newTranscription; // 更新 ref
              if (onTranscriptionUpdate) onTranscriptionUpdate(newTranscription);
              break;
            case "task-finished":
              // console.log("Received 'task-finished' event:", data); // 移除日志
              // 通常在此事件后不久会收到 'recording-saved'
              break;
            case "recording-saved":
              message.destroy();
              const uuid = data.uuid;
              // console.log("Received 'recording-saved' event. Data:", data, "Extracted UUID:", uuid); // 移除日志
              setRecordingUuid(uuid);
              setIsAnalyzing(false); // ASR 部分完成
              if (uuid) {
                // console.log("UUID is valid, calling processScoreAndSave."); // 移除日志
                // 直接调用，processScoreAndSave 会从 ref 读取最新的转录
                await processScoreAndSave(uuid);
              } else {
                // console.error("UUID is missing or invalid in 'recording-saved' event."); // 移除日志
                message.error("未能获取录音ID，无法评分");
                cleanupWebSocket();
              }
              break;
            case "task-failed":
              message.destroy();
              message.error(`语音识别任务失败: ${data.error || '未知错误'}`);
              console.error("ASR task failed:", data); // 保留错误日志
              cleanupWebSocket();
              break;
            default:
              // console.log("Received unhandled WebSocket event:", data.event, data); // 移除日志
              break;
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message or handle it:", error, "Raw data:", event.data); // 保留错误日志
          // 可以选择是否在此处清理，取决于错误类型
          // cleanupWebSocket();
        }
      };

      currentWs.onerror = (event) => {
        // ... (onerror 逻辑不变) ...
        message.destroy();
        message.error("WebSocket 连接出错");
        console.error("WebSocket error:", event); // 保留错误日志
        if (connectionPromiseRef.current) {
          connectionPromiseRef.current.reject(new Error("WebSocket connection error"));
          connectionPromiseRef.current = null;
        }
        cleanupWebSocket(); // 出错时清理
      };

      currentWs.onclose = (event) => {
        // ... (onclose 逻辑不变) ...
        // console.log("WebSocket connection closed. Code:", event.code, "Reason:", event.reason, "wasAnalyzing:", isAnalyzing); // 移除日志
        message.destroy();
        if (connectionPromiseRef.current) {
          message.error("WebSocket 连接意外关闭");
          connectionPromiseRef.current.reject(new Error(`WebSocket closed before opening: ${event.code} ${event.reason}`));
          connectionPromiseRef.current = null;
        }
        // 确保在 finally 或此处调用 cleanupWebSocket
        // cleanupWebSocket(); // 关闭时确保清理 - 注意：可能已被 processScoreAndSave 调用
        // 检查 wsRef 是否仍然指向当前实例，避免重复清理
        if (wsRef.current === currentWs) {
          cleanupWebSocket();
        }
      };
    });
  }, [token, cleanupWebSocket, setDysarthriaResult, processScoreAndSave, onTranscriptionUpdate]); // 移除 isAnalyzing 和 transcription 依赖

  // ... (sendAudioData 和 finishStreaming 保持不变) ...
  // 修改 sendAudioData 以缓冲数据
  const sendAudioData = useCallback((data: ArrayBuffer) => {
    if (data.byteLength > 0) {
      audioBufferRef.current.push(data);
    }
  }, []);

  const finishStreaming = useCallback(async () => {
    // 1. 清除间隔计时器
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    // 2. 立即发送任何剩余的缓冲数据
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && audioBufferRef.current.length > 0) {
      const buffersToSend = [...audioBufferRef.current];
      audioBufferRef.current = []; // 清除缓冲区

      const totalLength = buffersToSend.reduce((acc, val) => acc + val.byteLength, 0);
      if (totalLength > 0) {
        const combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        buffersToSend.forEach(buffer => {
          combinedBuffer.set(new Uint8Array(buffer), offset);
          offset += buffer.byteLength;
        });

        try {
          wsRef.current.send(combinedBuffer.buffer);
        } catch (error) {
          console.error("WebSocket send error (final buffer):", error); // 保留错误日志
          message.error("发送最终音频数据时出错");
        }
      }
    }

    // 3. 发送 "finish" 信号
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send("finish");
        message.loading("录音结束，正在等待最终分析结果...", 0);
        // 注意: cleanupWebSocket 将由 onmessage (recording-saved/task-failed) 或 onclose/onerror 调用
      } catch (error) {
        console.error("Error sending 'finish' message:", error); // 保留错误日志
        message.error("发送结束信号时出错");
        cleanupWebSocket(); // 如果发送 'finish' 失败，立即清理
      }
    } else {
      cleanupWebSocket(); // 如果 WS 未打开则清理
    }
  }, [cleanupWebSocket]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, [cleanupWebSocket]);

  return {
    isAnalyzing,
    transcription, // 仍然返回状态用于 UI
    recordingUuid,
    connectAndStartStreaming,
    sendAudioData, // 现在缓冲数据
    finishStreaming,
  };
};

