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
import { useState, useMemo } from "react";
import {
  GetHanziPhoneticsAPI,
  HanziPhonetics,
} from "../../../../../api/hanzi";
import { DysarthriaResult, CharScore } from "../../../../../api/train"; // 引入 CharScore
import { useTextContext } from "../context/TextContext";

// Helper function to extract Chinese characters
const getChineseChars = (text: string): string[] => {
  return text.match(/[\u4e00-\u9fa5]/g) || [];
};

// Helper function to find subarray index
const findSubArrayIndex = (mainArray: string[], subArray: string[]): number => {
  if (!subArray.length) return 0; // Empty selected text starts at 0
  if (!mainArray.length) return -1; // Cannot find in empty main text

  for (let i = 0; (i = mainArray.indexOf(subArray[0], i)) !== -1; i++) {
    if (subArray.every((char, j) => mainArray[i + j] === char)) {
      return i;
    }
  }
  return -1; // Not found
};

// 更新 detail state 结构以包含详细分数
interface DetailState {
  char: string;
  score: number; // 主分数 (0-100)
  sim_sa: number | null; // 声母相似度 (0-100 or null)
  sim_ya: number | null; // 韵母相似度 (0-100 or null)
  sim_sd: number | null; // 声调相似度 (0-100 or null)
}

export const DysarthriaText = ({
  selectedTextChars, // Now represents only the characters of the selected text
  result, // result.single_score is now Array<CharScore>
  fullText, // The complete original text
  selectedText, // The currently selected text segment
}: {
  selectedTextChars: Array<string>;
  result: DysarthriaResult; // DysarthriaResult now contains single_score: CharScore[]
  fullText: string;
  selectedText: string;
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  // 更新 detail state 的初始值
  const [detail, setDetail] = useState<DetailState>({
    char: "",
    score: 0,
    sim_sa: null,
    sim_ya: null,
    sim_sd: null,
  });
  const [phoneticsInfo, setPhoneticsInfo] = useState<HanziPhonetics | null>(null);
  const [isFetchingPhonetics, setIsFetchingPhonetics] = useState(false);

  // --- Scoring Logic ---
  const { startIndex, calculatedTotalScore } = useMemo(() => {
    const fullTextChars = getChineseChars(fullText);
    const startIdx = findSubArrayIndex(fullTextChars, selectedTextChars);

    let totalScoreSum = 0;
    let validScoreCount = 0;
    let calcTotalScore: number | null = null;

    // 确保 result.single_score 是数组并且包含对象
    if (startIdx !== -1 && Array.isArray(result.single_score) && result.single_score.length > 0 && selectedTextChars.length > 0) {
      for (let i = 0; i < selectedTextChars.length; i++) {
        const scoreIndex = startIdx + i;
        // 检查索引有效性以及 score 对象和 score 属性是否存在
        if (scoreIndex < result.single_score.length && result.single_score[scoreIndex] && typeof result.single_score[scoreIndex].score === 'number') {
          const charScore = result.single_score[scoreIndex].score; // 获取 0-1 范围的分数
          // 仅累加有效的数字分数 (包括 0)
          if (!isNaN(charScore)) {
             totalScoreSum += charScore;
             validScoreCount++;
          }
        }
      }
      if (validScoreCount > 0) {
        // 计算平均分 (0-1 范围) 并乘以 100
        calcTotalScore = (totalScoreSum / validScoreCount) * 100;
      } else {
        // 如果选中文本但在该段内没有找到有效分数，则默认为 0
        calcTotalScore = 0;
      }
    } else if (selectedTextChars.length > 0) {
       // 如果选择了文本，但分数缺失或 startIdx 为 -1，则默认为 0
       calcTotalScore = 0;
    }
    // 如果 selectedTextChars.length 为 0，calcTotalScore 保持为 null

    return { startIndex: startIdx, calculatedTotalScore: calcTotalScore };
  }, [fullText, selectedTextChars, result.single_score]); // 依赖 result.single_score
  // --- End Scoring Logic ---


  // 返回 0-100 范围的分数或 -1
  const getDisplayScore = (charIndexInSelected: number): number => {
    if (startIndex === -1 || !Array.isArray(result.single_score)) {
      return -1; // 无法确定分数
    }
    const scoreIndexInFull = startIndex + charIndexInSelected;
    // 检查索引和分数对象的有效性
    if (scoreIndexInFull >= result.single_score.length || !result.single_score[scoreIndexInFull] || typeof result.single_score[scoreIndexInFull].score !== 'number') {
      return -1; // 索引越界或分数无效
    }
    const rawScore = result.single_score[scoreIndexInFull].score; // 获取 0-1 分数
    if (isNaN(rawScore)) {
        return -1; // 无效数字
    }
    return rawScore * 100; // 转换为 0-100
  };


  const getColor = (displayScore: number) => {
    // 使用 displayScore (0-100 或 -1) 进行着色
    if (displayScore >= 90) { // 90-100
      return theme.palette.success.main;
    } else if (displayScore >= 80) { // 80-89
      return theme.palette.primary.main;
    } else if (displayScore >= 60) { // 60-79
      return theme.palette.warning.main;
    } else if (displayScore >= 0) { // 0-59
      return theme.palette.error.main;
    } else { // -1 (未评分)
      return theme.palette.text.primary;
    }
  };

  const handleShowDetail = (char: string, indexInSelected: number) => {
    setVisible(true);
    let displayScore = 0;
    let sim_sa: number | null = null;
    let sim_ya: number | null = null;
    let sim_sd: number | null = null;

    // 获取详细分数对象
    if (startIndex !== -1 && Array.isArray(result.single_score)) {
        const scoreIndexInFull = startIndex + indexInSelected;
        if (scoreIndexInFull < result.single_score.length && result.single_score[scoreIndexInFull]) {
            const scoreObj = result.single_score[scoreIndexInFull];
            if (typeof scoreObj.score === 'number' && !isNaN(scoreObj.score)) {
                displayScore = scoreObj.score * 100; // 主分数 0-100
            }
            // 转换相似度分数 (0-100)，如果无效则为 null
            sim_sa = (typeof scoreObj.sim_sa === 'number' && !isNaN(scoreObj.sim_sa)) ? scoreObj.sim_sa * 100 : null;
            sim_ya = (typeof scoreObj.sim_ya === 'number' && !isNaN(scoreObj.sim_ya)) ? scoreObj.sim_ya * 100 : null;
            sim_sd = (typeof scoreObj.sim_sd === 'number' && !isNaN(scoreObj.sim_sd)) ? scoreObj.sim_sd * 100 : null;
        }
    }

    setDetail({
      char: char,
      score: displayScore, // 存储 0-100 的主分数
      sim_sa: sim_sa,
      sim_ya: sim_ya,
      sim_sd: sim_sd,
    });
    setPhoneticsInfo(null);
    setIsFetchingPhonetics(true);
    // ... (获取拼音信息的逻辑保持不变) ...
    GetHanziPhoneticsAPI(char).then((res) => {
      if (res.status === 0 && res.phonetics) {
        setPhoneticsInfo(res.phonetics);
      } else {
        message.error(res.message || "获取拼音详情失败");
        console.error("Failed to get phonetics:", res.message);
      }
      setIsFetchingPhonetics(false);
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
        {/* Iterate through selectedTextChars */}
        {selectedTextChars.map((t, index) => {
          const displayScore = getDisplayScore(index);
          return (
            <span
              key={index}
              onClick={() => {
                // Pass index relative to selectedTextChars
                handleShowDetail(t, index);
              }}
              style={{ color: getColor(displayScore) }}
              className="cursor-pointer"
            >
              {t}
            </span>
          );
        })}
      </strong>

      {/* Display the calculated total score for the selected segment */}
      <span
        className="absolute right-1 top-0"
        // Color based on the calculated average score (use 0 if null for coloring)
        style={{ color: getColor(calculatedTotalScore ?? 0) }}
      >
        <strong>
          {/* Show calculated score (0.0 if calculated), or N/A if no text selected */}
          {calculatedTotalScore !== null ? calculatedTotalScore.toFixed(1) : "N/A"}
        </strong>
      </span>
      <Popup
        visible={visible}
        onMaskClick={() => {
          setVisible(false);
          setPhoneticsInfo(null);
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
                  <IconButton
                    className="!bg-white dark:!bg-dark-4"
                    color="primary"
                    disabled={isFetchingAudio || isFetchingPhonetics}
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
                      padding: isFetchingAudio ? '4px' : '8px'
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
              <strong>总得分：</strong>
              {/* 显示来自 detail state 的主分数 (0-100) */}
              {detail.score !== null ? detail.score.toFixed(1) : "无"}
            </Typography>
            {/* 显示声母、韵母、声调相似度得分 */}
            <Typography variant="body1">
              <strong>声母得分：</strong>
              {detail.sim_sa !== null ? detail.sim_sa.toFixed(1) : "无"}
            </Typography>
            <Typography variant="body1">
              <strong>韵母得分：</strong>
              {detail.sim_ya !== null ? detail.sim_ya.toFixed(1) : "无"}
            </Typography>
            <Typography variant="body1">
              <strong>声调得分：</strong>
              {detail.sim_sd !== null ? detail.sim_sd.toFixed(1) : "无"}
            </Typography>
            {isFetchingPhonetics ? (
              <>
                <Skeleton.Paragraph lineCount={3} animated />
              </>
            ) : phoneticsInfo ? (
              <>
                {/* 标准发音信息部分保持不变 */}
                <Typography variant="body1">
                  <strong>标准声母：</strong>
                  {phoneticsInfo.shengmu || "无"}
                </Typography>
                <Typography variant="body1">
                  <strong>标准韵母：</strong>
                  {phoneticsInfo.yunmu || "无"}
                </Typography>
                <Typography variant="body1">
                  <strong>标准声调：</strong>
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
