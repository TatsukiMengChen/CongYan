import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { DysarthriaResult } from "../../../../../api/train"; // Keep this import
import { GetTTSAPI } from "../../../../../api/tts"; // Updated import path
import { message } from "antd";

type TextContextType = {
  selectedText: string;
  setSelectedText: (text: string) => void;
  selectedTextIndex: number;
  setSelectedTextIndex: (index: number) => void;
  audios: string[];
  setAudios: (audios: string[]) => void;
  charAudios: { [key: string]: string };
  setCharAudios: (charAudios: { [key: string]: string }) => void;
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  isFetchingAudio: boolean;
  setIsFetchingAudio: (isFetching: boolean) => void;
  dysarthriaResult: DysarthriaResult;
  setDysarthriaResult: (result: DysarthriaResult) => void;
  getAudio: (text: string, index: number) => Promise<HTMLAudioElement | null>;
  getCharAudio: (char: string) => Promise<HTMLAudioElement | null>;
  playAudio: (audio: HTMLAudioElement | null) => void;
};

const TextContext = createContext<TextContextType | undefined>(undefined);

export const useTextContext = () => {
  const context = useContext(TextContext);
  if (!context) {
    throw new Error("useTextContext must be used within a TextProvider");
  }
  return context;
};

export const TextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedTextIndex, setSelectedTextIndex] = useState<number>(0);
  const [audios, setAudios] = useState<string[]>([]);
  const [charAudios, setCharAudios] = useState<{ [key: string]: string }>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isFetchingAudio, setIsFetchingAudio] = useState<boolean>(false);
  const [dysarthriaResult, setDysarthriaResult] = useState<DysarthriaResult>(
    {},
  );
  const [pendingRequests, setPendingRequests] = useState<{
    [key: string]: boolean;
  }>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playAudio = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) {
      console.warn("Attempted to play null audio.");
      setIsPlaying(false);
      return;
    }
    if (currentAudio && currentAudio !== audio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    setCurrentAudio(audio);
    audio.play().catch(err => {
      console.error("Error playing audio:", err);
      setIsPlaying(false); // 如果播放失败，重置状态
      message.error("播放音频失败");
    });
    setIsPlaying(true);
  }, [currentAudio]); // 依赖 currentAudio

  const getAudio = useCallback(
    async (text: string, index: number): Promise<HTMLAudioElement | null> => {
      const cacheKey = `${index}-${text}`;
      if (audioCache.current[cacheKey]) {
        return audioCache.current[cacheKey];
      }
      setIsFetchingAudio(true); // 开始获取音频
      try {
        // Call API imported from tts.ts
        const voice = localStorage.getItem("sentenceTTSVoice") || "longwan"; // 默认值
        const res = await GetTTSAPI(text, voice);
        // 更新检查逻辑以匹配新的 API 响应
        if (res.status === 0 && res.audio) {
          // 假设 res.audio 是一个 Base64 编码的音频数据
          const audioSrc = `data:audio/wav;base64,${res.audio}`; // 或其他音频格式
          const audio = new Audio(audioSrc);
          audio.onended = () => {
            setIsPlaying(false);
          };
          audioCache.current[cacheKey] = audio;
          return audio;
        } else {
          // 使用 API 返回的 message 或默认消息
          message.error(res.message || "获取音频失败");
          console.error("TTS API failed:", res.message);
          return null;
        }
      } catch (error: any) {
        // GetTTSAPI 内部已处理网络错误并返回统一结构，这里理论上不会捕获网络错误
        // 但保留以防万一
        message.error("加载音频时发生意外错误");
        console.error("Unexpected error fetching TTS audio:", error);
        return null;
      } finally {
        setIsFetchingAudio(false); // 结束获取音频
      }
    },
    [] // 依赖项为空，因为函数内部不依赖外部可变状态（除了 ref 和 state setters）
  );

  const getCharAudio = useCallback(
    async (char: string): Promise<HTMLAudioElement | null> => {
      const cacheKey = `char-${char}`;
      if (audioCache.current[cacheKey]) {
        return audioCache.current[cacheKey];
      }
      setIsFetchingAudio(true); // 开始获取音频
      try {
        // Call API imported from tts.ts
        const voice = localStorage.getItem("characterTTSVoice") || "longwan"; // 默认值
        const res = await GetTTSAPI(char, voice);
        // 更新检查逻辑以匹配新的 API 响应
        if (res.status === 0 && res.audio) {
          // 假设 res.audio 是一个 Base64 编码的音频数据
          const audioSrc = `data:audio/wav;base64,${res.audio}`;
          const audio = new Audio(audioSrc);
          audio.onended = () => {
            setIsPlaying(false);
          };
          audioCache.current[cacheKey] = audio;
          return audio;
        } else {
          message.error(res.message || "获取单字音频失败");
          console.error("TTS API failed for char:", res.message);
          return null; // 返回 null 表示失败
        }
      } catch (error: any) {
        message.error("加载单字音频时发生意外错误");
        console.error("Unexpected error fetching TTS char audio:", error);
        return null; // 返回 null 表示失败
      } finally {
        setIsFetchingAudio(false); // 结束获取音频
      }
    },
    [] // 依赖项为空
  );

  return (
    <TextContext.Provider
      value={{
        selectedText,
        setSelectedText,
        selectedTextIndex,
        setSelectedTextIndex,
        audios,
        setAudios,
        charAudios,
        setCharAudios,
        currentAudio,
        setCurrentAudio,
        isPlaying,
        setIsPlaying,
        isFetchingAudio,
        setIsFetchingAudio,
        dysarthriaResult,
        setDysarthriaResult,
        getAudio,
        getCharAudio,
        playAudio,
      }}
    >
      {children}
    </TextContext.Provider>
  );
};
