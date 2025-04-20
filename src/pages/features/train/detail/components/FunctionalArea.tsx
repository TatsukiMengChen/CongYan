import { Button } from "@mui/material";
import { message } from "antd";
import { useState, useCallback } from "react";
import { useTextContext } from "../context/TextContext";
import { DysarthriaText } from "./DysarthriaText";
import { EvaluationModeSwitch } from "./EvaluationModeSwitch";
import { PlaybackControls } from "./PlaybackControls";
import { RecordingControls } from "./RecordingControls";
import { useMediaRecorder } from "../hooks/useMediaRecorder"; // 导入 MediaRecorder hook
import { useWebSocketASR } from "../hooks/useWebSocketASR"; // 导入 WebSocket hook

// FunctionalArea 组件的 Props 定义
interface FunctionalAreaProps {
  text: string; // 用于显示和选择的文本内容 (完整文本)
  textUuid: string; // 用于评分 API 的文本 UUID
}

export const FunctionalArea = ({ text, textUuid }: FunctionalAreaProps) => {
  // console.log("[FunctionalArea] Received props - textUuid:", textUuid); // 移除日志

  const {
    selectedText,
    setSelectedText,
    selectedTextIndex,
    setSelectedTextIndex,
    isPlaying,
    setIsPlaying,
    playAudio,
    getAudio,
    currentAudio,
    dysarthriaResult, // 从 context 获取评分结果
    setDysarthriaResult, // 保留 setter 用于文本更改时清除
    isFetchingAudio,
  } = useTextContext();

  const [isEvaluationMode, setIsEvaluationMode] = useState(false);

  // WebSocket ASR Hook
  const {
    isAnalyzing, // 直接使用 isAnalyzing 进行按钮逻辑判断
    connectAndStartStreaming,
    sendAudioData, // 这个函数现在接收 ArrayBuffer
    finishStreaming,
  } = useWebSocketASR({
      isEvaluationMode,
      selectedText: selectedText || "", // 传递选中的文本
      textUuid: textUuid, // 传递文本 UUID
      // onTranscriptionUpdate: (text) => {}, // 可选回调
      // onScoreUpdate: (score) => {}, // 可选回调
  });

  // MediaRecorder Hook
  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onDataAvailable: sendAudioData, // 将 MP3 ArrayBuffer 传递给 WebSocket hook
    onError: (error) => {
        message.error(`录音出错: ${error.message}`);
        // 如果录音出错，也尝试清理 WebSocket 连接
        finishStreaming(); // 调用 finishStreaming 会触发 cleanupWebSocket
    },
  });

  // 用于在关键阶段禁用控件的组合状态
  const isBusy = isRecording || isAnalyzing;

  // 使 handleRecordStart 异步
  const handleRecordStart = useCallback(async () => {
    if (isBusy) {
      message.warning(isRecording ? "正在录音中..." : "正在连接或分析中...");
      return;
    }
    setDysarthriaResult({}); // 清除之前的结果

    try {
      // 等待 WebSocket 连接建立并发送令牌
      await connectAndStartStreaming();
      // 如果 connectAndStartStreaming 解析成功，则连接已打开且令牌已发送
      message.success("连接成功，请开始说话"); // 现在显示成功消息
      // 现在启动录音器
      await startRecording();
      // 如果 startRecording 失败，useMediaRecorder 中的 onError 处理程序应触发清理

    } catch (error) {
      // connectAndStartStreaming 被拒绝 (WebSocket 错误或在打开前关闭)
      // 或 startRecording 失败 (尽管其错误在其 hook 中处理)
      console.error("Failed to start recording session:", error); // 保留错误日志
      // 错误消息可能已由 hooks (WebSocket 或 MediaRecorder) 显示
    }
  }, [isBusy, connectAndStartStreaming, startRecording, setDysarthriaResult, isRecording, isAnalyzing]);

  const handleRecordEnd = useCallback(async () => {
    if (!isRecording) {
      // console.log("Not recording, cannot stop."); // 移除日志
      return;
    }
    // console.log("handleRecordEnd called."); // 移除日志
    // 1. 停止录音器 (会触发最后的 onDataAvailable 发送 final MP3 chunk)
    stopRecording(); // 这个函数现在是同步的

    // 2. 告诉 WebSocket 服务器流结束 (发送 "finish")
    await finishStreaming();

  }, [isRecording, stopRecording, finishStreaming]);


  const getChineseCharacters = (text: string) => {
    const chineseCharacters = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseCharacters;
  };

  const handlePlay = () => {
    if (isFetchingAudio || isBusy) return; // 如果正在获取音频或录音/分析中，则不播放

    if (isPlaying) {
      setIsPlaying(false);
      currentAudio?.pause();
    } else {
      getAudio(selectedText, selectedTextIndex).then((audio) => {
        if (audio) {
          playAudio(audio);
        } else {
          console.error("Failed to get audio for playback."); // 保留错误日志
          setIsPlaying(false);
        }
      });
    }
  };

  // 如果用户在忙碌时切换文本，执行清理函数
  const handleTextSwitchCleanup = useCallback(() => {
      if (isRecording) {
          stopRecording();
      }
      // finishStreaming 包含 WebSocket 清理
      finishStreaming();
  }, [isRecording, stopRecording, finishStreaming]);


  return (
    <div className="box-border w-full flex flex-col px-4 pb-8">
      {/* 将 selectedText 的字符、完整评分结果、完整文本和选中片段传递给 DysarthriaText */}
      <DysarthriaText
        selectedTextChars={getChineseCharacters(selectedText || "")}
        result={dysarthriaResult} // 显示来自 context 的评分 (可能是全文的)
        fullText={text} // 传递完整文本
        selectedText={selectedText || ""} // 传递当前选中的文本
      />

      <div className="mt-4 w-full flex flex-col items-center">
        <div className="w-full flex-evenly">
          <PlaybackControls
            isPlaying={isPlaying}
            isFetchingAudio={isFetchingAudio}
            handlePlay={handlePlay}
            // disabled={isBusy} // 禁用播放按钮
          />
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setSelectedText(text);
              setSelectedTextIndex(-1);
              setDysarthriaResult({}); // 清除评分结果
              if (isPlaying) {
                currentAudio?.pause();
                setIsPlaying(false);
              }
              if (isBusy) {
                 handleTextSwitchCleanup(); // 如果忙碌，停止录音/WS
              }
            }}
            disabled={isBusy} // 禁用全文练习按钮
          >
            全文练习
          </Button>
          <RecordingControls
            isRecording={isRecording}
            handleRecordStart={handleRecordStart}
            handleRecordEnd={handleRecordEnd}
            // 仅在连接或录音后分析期间禁用按钮
            // 即，当 isAnalyzing 为 true 且 isRecording 为 false 时。
            disabled={isAnalyzing && !isRecording}
          />
        </div>
        <EvaluationModeSwitch
          isEvaluationMode={isEvaluationMode}
          setIsEvaluationMode={setIsEvaluationMode}
          // disabled={isBusy} // 禁用模式切换
        />
      </div>
    </div>
  );
};
