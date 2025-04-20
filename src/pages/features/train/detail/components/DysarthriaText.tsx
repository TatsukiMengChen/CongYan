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
import { DysarthriaResult } from "../../../../../api/train";
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

export const DysarthriaText = ({
  selectedTextChars, // Now represents only the characters of the selected text
  result,
  fullText, // The complete original text
  selectedText, // The currently selected text segment
}: {
  selectedTextChars: Array<string>;
  result: DysarthriaResult;
  fullText: string;
  selectedText: string;
}) => {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState<{
    char: string;
    score: number; // Score will be 0-100 (no longer null)
  }>({
    char: "",
    score: 0, // Initialize with 0
  });
  const [phoneticsInfo, setPhoneticsInfo] = useState<HanziPhonetics | null>(null);
  const [isFetchingPhonetics, setIsFetchingPhonetics] = useState(false);

  // --- Scoring Logic ---
  const { startIndex, calculatedTotalScore } = useMemo(() => {
    const fullTextChars = getChineseChars(fullText);
    // Find the starting index of selectedTextChars within fullTextChars
    const startIdx = findSubArrayIndex(fullTextChars, selectedTextChars);

    let totalScoreSum = 0;
    let validScoreCount = 0;
    let calcTotalScore: number | null = null; // Keep null initially for "no text selected" case

    // Only calculate if text is selected and scores are available
    if (startIdx !== -1 && result.single_score && result.single_score.length > 0 && selectedTextChars.length > 0) {
      for (let i = 0; i < selectedTextChars.length; i++) {
        const scoreIndex = startIdx + i;
        if (scoreIndex < result.single_score.length) {
          const rawScore = result.single_score[scoreIndex];
          // Consider only 0 and 1 as valid scores for averaging
          if (rawScore === 0 || rawScore === 1) {
            totalScoreSum += rawScore; // Add 0 or 1
            validScoreCount++;
          }
        }
      }
      if (validScoreCount > 0) {
        calcTotalScore = (totalScoreSum / validScoreCount) * 100; // Calculate average and scale to 100
      } else {
        // If text selected but no valid scores found in the segment, default to 0
        calcTotalScore = 0;
      }
    } else if (selectedTextChars.length > 0) {
       // If text is selected, but scores are missing or startIdx is -1, default to 0
       calcTotalScore = 0;
    }
    // If selectedTextChars.length is 0, calcTotalScore remains null

    return { startIndex: startIdx, calculatedTotalScore: calcTotalScore };
  }, [fullText, selectedText, selectedTextChars, result.single_score]);
  // --- End Scoring Logic ---


  const getDisplayScore = (charIndexInSelected: number): number => {
    if (startIndex === -1 || !result.single_score) {
      return -1; // Cannot determine score
    }
    const scoreIndexInFull = startIndex + charIndexInSelected;
    if (scoreIndexInFull >= result.single_score.length) {
      return -1; // Index out of bounds
    }
    const rawScore = result.single_score[scoreIndexInFull];
    if (rawScore === 1) {
      return 100;
    } else if (rawScore === 0) {
      return 0;
    } else {
      return -1; // Treat other values (like undefined, null, or potential other numbers) as unscored
    }
  };


  const getColor = (displayScore: number) => {
    // Use displayScore (0-100 or -1) for coloring
    if (displayScore >= 90) { // 90-100
      return theme.palette.success.main;
    } else if (displayScore >= 80) { // 80-89
      return theme.palette.primary.main;
    } else if (displayScore >= 60) { // 60-79
      return theme.palette.warning.main;
    } else if (displayScore >= 0) { // 0-59
      return theme.palette.error.main;
    } else { // -1 (unscored)
      return theme.palette.text.primary;
    }
  };

  const handleShowDetail = (char: string, indexInSelected: number) => {
    setVisible(true);
    const displayScore = getDisplayScore(indexInSelected);
    setDetail({
      char: char,
      // Store score as 0-100. If unscored (-1), store 0.
      score: displayScore !== -1 ? displayScore : 0,
    });
    setPhoneticsInfo(null);
    setIsFetchingPhonetics(true);
    // ... (rest of the phonetics fetching logic remains the same)
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
              <strong>得分：</strong>
              {/* Display score from detail state (always 0-100) */}
              {detail.score.toFixed(1)}
            </Typography>
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
