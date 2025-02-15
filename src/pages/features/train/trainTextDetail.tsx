import ArrowLeftRoundedIcon from "@mui/icons-material/ArrowLeftRounded";
import ArrowRightRoundedIcon from "@mui/icons-material/ArrowRightRounded";
import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import {
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  DysarthriaAPI,
  DysarthriaResult,
  GetPinyinAPI,
  GetPinyinDetailAPI,
  PinyinDetail,
} from "../../../api/train";
import Navbar from "../../../components/Navbar";
import { TextProvider, useTextContext } from "./context/TextContext";
import Popup from "antd-mobile/es/components/popup";
import { GetPronunciationDesc } from "../../../utils/text";
import { Skeleton } from "antd-mobile";

type TextDataType = {
  title: string;
  author: string;
  text: string;
  category: string;
  suggestedDuration: string;
  applicablePeople: string;
  grade: string;
};

const Text = ({ text, index }: { text: string; index: number }) => {
  const {
    setSelectedText,
    selectedTextIndex,
    setSelectedTextIndex,
    isPlaying,
    playAudio,
    getAudio,
  } = useTextContext();
  const [isLoading, setIsLoading] = useState(false);

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
  const { setSelectedText, setSelectedTextIndex } = useTextContext();

  useEffect(() => {
    setSelectedText(textData[0]);
    setSelectedTextIndex(0);
  }, [textData]);

  return (
    <div className="h-full overflow-y-auto p-4">
      {textData.map((text, index) => (
        <Text key={index} text={text} index={index} />
      ))}
    </div>
  );
};

const DysarthriaText = ({
  text,
  result,
}: {
  text: Array<string>;
  result: DysarthriaResult;
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState<{
    char: string;
    score: number | null;
    sm: string;
    ym: string;
    sd: string;
  }>({
    char: "",
    score: null,
    sm: "",
    ym: "",
    sd: "",
  });
  const [pinyin, setPinyin] = useState<string | null>(null);
  const [pinyinDetail, setPinyinDetail] = useState<PinyinDetail | null>(null);

  const getColor = (score: number) => {
    if (score >= 90) {
      return theme.palette.success.main;
    } else if (score >= 80) {
      return theme.palette.primary.main;
    } else if (score >= 60) {
      return theme.palette.warning.main;
    } else if (score == -1) {
      return theme.palette.text.primary;
    } else {
      return theme.palette.error.main;
    }
  };

  const handleShowDetail = (char: string, index: number) => {
    setVisible(true);
    setDetail({
      char: char,
      score: result.single_score?.[index] ?? null,
      sm: result.sm?.[index] ?? "",
      ym: result.ym?.[index] ?? "",
      sd: result.sd?.[index] ?? "",
    });
    GetPinyinAPI(char).then((res) => {
      if (res.code === 200 && res.data) {
        setPinyin(res.data.pinyin ? res.data.pinyin[0] : null);
      }
    });
    GetPinyinDetailAPI(char).then((res) => {
      if (res.code === 200 && res.data) {
        setPinyinDetail(res.data);
      }
    });
  };

  return (
    <div
      className="relative box-border max-h-48 w-full overflow-y-auto rounded-md p-4"
      style={{ boxShadow: "rgba(149, 157, 165, 0.2) 0px 8px 24px" }}
    >
      <strong className="flex-center flex-wrap text-lg space-x-2">
        {text.map((t, index) => (
          <span
            key={index}
            onClick={() => {
              handleShowDetail(t, index);
            }}
            style={{ color: getColor(result.single_score?.[index] ?? -1) }}
          >
            {t}
          </span>
        ))}
      </strong>

      <span
        className="absolute right-1 top-0"
        style={{ color: getColor(result.total_score ?? -1) }}
      >
        <strong>{result.total_score}</strong>
      </span>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
          setPinyin(null);
          setPinyinDetail(null);
        }}
        bodyStyle={{
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          minHeight: "40vh",
        }}
      >
        {visible && (
          <div className="p-4">
            <Typography variant="h5">
              <div className="mb--1">
                <strong>{pinyin ? pinyin : <Skeleton.Title animated />}</strong>
              </div>
              <div>
                <strong>{detail.char}</strong>
              </div>
            </Typography>
            <Divider />
            <Typography variant="h6">
              <strong>分析结果：</strong>
            </Typography>
            <Typography variant="body1">
              <strong>得分：</strong>
              {detail.score}
            </Typography>
            <Typography variant="body1">
              <strong>声母：</strong>
              {GetPronunciationDesc(detail.sm)}
            </Typography>
            <Typography variant="body1">
              <strong>韵母：</strong>
              {GetPronunciationDesc(detail.ym)}
            </Typography>
            <Typography variant="body1">
              <strong>声调：</strong>
              {GetPronunciationDesc(detail.sd)}
            </Typography>
            <Divider />
            <Typography variant="h6">
              <strong>发音详情：</strong>
            </Typography>
            {pinyinDetail ? (
              <div>
                <Typography variant="body1">
                  <strong>声母：</strong>
                  {pinyinDetail?.sm_detail?.[0]?.letter}
                </Typography>
                <Typography variant="body2">
                  <strong>发音部位：</strong>
                  {pinyinDetail?.sm_detail?.[0]?.articulationPoint}
                </Typography>
                <Typography variant="body2">
                  <strong>发音方法：</strong>
                  {pinyinDetail?.sm_detail?.[0]?.pronunciationMethod}
                </Typography>
                <Typography variant="body1">
                  <strong>韵母：</strong>
                  {pinyinDetail?.ym_detail?.[0]?.letter}
                </Typography>
                <Typography variant="body2">
                  <strong>发音类型：</strong>
                  {pinyinDetail?.ym_detail?.[0]?.pronunciationType}
                </Typography>
                <Typography variant="body2">
                  <strong>粗结构：</strong>
                  {pinyinDetail?.ym_detail?.[0]?.roughStructure}
                </Typography>
                <Typography variant="body2">
                  <strong>细结构：</strong>
                  {pinyinDetail?.ym_detail?.[0]?.smoothStructure}
                </Typography>
                <Typography variant="body1">
                  <strong>音调：</strong>第 {pinyinDetail?.textPinyin?.sd?.[0]}{" "}
                  声
                </Typography>
              </div>
            ) : (
              <Skeleton.Paragraph lineCount={5} animated />
            )}
          </div>
        )}
      </Popup>
    </div>
  );
};

const FunctionalArea = ({ text }: { text: string }) => {
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
    dysarthriaResult,
    setDysarthriaResult,
  } = useTextContext();

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const getChineseCharacters = (text: string) => {
    const chineseCharacters = text.match(/[\u4e00-\u9fa5]/g) || [];
    return chineseCharacters;
  };

  const handlePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      currentAudio?.pause();
    } else {
      getAudio(selectedText, selectedTextIndex).then((audio) => {
        playAudio(audio!);
        setIsPlaying(true);
      });
    }
  };

  const handleRecordStart = async () => {
    if (isRecording) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        audioChunksRef.current = [];
        stream.getTracks().forEach((track) => track.stop());

        // 调用 DysarthriaAPI 接口
        const audioFile = new File([audioBlob], "recording.wav", {
          type: "audio/wav",
        });
        try {
          const res = await DysarthriaAPI(selectedText, audioFile);
          if (res.code == 200 && res?.data) {
            setDysarthriaResult(res.data);
          }
        } catch (error) {
          console.error("Error calling DysarthriaAPI:", error);
        }
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const handleRecordEnd = async () => {
    if (!isRecording || !mediaRecorderRef.current) {
      return;
    }

    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="box-border w-full flex flex-col px-4 pb-8">
      <DysarthriaText
        text={getChineseCharacters(selectedText || "")}
        result={dysarthriaResult}
      />
      <div className="flex-evenly mt-4 w-full">
        <IconButton
          className="!bg-white dark:!bg-dark-4"
          color="primary"
          onClick={handlePlay}
          sx={{
            width: "60px",
            height: "60px",
            boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
          }}
        >
          {isPlaying ? (
            <PauseRoundedIcon color="primary" fontSize="large" />
          ) : (
            <PlayArrowRoundedIcon color="action" fontSize="large" />
          )}
        </IconButton>
        <Button
          variant="outlined"
          size="large"
          onClick={() => {
            setSelectedText(text);
            setSelectedTextIndex(-1);
          }}
        >
          全文练习
        </Button>
        <IconButton
          className="!bg-white dark:!bg-dark-4"
          color="primary"
          onClick={isRecording ? handleRecordEnd : handleRecordStart}
          sx={{
            width: "60px",
            height: "60px",
            boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
          }}
        >
          {isRecording ? (
            <MicRoundedIcon color="primary" fontSize="large" />
          ) : (
            <MicNoneRoundedIcon color="action" fontSize="large" />
          )}
        </IconButton>
      </div>

      {/* 添加 audio 组件用于播放录制的音频
      {audioUrl && (
        <div className="mt-4">
          <audio controls src={audioUrl}>
            Your browser does not support the audio element.
          </audio>
        </div>
      )} */}
    </div>
  );
};

const NavArea = ({ title, author }: { title: string; author: string }) => {
  const navigator = useNavigate();
  const { currentAudio } = useTextContext();
  return (
    <Navbar
      onBack={() => {
        currentAudio?.pause();
        navigator(-1);
      }}
    >
      <div>
        <div className="text-14px">{title}</div>
        <div className="text-3">{author}</div>
      </div>
    </Navbar>
  );
};

const TrainTextDetailPage = () => {
  const location = useLocation();
  const { text }: { text: TextDataType } = location.state;
  const [textData, setTextData] = useState<string[]>([]);

  useEffect(() => {
    setTextData(text.text.split("\n"));
  }, []);

  return (
    <TextProvider>
      <div className="h-100vh flex flex-col">
        <NavArea title={text.title} author={text.author} />
        <div className="relative h-full flex flex-col overflow-hidden">
          <TextArea textData={textData} />
          <FunctionalArea text={text.text} />
        </div>
      </div>
    </TextProvider>
  );
};

export default TrainTextDetailPage;
