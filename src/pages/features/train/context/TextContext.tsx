import React, { createContext, useContext, useState } from "react";
import { DysarthriaResult, GetTTSAPI } from "../../../../api/train";

type TextContextType = {
  selectedText: string;
  setSelectedText: (text: string) => void;
  selectedTextIndex: number;
  setSelectedTextIndex: (index: number) => void;
  audios: string[];
  setAudios: (audios: string[]) => void;
  currentAudio: HTMLAudioElement | null;
  setCurrentAudio: (audio: HTMLAudioElement | null) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
  dysarthriaResult: DysarthriaResult;
  setDysarthriaResult: (result: DysarthriaResult) => void;
  getAudio: (text: string, index: number) => Promise<string>;
  playAudio: (audioBase64: string) => void;
};

const TextContext = createContext<TextContextType | undefined>(undefined);

export const useTextContext = () => {
  const context = useContext(TextContext);
  if (!context) {
    throw new Error("useTextContext must be used within a TextProvider");
  }
  return context;
};

export const TextProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectedTextIndex, setSelectedTextIndex] = useState<number>(0);
  const [audios, setAudios] = useState<string[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [dysarthriaResult, setDysarthriaResult] = useState<DysarthriaResult>(
    {},
  );

  const playAudio = (audioBase64: string) => {
    currentAudio?.pause();
    const audio = new Audio("data:audio/mp3;base64," + audioBase64);
    setCurrentAudio(audio);
    audio.play();
    setIsPlaying(true);
    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  const getAudio = async (text: string, index: number) => {
    if (audios[index]) {
      return audios[index];
    } else {
      const res = await GetTTSAPI(text);
      if (res.code === 200) {
        if (res.data?.audioBase64) {
          const newAudios = [...audios];
          newAudios[index] = res.data.audioBase64;
          setAudios(newAudios);
          return res.data.audioBase64;
        }
        return "";
      } else {
        // throw new Error("No audioBase64 in response data");
        return "";
      }
    }
  };

  return (
    <TextContext.Provider
      value={{
        selectedText,
        setSelectedText,
        selectedTextIndex,
        setSelectedTextIndex,
        audios,
        setAudios,
        currentAudio,
        setCurrentAudio,
        isPlaying,
        setIsPlaying,
        dysarthriaResult,
        setDysarthriaResult,
        getAudio,
        playAudio,
      }}
    >
      {children}
    </TextContext.Provider>
  );
};
