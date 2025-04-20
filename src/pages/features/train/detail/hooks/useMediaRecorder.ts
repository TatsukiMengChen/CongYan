import { useRef, useState, useCallback, useEffect } from 'react';
import { message } from 'antd';

interface UseMediaRecorderProps {
  onDataAvailable: (data: ArrayBuffer) => void; // 修改为 ArrayBuffer 以发送 MP3 数据
  onStop?: () => void;
  onError?: (error: Error) => void;
  targetSampleRate?: number; // 添加目标采样率
  mp3BitRate?: number; // 添加 MP3 比特率
}

const TARGET_SAMPLE_RATE_DEFAULT = 48000; // 默认目标采样率
const MP3_BIT_RATE_DEFAULT = 128; // 默认 MP3 比特率
const SCRIPT_PROCESSOR_BUFFER_SIZE = 4096; // ScriptProcessor 缓冲区大小

export const useMediaRecorder = ({
  onDataAvailable,
  onStop,
  onError,
  targetSampleRate = TARGET_SAMPLE_RATE_DEFAULT,
  mp3BitRate = MP3_BIT_RATE_DEFAULT,
}: UseMediaRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(isRecording); // 用于回调函数跟踪录制状态的 Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mp3EncoderRef = useRef<Mp3Encoder | null>(null); // 使用全局声明的 Mp3Encoder 类型

  // Effect 使 ref 与 state 保持同步
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  const cleanupAudioResources = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
      mediaStreamSourceRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e)); // 保留错误日志
    }
    audioContextRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    mp3EncoderRef.current = null; // 清理编码器引用
    setIsRecording(false); // 确保状态更新
    isRecordingRef.current = false; // 确保 ref 也更新
  }, []);


  const stopRecordingInternal = useCallback((sendFinalChunk: boolean = true) => {
    if (!isRecordingRef.current && !audioContextRef.current) {
      cleanupAudioResources();
      return;
    }
    setIsRecording(false);
    isRecordingRef.current = false;

    // 停止音频处理节点
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (mediaStreamSourceRef.current) {
      mediaStreamSourceRef.current.disconnect();
    }

    // 停止媒体流
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    // Flush MP3 编码器并发送最后的数据块
    if (mp3EncoderRef.current && sendFinalChunk) {
      const finalMp3Data = mp3EncoderRef.current.flush();
      if (finalMp3Data.length > 0) {
        onDataAvailable(finalMp3Data.buffer); // 发送最后的 ArrayBuffer
      }
    }

    // 关闭 AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(e => console.error("Error closing AudioContext:", e)); // 保留错误日志
    }

    // 清理引用
    processorRef.current = null;
    mediaStreamSourceRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    mp3EncoderRef.current = null;

    if (onStop) {
      onStop();
    }
  }, [cleanupAudioResources, onDataAvailable, onStop]);


  const startRecording = useCallback(async () => {
    if (isRecording) {
      return;
    }

    try {
      // 1. 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. 创建 AudioContext (尝试目标采样率)
      let context: AudioContext;
      let actualSampleRate: number;
      try {
        // @ts-ignore
        context = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: targetSampleRate });
        actualSampleRate = context.sampleRate;
        if (actualSampleRate !== targetSampleRate) {
          console.warn(`实际采样率 (${actualSampleRate}Hz) 与目标 (${targetSampleRate}Hz) 不同。MP3 编码将使用目标速率，但如果不进行重采样，输入质量可能会受到影响。`); // 保留警告
        }
      } catch (e) {
        console.warn(`无法使用 ${targetSampleRate}Hz 创建 AudioContext，回退到默认值。错误: ${e}`); // 保留警告
        // @ts-ignore
        context = new (window.AudioContext || window.webkitAudioContext)();
        actualSampleRate = context.sampleRate;
        console.warn(`目标 MP3 采样率 (${targetSampleRate}Hz) 与 context 速率 (${actualSampleRate}Hz) 差异显著。建议进行重采样以保证质量。`); // 保留警告
      }
      audioContextRef.current = context;

      // 3. 创建 MediaStreamSource 和 ScriptProcessor
      mediaStreamSourceRef.current = context.createMediaStreamSource(stream);
      processorRef.current = context.createScriptProcessor(SCRIPT_PROCESSOR_BUFFER_SIZE, 1, 1); // 单声道输入输出

      // 4. 初始化 MP3 编码器 (使用目标采样率)
      mp3EncoderRef.current = new lamejs.Mp3Encoder(1, targetSampleRate, mp3BitRate);

      // 5. 设置 onaudioprocess 回调
      processorRef.current.onaudioprocess = (e: AudioProcessingEvent) => {
        if (!isRecordingRef.current) {
          return;
        }
        if (!mp3EncoderRef.current) {
          return;
        }

        const inputData = e.inputBuffer.getChannelData(0);

        // 如果 actualSampleRate !== targetSampleRate, 在此添加重采样逻辑

        // 转换为 16-bit PCM
        const samples = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const val = Math.max(-1, Math.min(1, inputData[i])); // Clamp values
          samples[i] = val * 32767;
        }

        // 编码为 MP3
        const mp3Buffer = mp3EncoderRef.current.encodeBuffer(samples);

        if (mp3Buffer.length > 0) {
          onDataAvailable(mp3Buffer.buffer);
        }
      };

      // 6. 连接节点: source -> processor -> destination
      // 连接到 destination 通常是必要的，以确保 onaudioprocess 触发
      mediaStreamSourceRef.current.connect(processorRef.current);
      processorRef.current.connect(context.destination);

      // 在所有设置完成后设置 state 和 ref
      setIsRecording(true);
      isRecordingRef.current = true;

    } catch (error) {
      console.error('Error starting recording:', error); // 保留错误日志
      message.error('无法访问麦克风或启动录音');
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      cleanupAudioResources(); // 启动失败时清理资源
    }
  }, [isRecording, onDataAvailable, onError, targetSampleRate, mp3BitRate, cleanupAudioResources]);

  const stopRecording = useCallback(() => {
    stopRecordingInternal(true); // 调用内部停止函数，并发送最后的数据块
  }, [stopRecordingInternal]);

  return { isRecording, startRecording, stopRecording };
};
