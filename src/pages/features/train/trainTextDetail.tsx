import { useLocation, useNavigate } from "react-router";
import Navbar from "../../../components/Navbar";
import { useEffect, useState } from "react";
import { Button, CircularProgress, Typography } from "@mui/material";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import { TextProvider, useTextContext } from "./context/TextContext";
import { GetTTSAPI } from "../../../api/train";

type TextDataType = {
  title: string;
  author: string;
  text: string;
  category: string;
  suggestedDuration: string;
  applicablePeople: string;
  grade: string;
};

let currentAudio: HTMLAudioElement | null = null;

const Text = ({ text, index }: { text: string; index: number }) => {
  const {
    setSelectedText,
    selectedTextIndex,
    setSelectedTextIndex,
    audios,
    setAudios,
  } = useTextContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = (audioBase64: string) => {
    currentAudio?.pause();
    const audio = new Audio("data:audio/mp3;base64," + audioBase64);
    currentAudio = audio;
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
      } else {
        throw new Error("No audioBase64 in response data");
      }
    }
  };

  const handleSelectText = () => {
    setSelectedText(text);
    setSelectedTextIndex(index);
    setIsLoading(true);
    getAudio(text, index).then((audio) => {
      playAudio(audio!);
      setIsLoading(false);
    });
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

const TextArea = ({ textData }: { textData: string[] }) => {
  const { setSelectedText } = useTextContext();

  useEffect(() => {
    setSelectedText(textData[0]);
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4">
      {textData.map((text, index) => (
        <Text key={index} text={text} index={index} />
      ))}
    </div>
  );
};

const ControlArea = () => {
  const { selectedText } = useTextContext();

  return (
    <div className="h-12 flex-center">
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          console.log(selectedText);
        }}
      >
        提交
      </Button>
    </div>
  );
};

const TrainTextDetailPage = () => {
  const location = useLocation();
  const { text }: { text: TextDataType } = location.state;
  const [textData, setTextData] = useState<string[]>([]);
  const navigator = useNavigate();

  useEffect(() => {
    setTextData(text.text.split("\n"));
  }, []);

  return (
    <TextProvider>
      <div className="h-100vh flex flex-col">
        <Navbar
          onBack={() => {
            currentAudio?.pause();
            navigator(-1);
          }}
        >
          <div>
            <div className="text-14px">{text.title}</div>
            <div className="text-3">{text.author}</div>
          </div>
        </Navbar>
        <div className="relative h-full flex flex-col overflow-hidden">
          <TextArea textData={textData} />
          <ControlArea />
        </div>
      </div>
    </TextProvider>
  );
};

export default TrainTextDetailPage;
