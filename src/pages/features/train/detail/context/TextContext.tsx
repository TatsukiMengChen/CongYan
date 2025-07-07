import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from "react";
import { DysarthriaResult } from "../../../../../api/train"; // Keep this import
import { GetTTSAPI } from "../../../../../api/tts"; // Updated import path
import { message } from "antd";
import { vivoAigcSDK } from "../../../../../api/vivoAigc"; // 新增：导入vivoAigc SDK

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
  isRecording: boolean; // 新增：录音状态
  setIsRecording: (isRecording: boolean) => void; // 新增：设置录音状态
  isFetchingAudio: boolean;
  setIsFetchingAudio: (isFetching: boolean) => void;
  dysarthriaResult: DysarthriaResult;
  setDysarthriaResult: (result: DysarthriaResult) => void;
  asrTranscription: string; // 新增：实时 ASR 结果
  setAsrTranscription: (text: string) => void; // 新增：设置 ASR 结果
  // 新增：AI绘画相关状态
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
  isGeneratingImage: boolean;
  setIsGeneratingImage: (isGenerating: boolean) => void;
  imageLoadingState: "idle" | "loading" | "loaded" | "error";
  setImageLoadingState: (
    state: "idle" | "loading" | "loaded" | "error",
  ) => void;
  getAudio: (text: string, index: number) => Promise<HTMLAudioElement | null>;
  getCharAudio: (char: string) => Promise<HTMLAudioElement | null>;
  playAudio: (audio: HTMLAudioElement | null) => void;
  generateBackgroundImage: (title: string, text: string) => Promise<void>;
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
  const [isRecording, setIsRecording] = useState<boolean>(false); // 新增状态
  const [isFetchingAudio, setIsFetchingAudio] = useState<boolean>(false);
  const [dysarthriaResult, setDysarthriaResult] = useState<DysarthriaResult>(
    {},
  );
  const [asrTranscription, setAsrTranscription] = useState<string>(""); // 新增状态
  // 新增：AI绘画相关状态
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageLoadingState, setImageLoadingState] = useState<
    "idle" | "loading" | "loaded" | "error"
  >("idle");
  const [pendingRequests, setPendingRequests] = useState<{
    [key: string]: boolean;
  }>({});
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  const playAudio = useCallback(
    (audio: HTMLAudioElement | null) => {
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
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsPlaying(false); // 如果播放失败，重置状态
        message.error("播放音频失败");
      });
      setIsPlaying(true);
    },
    [currentAudio],
  ); // 依赖 currentAudio

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
    [], // 依赖项为空，因为函数内部不依赖外部可变状态（除了 ref 和 state setters）
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
    [], // 依赖项为空
  );

  // 新增：生成背景图片的函数
  const generateBackgroundImage = useCallback(
    async (title: string, text: string): Promise<void> => {
      try {
        setIsGeneratingImage(true);

        // 第一步：使用70b模型生成符合意境的绘画提示词
        const promptInstruction = `请根据以下训练文本的标题和内容，生成一个符合意境的绘画提示词。要求：
1. 提示词应该是中文，描述一个美丽的场景
2. 适合作为发音训练的背景图片
3. 风格温和，有助于康复训练的氛围
4. 不要包含文字或人物
5. 只返回绘画提示词，不要其他解释

标题：${title}
内容：${text}

请生成绘画提示词：`;

        const drawPrompt = await vivoAigcSDK.chat.chat(promptInstruction, {
          model: "vivo-BlueLM-TB-Pro",
          temperature: 0.7,
          maxTokens: 100,
        });

        console.log("Generated draw prompt:", drawPrompt);

        // 第二步：使用生成的提示词生成图片
        const images = await vivoAigcSDK.draw.generateImageFromText(
          drawPrompt,
          {
            width: 576,
            height: 1024,
            styleConfig: "4cbc9165bc615ea0815301116e7925a3", // 通用v6.0
          },
        );

        if (images && images.length > 0) {
          setImageLoadingState("loading");
          setBackgroundImage(images[0]);
          message.success("智能配图生成成功！");
        } else {
          setImageLoadingState("error");
          message.error("图片生成失败");
        }
      } catch (error: any) {
        console.error("Generate background image error:", error);
        message.error("生成配图失败：" + (error.message || "未知错误"));
      } finally {
        setIsGeneratingImage(false);
      }
    },
    [],
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
        isRecording, // 提供状态
        setIsRecording, // 提供 setter
        isFetchingAudio,
        setIsFetchingAudio,
        dysarthriaResult,
        setDysarthriaResult,
        asrTranscription, // 提供状态
        setAsrTranscription, // 提供 setter
        // 新增：AI绘画相关状态和函数
        backgroundImage,
        setBackgroundImage,
        isGeneratingImage,
        setIsGeneratingImage,
        imageLoadingState,
        setImageLoadingState,
        getAudio,
        getCharAudio,
        playAudio,
        generateBackgroundImage,
      }}
    >
      {children}
    </TextContext.Provider>
  );
};
