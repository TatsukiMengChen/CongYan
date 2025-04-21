import {
  useTheme
} from "@mui/material";
import { message } from "antd";
import { useMemo, useState } from "react";
import {
  GetHanziPhoneticsAPI,
  HanziPhonetics,
} from "../../../../../api/hanzi";
import { DysarthriaResult } from "../../../../../api/train"; // 引入 CharScore
import { useTextContext } from "../context/TextContext";
import { CharacterDetailPopup } from "./CharacterDetailPopup"; // Import the new component

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
  const [isPopupVisible, setIsPopupVisible] = useState(false);
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

  // Get audio functions/state from context
  const {
    isPlaying,
    setIsPlaying,
    playAudio,
    getCharAudio,
    currentAudio,
    isFetchingAudio,
  } = useTextContext();

  const handleShowDetail = (char: string, indexInSelected: number) => {
    setIsPopupVisible(true);
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

  // Define handlers to pass to the popup
  const handlePlayRequest = () => {
    if (!detail.char || isFetchingAudio) return; // Prevent playing if no char or already fetching
    getCharAudio(detail.char).then((audio) => {
      if (audio) {
        playAudio(audio); // playAudio handles setting isPlaying=true
      } else {
        // Error handled within getCharAudio/playAudio, maybe reset state here if needed
        setIsPlaying(false);
      }
    });
  };

  const handleStopRequest = () => {
    if (currentAudio) {
      currentAudio.pause();
    }
    setIsPlaying(false);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    // Optionally reset phonetics info when closing
    // setPhoneticsInfo(null);
    // Stop audio if playing when popup closes
    if (isPlaying && currentAudio) {
        currentAudio.pause();
        setIsPlaying(false);
    }
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

      {/* Render the CharacterDetailPopup component */}
      <CharacterDetailPopup
        visible={isPopupVisible}
        onClose={handleClosePopup}
        detail={detail}
        phoneticsInfo={phoneticsInfo}
        isFetchingPhonetics={isFetchingPhonetics}
        // Pass audio state and handlers from context/local functions
        isAudioPlaying={isPlaying}
        isAudioLoading={isFetchingAudio}
        onPlayAudio={handlePlayRequest}
        onStopAudio={handleStopRequest}
      />
    </div>
  );
};
