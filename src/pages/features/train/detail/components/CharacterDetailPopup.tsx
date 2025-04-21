import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import PauseCircleIcon from "@mui/icons-material/PauseCircle";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import {
  CircularProgress,
  Divider,
  IconButton,
  Typography,
} from "@mui/material";
import { message } from "antd";
import { Skeleton } from "antd-mobile";
import Popup from "antd-mobile/es/components/popup";
import { useEffect, useState } from "react";
import {
  AddFavoriteCharacterAPI,
  CheckFavoriteCharacterAPI,
  DeleteFavoriteCharacterAPI,
} from "../../../../../api/favorite";
import { HanziPhonetics } from "../../../../../api/hanzi";
// Remove TextContext import
// import { useTextContext } from "../context/TextContext";

interface DetailState {
  char: string;
  score: number | null; // 主分数 (0-100 or null)
  sim_sa: number | null; // 声母相似度 (0-100 or null)
  sim_ya: number | null; // 韵母相似度 (0-100 or null)
  sim_sd: number | null; // 声调相似度 (0-100 or null)
}

interface CharacterDetailPopupProps {
  visible: boolean;
  onClose: () => void;
  detail: DetailState;
  phoneticsInfo: HanziPhonetics | null;
  isFetchingPhonetics: boolean;
  // New props for audio control from parent
  isAudioPlaying: boolean;
  isAudioLoading: boolean;
  onPlayAudio: () => void;
  onStopAudio: () => void;
}

export const CharacterDetailPopup = ({
  visible,
  onClose,
  detail,
  phoneticsInfo,
  isFetchingPhonetics,
  // Destructure new props
  isAudioPlaying,
  isAudioLoading,
  onPlayAudio,
  onStopAudio,
}: CharacterDetailPopupProps) => {
  // Remove state related to TextContext
  // const {
  //   isPlaying,
  //   setIsPlaying,
  //   playAudio,
  //   getCharAudio,
  //   currentAudio,
  //   isFetchingAudio,
  // } = useTextContext();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  // Fetch favorite status when popup opens or character changes
  useEffect(() => {
    if (visible && detail.char) {
      setIsCheckingFavorite(true);
      CheckFavoriteCharacterAPI(detail.char)
        .then((res) => {
          if (res.status === 0 && res.is_favorite !== undefined) {
            setIsFavorite(res.is_favorite);
          } else {
            console.error("Failed to check favorite status:", res.message);
            // Optionally show an error message, but don't block UI
          }
        })
        .finally(() => {
          setIsCheckingFavorite(false);
        });
    }
  }, [visible, detail.char]);

  // Remove handlePlayCharAudio as it's now handled by parent via onPlayAudio/onStopAudio
  // const handlePlayCharAudio = () => { ... };

  const handleToggleFavorite = async () => {
    if (isTogglingFavorite || isCheckingFavorite) return;
    setIsTogglingFavorite(true);
    try {
      let res;
      if (isFavorite) {
        // Currently favorite, so delete
        res = await DeleteFavoriteCharacterAPI({ character: detail.char });
        if (res.status === 0) {
          setIsFavorite(false);
          message.success("取消收藏成功");
        } else {
          message.error(res.message || "取消收藏失败");
        }
      } else {
        // Currently not favorite, so add
        res = await AddFavoriteCharacterAPI({ character: detail.char });
        if (res.status === 0) {
          setIsFavorite(true);
          message.success("收藏成功");
        } else {
          message.error(res.message || "收藏失败");
        }
      }
    } catch (error) {
      message.error("操作失败");
      console.error("Toggle favorite error:", error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  return (
    <Popup
      visible={visible}
      onMaskClick={onClose} // Use onClose passed from parent
      bodyStyle={{
        borderTopLeftRadius: "12px",
        borderTopRightRadius: "12px",
        minHeight: "40vh",
      }}
    >
      {visible && ( // Ensure content is rendered only when visible for state logic
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
            <div className="flex items-center">
              <strong>
                <span>{detail.char}</span>
                <IconButton
                  className="!bg-white dark:!bg-dark-4"
                  color="primary"
                  // Disable button if phonetics or audio is loading
                  disabled={isAudioLoading || isFetchingPhonetics}
                  onClick={() => {
                    // Use callbacks from props
                    if (isAudioPlaying) {
                      onStopAudio();
                    } else {
                      onPlayAudio();
                    }
                  }}
                  sx={{
                    width: "8px",
                    height: "8px",
                    marginLeft: "10px",
                    marginBottom: "5px",
                    boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
                    // Adjust padding for loading indicator
                    padding: isAudioLoading ? "4px" : "8px",
                  }}
                >
                  {/* Show loading indicator if audio is loading */}
                  {isAudioLoading ? (
                    <CircularProgress size={20} />
                  ) : // Show pause icon if playing
                    isAudioPlaying ? (
                      <PauseCircleIcon color="primary" fontSize="large" />
                    ) : (
                      // Show play icon otherwise
                      <PlayCircleIcon color="action" fontSize="large" />
                    )}
                </IconButton>
              </strong>
              {/* Favorite Button */}
              <IconButton
                color="error" // Use red color for favorite
                onClick={handleToggleFavorite}
                disabled={isCheckingFavorite || isTogglingFavorite || !detail.char}
                sx={{ marginLeft: "auto" }} // Push to the right
              >
                {isCheckingFavorite || isTogglingFavorite ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isFavorite ? (
                  <FavoriteIcon />
                ) : (
                  <FavoriteBorderIcon />
                )}
              </IconButton>
            </div>
          </Typography>
          <Divider />

          {/* Conditionally render Analysis Results only if score is available */}
          {detail.score !== null && (
            <>
              <Typography variant="h6">
                <strong>分析结果：</strong>
              </Typography>
              <Typography variant="body1">
                <strong>总得分：</strong>
                {/* Score is guaranteed non-null here by the condition */}
                {detail.score.toFixed(0)}
              </Typography>
              <Typography variant="body1">
                <strong>声母得分：</strong>
                {detail.sim_sa !== null ? detail.sim_sa.toFixed(0) : "无"}
              </Typography>
              <Typography variant="body1">
                <strong>韵母得分：</strong>
                {detail.sim_ya !== null ? detail.sim_ya.toFixed(0) : "无"}
              </Typography>
              <Typography variant="body1">
                <strong>声调得分：</strong>
                {detail.sim_sd !== null ? detail.sim_sd.toFixed(0) : "无"}
              </Typography>
            </>
          )}

          {/* Pronunciation Details (always shown if available) */}
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
  );
};
