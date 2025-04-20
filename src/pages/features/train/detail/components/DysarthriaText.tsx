import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  CircularProgress,
  Divider,
  IconButton,
  Typography,
  useTheme,
} from "@mui/material";
import { message } from "antd";
import { Skeleton } from "antd-mobile";
import Popup from "antd-mobile/es/components/popup";
import { useState } from "react";
import {
  GetHanziPhoneticsAPI, // 导入新的 API
  HanziPhonetics, // 导入新的类型
} from "../../../../../api/hanzi";
import { DysarthriaResult } from "../../../../../api/train";
import { useTextContext } from "../context/TextContext";

export const DysarthriaText = ({
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
  }>({
    char: "",
    score: null,
  });
  // 使用新的状态来存储从 /hanzi-phonetics 获取的信息
  const [phoneticsInfo, setPhoneticsInfo] = useState<HanziPhonetics | null>(null);
  const [isFetchingPhonetics, setIsFetchingPhonetics] = useState(false); // 加载状态

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
    });
    setPhoneticsInfo(null); // 清空旧信息
    setIsFetchingPhonetics(true); // 开始加载
    // 调用新的 API
    GetHanziPhoneticsAPI(char).then((res) => {
      if (res.status === 0 && res.phonetics) {
        setPhoneticsInfo(res.phonetics);
      } else {
        message.error(res.message || "获取拼音详情失败");
        console.error("Failed to get phonetics:", res.message);
      }
      setIsFetchingPhonetics(false); // 结束加载
    });
  };

  const {
    isPlaying,
    setIsPlaying,
    playAudio,
    getCharAudio,
    currentAudio,
    isFetchingAudio,
  } = useTextContext();

  const handlePlayCharAudio = () => {
    if (isFetchingAudio) return;
    getCharAudio(detail.char).then((audio) => {
      if (audio) {
        playAudio(audio);
      } else {
        console.error("Failed to get audio for char:", detail.char);
        setIsPlaying(false);
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
            className="cursor-pointer" // 添加指针样式提示可点击
          >
            {t}
          </span>
        ))}
      </strong>

      <span
        className="absolute right-1 top-0"
        style={{ color: getColor(result.total_score ?? -1) }}
      >
        <strong>{result.total_score?.toFixed(1)}</strong> {/* 保留一位小数 */}
      </span>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
          setPhoneticsInfo(null); // 关闭时清空
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
                <strong>
                  {isFetchingPhonetics ? (
                    <Skeleton.Title animated />
                  ) : (
                    phoneticsInfo?.pinyin_with_tone_mark ?? "..."
                  )}
                </strong>
              </div>
              <div>
                <strong>
                  <span>{detail.char}</span>
                  {/* 单个字发音按钮 */}
                  <IconButton
                    className="!bg-white dark:!bg-dark-4"
                    color="primary"
                    disabled={isFetchingAudio || isFetchingPhonetics} // 获取拼音或音频时禁用
                    onClick={() => {
                      if (isPlaying) {
                        setIsPlaying(false);
                        currentAudio?.pause();
                      } else {
                        handlePlayCharAudio();
                      }
                    }}
                    sx={{
                      width: "8px",
                      height: "8px",
                      marginLeft: "10px",
                      marginBottom: "5px",
                      boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                      padding: isFetchingAudio ? '4px' : '8px' // Example adjustment
                    }}
                  >
                    {isFetchingAudio ? (
                      <CircularProgress size={20} />
                    ) : isPlaying ? (
                      <PauseCircleIcon color="primary" fontSize="large" />
                    ) : (
                      <PlayCircleIcon color="action" fontSize="large" />
                    )}
                  </IconButton>
                </strong>
              </div>
            </Typography>
            <Divider />
            <Typography variant="h6">
              <strong>分析结果：</strong>
            </Typography>
            <Typography variant="body1">
              <strong>得分：</strong>
              {detail.score?.toFixed(1) ?? "N/A"} {/* 保留一位小数 */}
            </Typography>
            {/* 显示从 GetHanziPhoneticsAPI 获取的声母、韵母、声调 */}
            {isFetchingPhonetics ? (
              <>
                <Skeleton.Paragraph lineCount={3} animated />
              </>
            ) : phoneticsInfo ? (
              <>
                <Typography variant="body1">
                  <strong>声母：</strong>
                  {phoneticsInfo.shengmu || "无"}
                </Typography>
                <Typography variant="body1">
                  <strong>韵母：</strong>
                  {phoneticsInfo.yunmu || "无"}
                </Typography>
                <Typography variant="body1">
                  <strong>声调：</strong>
                  {phoneticsInfo.yindiao !== undefined ? `第 ${phoneticsInfo.yindiao} 声` : "N/A"}
                </Typography>
              </>
            ) : (
               <Typography variant="body2" color="textSecondary">
                未能加载标准发音信息。
              </Typography>
            )}
            <Divider />
            <Typography variant="h6">
              <strong>发音详情：</strong>
            </Typography>
            {isFetchingPhonetics ? (
              <Skeleton.Paragraph lineCount={5} animated />
            ) : phoneticsInfo ? (
              <div>
                <Typography variant="body1">
                  <strong>声母：</strong>
                  {phoneticsInfo.shengmu || "无"}
                </Typography>
                {phoneticsInfo.shengmu_fayin_buwei && (
                  <Typography variant="body2">
                    <strong>发音部位：</strong>
                    {phoneticsInfo.shengmu_fayin_buwei}
                  </Typography>
                )}
                {phoneticsInfo.shengmu_fayin_fangshi && (
                  <Typography variant="body2">
                    <strong>发音方法：</strong>
                    {phoneticsInfo.shengmu_fayin_fangshi}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>韵母：</strong>
                  {phoneticsInfo.yunmu || "无"}
                </Typography>
                {phoneticsInfo.yunmu_jiegou && (
                  <Typography variant="body2">
                    <strong>韵母结构：</strong>
                    {phoneticsInfo.yunmu_jiegou}
                  </Typography>
                )}
                <Typography variant="body1">
                  <strong>音调：</strong>第 {phoneticsInfo.yindiao} 声
                </Typography>
              </div>
            ) : (
              <Typography variant="body2" color="textSecondary">
                未能加载发音详情。
              </Typography>
            )}
          </div>
        )}
      </Popup>
    </div>
  );
};
