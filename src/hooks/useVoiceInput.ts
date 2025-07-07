import { useState, useRef, useCallback, useEffect } from "react";
import { message } from "antd";
import useAuthStore from "../store/auth";

interface UseVoiceInputProps {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: Error) => void;
}

export const useVoiceInput = ({
  onTranscriptionComplete,
  onError,
}: UseVoiceInputProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mp3EncoderRef = useRef<Mp3Encoder | null>(null);
  const audioBufferRef = useRef<ArrayBuffer[]>([]);
  const sendIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingRef = useRef(false);
  const latestTranscriptionRef = useRef<string>("");

  const { token } = useAuthStore();

  // 清理所有资源
  const cleanupAllResources = useCallback(() => {
    // 清理录音资源
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current
        .close()
        .catch((e) => console.error("Error closing AudioContext:", e));
    }
    audioContextRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mp3EncoderRef.current = null;

    // 清理WebSocket资源
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    audioBufferRef.current = [];
    if (wsRef.current) {
      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
    }
    wsRef.current = null;

    // 重置状态
    setIsRecording(false);
    setIsProcessing(false);
    setIsConnecting(false);
    isRecordingRef.current = false;
    latestTranscriptionRef.current = "";
  }, []);

  // 发送音频数据到缓冲区
  const sendAudioData = useCallback((data: ArrayBuffer) => {
    if (data.byteLength > 0) {
      audioBufferRef.current.push(data);
    }
  }, []);

  // 连接WebSocket
  const connectWebSocket = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!token) {
        message.error("用户未登录，无法开始语音识别");
        reject(new Error("User not logged in"));
        return;
      }

      if (wsRef.current) {
        reject(new Error("WebSocket connection already exists"));
        return;
      }

      setIsConnecting(true);
      setTranscription("");
      latestTranscriptionRef.current = "";
      audioBufferRef.current = [];

      const wsUrl = `wss://${import.meta.env.VITE_API_WS_URL}/asr`;
      try {
        wsRef.current = new WebSocket(wsUrl);
        wsRef.current.binaryType = "arraybuffer";
      } catch (error) {
        message.error("语音服务连接失败");
        setIsConnecting(false);
        reject(error);
        return;
      }

      const currentWs = wsRef.current;

      currentWs.onopen = () => {
        try {
          currentWs.send(token);

          // 启动100ms的发送间隔
          if (sendIntervalRef.current) {
            clearInterval(sendIntervalRef.current);
          }
          sendIntervalRef.current = setInterval(() => {
            if (
              wsRef.current &&
              wsRef.current.readyState === WebSocket.OPEN &&
              audioBufferRef.current.length > 0
            ) {
              const buffersToSend = [...audioBufferRef.current];
              audioBufferRef.current = [];

              const totalLength = buffersToSend.reduce(
                (acc, val) => acc + val.byteLength,
                0,
              );
              if (totalLength === 0) return;

              const combinedBuffer = new Uint8Array(totalLength);
              let offset = 0;
              buffersToSend.forEach((buffer) => {
                combinedBuffer.set(new Uint8Array(buffer), offset);
                offset += buffer.byteLength;
              });

              try {
                wsRef.current.send(combinedBuffer.buffer);
              } catch (error) {
                console.error("WebSocket send error:", error);
                message.error("发送音频数据时出错");
                cleanupAllResources();
              }
            }
          }, 100);

          setIsConnecting(false);
          resolve();
        } catch (error) {
          message.error("发送认证令牌失败");
          setIsConnecting(false);
          reject(error);
          cleanupAllResources();
        }
      };

      currentWs.onmessage = async (event) => {
        try {
          if (event.data instanceof ArrayBuffer) {
            return; // 忽略二进制数据
          }

          const data = JSON.parse(event.data as string);

          switch (data.event) {
            case "result-generated":
              const newTranscription = data.text || "";
              setTranscription(newTranscription);
              latestTranscriptionRef.current = newTranscription;
              break;
            case "task-finished":
              break;
            case "recording-saved":
              setIsProcessing(false);
              const finalText = latestTranscriptionRef.current;
              if (finalText && onTranscriptionComplete) {
                onTranscriptionComplete(finalText);
              }
              cleanupAllResources();
              break;
            case "task-failed":
              message.error(`语音识别失败: ${data.error || "未知错误"}`);
              setIsProcessing(false);
              cleanupAllResources();
              break;
            default:
              break;
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      };

      currentWs.onerror = (event) => {
        message.error("语音服务连接出错");
        console.error("WebSocket error:", event);
        setIsConnecting(false);
        reject(new Error("WebSocket connection error"));
        cleanupAllResources();
      };

      currentWs.onclose = (event) => {
        if (wsRef.current === currentWs) {
          cleanupAllResources();
        }
      };
    });
  }, [token, cleanupAllResources, onTranscriptionComplete]);

  // 开始录音
  const startRecording = useCallback(async () => {
    if (isRecording || isProcessing || isConnecting) {
      return;
    }

    try {
      // 1. 连接WebSocket
      await connectWebSocket();

      // 2. 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 3. 创建AudioContext
      const context = new (window.AudioContext ||
        (window as any).webkitAudioContext)({
        sampleRate: 48000,
      });
      audioContextRef.current = context;

      // 4. 创建音频节点
      mediaStreamSourceRef.current = context.createMediaStreamSource(stream);
      processorRef.current = context.createScriptProcessor(4096, 1, 1);

      // 5. 初始化MP3编码器
      mp3EncoderRef.current = new lamejs.Mp3Encoder(1, 48000, 128);

      // 6. 设置音频处理回调
      processorRef.current.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isRecordingRef.current || !mp3EncoderRef.current) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);
        const samples = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const val = Math.max(-1, Math.min(1, inputData[i]));
          samples[i] = val * 32767;
        }

        const mp3Buffer = mp3EncoderRef.current.encodeBuffer(samples);
        if (mp3Buffer.length > 0) {
          sendAudioData(mp3Buffer.buffer);
        }
      };

      // 7. 连接音频节点
      mediaStreamSourceRef.current.connect(processorRef.current);
      processorRef.current.connect(context.destination);

      // 8. 更新状态
      setIsRecording(true);
      isRecordingRef.current = true;
      setTranscription("");
      latestTranscriptionRef.current = "";
    } catch (error) {
      console.error("Error starting voice input:", error);
      message.error("无法启动语音输入");
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      cleanupAllResources();
    }
  }, [
    isRecording,
    isProcessing,
    isConnecting,
    connectWebSocket,
    sendAudioData,
    onError,
  ]);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (!isRecording) {
      return;
    }

    setIsRecording(false);
    isRecordingRef.current = false;
    setIsProcessing(true);

    // 停止音频处理
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // 清除发送间隔并发送剩余数据
    if (sendIntervalRef.current) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }

    // 发送剩余的音频数据
    if (
      wsRef.current &&
      wsRef.current.readyState === WebSocket.OPEN &&
      audioBufferRef.current.length > 0
    ) {
      const buffersToSend = [...audioBufferRef.current];
      audioBufferRef.current = [];

      const totalLength = buffersToSend.reduce(
        (acc, val) => acc + val.byteLength,
        0,
      );
      if (totalLength > 0) {
        const combinedBuffer = new Uint8Array(totalLength);
        let offset = 0;
        buffersToSend.forEach((buffer) => {
          combinedBuffer.set(new Uint8Array(buffer), offset);
          offset += buffer.byteLength;
        });

        try {
          wsRef.current.send(combinedBuffer.buffer);
        } catch (error) {
          console.error("WebSocket send error (final buffer):", error);
        }
      }
    }

    // 发送最后的MP3数据
    if (mp3EncoderRef.current) {
      const finalMp3Data = mp3EncoderRef.current.flush();
      if (finalMp3Data.length > 0) {
        sendAudioData(finalMp3Data.buffer);
      }
    }

    // 发送结束信号
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send("finish");
      } catch (error) {
        console.error("Error sending 'finish' message:", error);
        cleanupAllResources();
      }
    } else {
      cleanupAllResources();
    }

    // 清理录音资源
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current
        .close()
        .catch((e) => console.error("Error closing AudioContext:", e));
    }
    audioContextRef.current = null;
    streamRef.current = null;
    processorRef.current = null;
    mediaStreamSourceRef.current = null;
    mp3EncoderRef.current = null;
  }, [isRecording, sendAudioData, cleanupAllResources]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      cleanupAllResources();
    };
  }, [cleanupAllResources]);

  return {
    isRecording,
    isProcessing,
    isConnecting,
    transcription,
    startRecording,
    stopRecording,
  };
};
