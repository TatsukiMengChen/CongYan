import { useState, useRef, useCallback, useEffect } from 'react';
import { message } from 'antd';
import useAuthStore from '../../../../../store/auth';
import { SaveUserTrainDataAPI } from '../../../../../api/train';
import { useTextContext } from '../context/TextContext'; // Import context hook

// Assume ScoreRecordingAPI exists and has this signature
declare function ScoreRecordingAPI(uuid: string): Promise<{
  code: number;
  data?: { sd: number; sm: number; ym: number; total_score: number };
  message?: string;
}>;

interface UseWebSocketASRProps {
  onTranscriptionUpdate?: (text: string) => void;
  onScoreUpdate?: (score: { sd: number; sm: number; ym: number; total_score: number }) => void;
  isEvaluationMode: boolean;
  selectedText: string;
}

export const useWebSocketASR = ({
    onTranscriptionUpdate,
    onScoreUpdate,
    isEvaluationMode,
    selectedText,
}: UseWebSocketASRProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false); // WebSocket connection/processing state
  const [transcription, setTranscription] = useState("");
  const [recordingUuid, setRecordingUuid] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioBufferRef = useRef<Blob[]>([]); // Buffer for chunks before sending
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuthStore();
  const { setDysarthriaResult } = useTextContext(); // Get context setter for score

  const cleanupWebSocket = useCallback(() => {
    console.log('Cleaning up WebSocket...');
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    wsRef.current = null;
    audioBufferRef.current = [];
    setIsAnalyzing(false);
    setTranscription("");
    setRecordingUuid(null);
  }, []);

  const processScoreAndSave = useCallback(async (uuid: string) => {
     try {
        message.loading("正在获取评分...", 0);
        // const scoreRes = await ScoreRecordingAPI(uuid); // Replace with actual API call
        // message.destroy();
        // if (scoreRes.code === 200 && scoreRes.data) {
        //   console.log("Scoring successful:", scoreRes.data);
        //   setDysarthriaResult(scoreRes.data); // Update context
        //   if (onScoreUpdate) onScoreUpdate(scoreRes.data);

        //   if (isEvaluationMode) {
        //     message.loading("正在保存测评记录...", 0);
        //     await SaveUserTrainDataAPI({
        //       text: selectedText,
        //       ...scoreRes.data,
        //     }).then(saveRes => {
        //         message.destroy();
        //         if (saveRes.code === 200) message.success("测评记录保存成功");
        //         else message.error(`保存失败: ${saveRes.message}`);
        //     }).catch(err => {
        //         message.destroy(); message.error("保存测评记录时出错"); console.error(err);
        //     });
        //   } else {
        //      message.success("评分获取成功");
        //   }
        // } else {
        //   message.error(`获取评分失败: ${scoreRes.message || '未知错误'}`);
        // }
        // --- Mock Implementation ---
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
        message.success("模拟评分成功");
        const mockScoreData = { sd: 80, sm: 85, ym: 90, total_score: 85 };
        setDysarthriaResult(mockScoreData); // Update context
        if (onScoreUpdate) onScoreUpdate(mockScoreData);

        if (isEvaluationMode) {
            message.loading("正在保存测评记录...", 0);
            await new Promise(resolve => setTimeout(resolve, 500));
            message.destroy();
            message.success("模拟测评记录保存成功");
            // Actual: await SaveUserTrainDataAPI({ text: selectedText, ...mockScoreData });
        }
        // --- End Mock ---

      } catch (error) {
        message.destroy();
        message.error("调用评分接口时出错");
        console.error("Error processing score:", error);
      } finally {
         cleanupWebSocket(); // Cleanup after scoring attempt
      }
  }, [cleanupWebSocket, isEvaluationMode, onScoreUpdate, selectedText, setDysarthriaResult]);


  const connectAndStartStreaming = useCallback(() => {
    if (!token) {
      message.error("用户未登录，无法开始录音");
      return false;
    }
    if (wsRef.current) {
      console.log("WebSocket already connected or connecting.");
      return false; // Indicate connection already exists or is in progress
    }

    // Reset state for new session
    setTranscription("");
    setRecordingUuid(null);
    setDysarthriaResult({}); // Clear previous score in context
    audioBufferRef.current = [];

    const wsUrl = `ws://localhost:8080`; // Use your actual WS URL
    // const wsUrl = `ws://${import.meta.env.VITE_API_WS_URL}/asr/`; // Use your actual WS URL
    console.log("Connecting to WebSocket:", wsUrl);
    wsRef.current = new WebSocket(wsUrl);
    setIsAnalyzing(true);
    message.loading("正在连接语音服务...", 0);

    wsRef.current.onopen = () => {
      message.destroy();
      message.success("连接成功，请开始说话");
      console.log("WebSocket connected. Sending token.");
      wsRef.current?.send(token);

      // Start sending interval
      sendIntervalRef.current = setInterval(async () => {
        if (audioBufferRef.current.length > 0) {
          const chunksToSend = [...audioBufferRef.current];
          audioBufferRef.current = []; // Clear buffer

          const audioBlob = new Blob(chunksToSend, { type: 'audio/webm;codecs=opus' }); // Assuming this type works
          if (audioBlob.size > 0) {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              try {
                const arrayBuffer = await audioBlob.arrayBuffer();
                if (arrayBuffer.byteLength > 0) {
                  wsRef.current.send(arrayBuffer);
                }
              } catch (error) {
                console.error("Error converting Blob to ArrayBuffer or sending:", error);
              }
            }
          }
        }
      }, 100); // Send interval
    };

    wsRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data as string);
        // console.log("WebSocket message received:", data); // Optional: keep for debugging specific messages

        switch (data.event) {
            case "result-generated":
                setTranscription(data.text || "");
                if (onTranscriptionUpdate) onTranscriptionUpdate(data.text || "");
                break;
            case "task-finished":
                console.log("ASR task finished.");
                message.loading("分析完成，正在获取评分...", 0);
                break;
            case "recording-saved":
                message.destroy();
                const uuid = data.uuid;
                console.log("Recording saved with UUID:", uuid);
                setRecordingUuid(uuid);
                setIsAnalyzing(false); // ASR part is done
                if (uuid) {
                    await processScoreAndSave(uuid); // Process score and save if needed
                } else {
                    message.error("未能获取录音ID，无法评分");
                    cleanupWebSocket();
                }
                break;
            case "task-failed":
                message.destroy();
                message.error(`语音识别任务失败: ${data.error || '未知错误'}`);
                console.error("ASR task failed:", data);
                cleanupWebSocket();
                break;
            default:
                // console.log("Unknown WebSocket event:", data.event); // Optional
                break;
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message or handle it:", error);
      }
    };

    wsRef.current.onerror = (event) => {
      message.destroy();
      message.error("WebSocket 连接出错");
      console.error("WebSocket error:", event);
      cleanupWebSocket();
    };

    wsRef.current.onclose = (event) => {
      message.destroy();
      console.log("WebSocket closed:", event.code, event.reason);
      if (isAnalyzing) { // If closed unexpectedly while "analyzing"
         message.info("语音服务连接已断开");
      }
      cleanupWebSocket(); // Ensure cleanup on close
    };

    return true; // Indicate connection attempt started
  }, [token, cleanupWebSocket, onTranscriptionUpdate, processScoreAndSave, setDysarthriaResult]);

  const sendAudioData = useCallback((data: Blob) => {
    // Buffer the data, the interval will pick it up
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        audioBufferRef.current.push(data);
    } else {
        // console.warn("WebSocket not open, cannot buffer audio data."); // Optional warning
    }
  }, []);

  const finishStreaming = useCallback(async () => {
    console.log('Finishing streaming...');
    // Clear interval immediately
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    // Send any remaining buffered data immediately
    if (audioBufferRef.current.length > 0) {
        const finalChunks = [...audioBufferRef.current];
        audioBufferRef.current = [];
        const audioBlob = new Blob(finalChunks, { type: 'audio/webm;codecs=opus' });
        if (audioBlob.size > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                const arrayBuffer = await audioBlob.arrayBuffer();
                if (arrayBuffer.byteLength > 0) {
                    console.log(`Sending final audio ArrayBuffer, size: ${arrayBuffer.byteLength}`);
                    wsRef.current.send(arrayBuffer);
                }
            } catch (error) {
                console.error("Error sending final audio chunk:", error);
            }
        }
    }

    // Send "finish" signal
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      console.log("Sending 'finish' message.");
      wsRef.current.send("finish");
      message.loading("录音结束，正在等待最终分析结果...", 0);
    } else {
       console.warn("WebSocket not open when trying to send 'finish'. Cleaning up.");
       cleanupWebSocket();
    }
  }, [cleanupWebSocket]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, [cleanupWebSocket]);

  return {
    isAnalyzing,
    transcription,
    recordingUuid,
    connectAndStartStreaming,
    sendAudioData,
    finishStreaming,
  };
};

