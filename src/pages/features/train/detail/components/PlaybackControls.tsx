import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { CircularProgress, IconButton } from "@mui/material";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isFetchingAudio: boolean;
  handlePlay: () => void;
  backgroundImage?: string | null;
}

export const PlaybackControls = ({
  isPlaying,
  isFetchingAudio,
  handlePlay,
  backgroundImage,
}: PlaybackControlsProps) => {
  return (
    <IconButton
      className={
        backgroundImage
          ? "!bg-white/95 dark:!bg-dark-4/95"
          : "!bg-white dark:!bg-dark-4"
      }
      color="primary"
      onClick={handlePlay}
      disabled={isFetchingAudio}
      sx={{
        width: "60px",
        height: "60px",
        boxShadow: backgroundImage
          ? "0 6px 24px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)"
          : "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
        backdropFilter: backgroundImage ? "blur(8px)" : "none",
        border: backgroundImage ? "1px solid rgba(255, 255, 255, 0.3)" : "none",
      }}
    >
      {isFetchingAudio ? (
        <CircularProgress size={24} />
      ) : isPlaying ? (
        <PauseRoundedIcon color="primary" fontSize="large" />
      ) : (
        <PlayArrowRoundedIcon color="action" fontSize="large" />
      )}
    </IconButton>
  );
};
