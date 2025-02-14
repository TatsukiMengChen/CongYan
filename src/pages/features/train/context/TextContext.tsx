import React, { createContext, useContext, useState } from "react";

type TextContextType = {
  selectedText: string;
  setSelectedText: (text: string) => void;
  selectedTextIndex: number;
  setSelectedTextIndex: (index: number) => void;
  audios: string[];
  setAudios: (audios: string[]) => void;
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
  return (
    <TextContext.Provider
      value={{
        selectedText,
        setSelectedText,
        selectedTextIndex,
        setSelectedTextIndex,
        audios,
        setAudios,
      }}
    >
      {children}
    </TextContext.Provider>
  );
};
