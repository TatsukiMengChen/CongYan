import { Button } from "@mui/material"; // Removed Typography import
import { message } from "antd";
import { useState, useCallback } from "react"; // Removed useEffect, useRef
// Removed API imports handled by hooks
import { useTextContext } from "../context/TextContext";
import { DysarthriaText } from "./DysarthriaText";
import { EvaluationModeSwitch } from "./EvaluationModeSwitch";
import { PlaybackControls } from "./PlaybackControls";
import { RecordingControls } from "./RecordingControls";
import { useMediaRecorder } from "../hooks/useMediaRecorder"; // Import MediaRecorder hook
import { useWebSocketASR } from "../hooks/useWebSocketASR"; // Import WebSocket hook

// Removed ScoreRecordingAPI declaration

export const FunctionalArea = ({ text }: { text: string }) => {
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
    dysarthriaResult, // Get score result from context
    setDysarthriaResult, // Keep setter to clear on text change
    isFetchingAudio,
  } = useTextContext();

  const [isEvaluationMode, setIsEvaluationMode] = useState(false);

  // WebSocket ASR Hook
  const {
    isAnalyzing,
    // transcription, // Not directly displayed anymore, but available if needed
    connectAndStartStreaming,
    sendAudioData,
    finishStreaming,
  } = useWebSocketASR({
      isEvaluationMode,
      selectedText: selectedText || "", // Pass selected text
      // onTranscriptionUpdate: (text) => console.log("ASR:", text), // Optional callback
      // onScoreUpdate: (score) => console.log("Score:", score), // Optional callback
  });

  // MediaRecorder Hook
  const { isRecording, startRecording, stopRecording } = useMediaRecorder({
    onDataAvailable: sendAudioData, // Send data via WebSocket hook
    // onStop: () => { console.log("Recorder stopped via hook callback"); }, // Optional callback
    onError: (error) => {
        message.error(`录音出错: ${error.message}`);
        // Consider stopping WebSocket connection if recorder fails critically
        finishStreaming(); // Or call a specific cleanup function in WebSocket hook
    },
    timeslice: 100,
  });

  // Combined state for disabling controls during critical phases
  const isBusy = isRecording || isAnalyzing;

  // Make handleRecordStart async
  const handleRecordStart = useCallback(async () => {
    if (isBusy) {
      message.warning(isRecording ? "正在录音中..." : "正在连接或分析中...");
      return;
    }
    setDysarthriaResult({}); // Clear previous results

    try {
      // Wait for WebSocket connection to be established and token sent
      await connectAndStartStreaming();
      // If connectAndStartStreaming resolves, connection is open and token is sent
      message.success("连接成功，请开始说话"); // Show success message now
      // Now start the recorder
      await startRecording(); // Assuming startRecording might become async if needed, await it just in case
      // If startRecording fails, the onError handler in useMediaRecorder should trigger cleanup

    } catch (error) {
      // connectAndStartStreaming rejected (WebSocket error or closed before open)
      // or startRecording failed (though its errors are handled in its hook)
      console.error("Failed to start recording session:", error);
      // Error messages are likely already shown by the hooks (WebSocket or MediaRecorder)
      // Ensure isAnalyzing is false if connection failed (cleanupWebSocket in hook should handle this)
    }
  }, [isBusy, connectAndStartStreaming, startRecording, setDysarthriaResult, isRecording, isAnalyzing]); // Added async

  const handleRecordEnd = useCallback(async () => {
    if (!isRecording) {
      return;
    }
    stopRecording(); // Stops MediaRecorder via hook
    // The onStop callback in useMediaRecorder is less reliable timing-wise
    // We rely on finishStreaming to handle final chunks and 'finish' message
    await finishStreaming(); // Handles final send and 'finish' message via WebSocket hook
  }, [isRecording, stopRecording, finishStreaming]);


  const getChineseCharacters = (text: string) => {
    const chineseCharacters = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseCharacters;
  };

  const handlePlay = () => {
    if (isFetchingAudio || isBusy) return; // Don't play if fetching or recording/analyzing

    if (isPlaying) {
      setIsPlaying(false);
      currentAudio?.pause();
    } else {
      getAudio(selectedText, selectedTextIndex).then((audio) => {
        if (audio) {
          playAudio(audio);
        } else {
          console.error("Failed to get audio for playback.");
          setIsPlaying(false);
        }
      });
    }
  };

  // Cleanup function if user switches text while busy
  const handleTextSwitchCleanup = useCallback(() => {
      if (isRecording) {
          stopRecording();
      }
      // finishStreaming includes WebSocket cleanup
      finishStreaming();
  }, [isRecording, stopRecording, finishStreaming]);


  return (
    <div className="box-border w-full flex flex-col px-4 pb-8">
      <DysarthriaText
        text={getChineseCharacters(selectedText || "")}
        result={dysarthriaResult} // Display score from context
      />

      <div className="mt-4 w-full flex flex-col items-center">
        <div className="w-full flex-evenly">
          <PlaybackControls
            isPlaying={isPlaying}
            isFetchingAudio={isFetchingAudio}
            handlePlay={handlePlay}
            // disabled={isBusy} // Disable playback while recording/analyzing
          />
          <Button
            variant="outlined"
            size="large"
            onClick={() => {
              setSelectedText(text);
              setSelectedTextIndex(-1);
              setDysarthriaResult({}); // Clear score result
              if (isPlaying) {
                currentAudio?.pause();
                setIsPlaying(false);
              }
              if (isBusy) {
                 handleTextSwitchCleanup(); // Stop recording/WS if busy
              }
            }}
            disabled={isBusy} // Disable while recording/analyzing
          >
            全文练习
          </Button>
          <RecordingControls
            isRecording={isRecording}
            handleRecordStart={handleRecordStart}
            handleRecordEnd={handleRecordEnd}
            // disabled={isAnalyzing && !isRecording} // Disable if analyzing but not yet recording (connecting phase)
          />
        </div>
        <EvaluationModeSwitch
          isEvaluationMode={isEvaluationMode}
          setIsEvaluationMode={setIsEvaluationMode}
          // disabled={isBusy} // Optionally disable mode switch while busy
        />
      </div>
    </div>
  );
};
