import { useRef, useState, useCallback } from 'react';
import { message } from 'antd';

interface UseMediaRecorderProps {
  onDataAvailable: (data: Blob) => void;
  onStop?: () => void;
  onError?: (error: Error) => void;
  timeslice?: number; // e.g., 100ms
}

export const useMediaRecorder = ({
  onDataAvailable,
  onStop,
  onError,
  timeslice = 100,
}: UseMediaRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopRecordingInternal = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop(); // onstop will handle stream track stopping
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
    }
    setIsRecording(false);
    mediaRecorderRef.current = null;
  }, []);


  const startRecording = useCallback(async () => {
    if (isRecording) {
      console.warn('Already recording.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream; // Store stream reference

      const options = { mimeType: 'audio/webm;codecs=opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(`${options.mimeType} is not Supported. Using default.`);
        options.mimeType = '';
      }

      const recorder = new MediaRecorder(stream, options.mimeType ? options : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          onDataAvailable(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('MediaRecorder stopped.');
        stream.getTracks().forEach((track) => track.stop()); // Ensure tracks are stopped
        streamRef.current = null; // Clear stream ref
        setIsRecording(false); // Ensure state is updated
        mediaRecorderRef.current = null; // Clear recorder ref
        if (onStop) {
          onStop();
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        const error = new Error('MediaRecorder error'); // Create a generic error or try to get more specific info
        if (onError) {
          onError(error);
        }
        stopRecordingInternal(); // Stop recording on error
      };

      recorder.start(timeslice);
      setIsRecording(true);
      console.log(`MediaRecorder started with ${timeslice}ms timeslice.`);

    } catch (error) {
      console.error('Error accessing microphone or starting recorder:', error);
      message.error('无法访问麦克风或启动录音');
      if (onError) {
        onError(error as Error);
      }
      stopRecordingInternal(); // Ensure cleanup if start fails
    }
  }, [isRecording, onDataAvailable, onError, onStop, timeslice, stopRecordingInternal]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) {
      console.warn('Not recording or recorder not initialized.');
      return;
    }
    console.log('Stopping recording via hook...');
    // stopRecordingInternal will be called by the onstop handler,
    // but we call stop() on the recorder here.
    if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
    } else {
        // If already stopped or inactive, ensure state is correct
        setIsRecording(false);
    }
  }, [isRecording]);

  // Cleanup on unmount
  // useEffect(() => {
  //   return () => {
  //     stopRecordingInternal();
  //   };
  // }, [stopRecordingInternal]);


  return { isRecording, startRecording, stopRecording };
};
