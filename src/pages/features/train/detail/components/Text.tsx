import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import { Button, CircularProgress, Typography } from "@mui/material";
import { useState } from "react";
import { useTextContext } from "../context/TextContext";
import { message } from "antd"; // Import message

export const Text = ({ text, index }: { text: string; index: number }) => {
  const {
    setSelectedText,
    selectedTextIndex,
    setSelectedTextIndex,
    isPlaying,
    playAudio,
    getAudio,
    setDysarthriaResult,
  } = useTextContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectText = () => {
    setSelectedText(text);
    setSelectedTextIndex(index);
    setIsLoading(true);
    getAudio(text, index).then((audio) => {
      // 检查 audio 是否有效
      if (audio) {
        playAudio(audio);
      } else {
        // 如果 audio 为 null，则不播放，并确保 isLoading 状态正确
        // message.error 已经在 getAudio 中调用，这里可以选择不重复显示
        console.error("Failed to get audio for text:", text);
      }
      setIsLoading(false); // 无论成功或失败，都结束加载状态
    });
    setDysarthriaResult({});
  };

  return (
    <div>
      <Button
        className="relative"
        fullWidth
        onClick={handleSelectText}
        startIcon={selectedTextIndex === index && <ArrowRightRoundedIcon />}
        endIcon={selectedTextIndex === index && <ArrowLeftRoundedIcon />}
        // variant={index === selectedTextIndex ? "outlined" : "text"}
      >
        <Typography
          variant="body1"
          className="w-full"
          color={
            isPlaying && selectedTextIndex === index ? "primary" : "textPrimary"
          }
        >
          <strong>{text}</strong>
        </Typography>
        {isLoading && (
          <CircularProgress className="absolute right-5px" size={18} />
        )}
      </Button>
    </div>
  );
};
