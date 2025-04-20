import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { CircularProgress, IconButton } from "@mui/material";

interface PlaybackControlsProps {
  isPlaying: boolean;
  isFetchingAudio: boolean;
  handlePlay: () => void;
}

export const PlaybackControls = ({
  isPlaying,
  isFetchingAudio,
  handlePlay,
}: PlaybackControlsProps) => {
  return (
    <IconButton
      className="!bg-white dark:!bg-dark-4"
      color="primary"
      onClick={handlePlay}
      disabled={isFetchingAudio}
      sx={{
        width: "60px",
        height: "60px",
        boxShadow: "rgba(99, 99, 99, 0.2) 0px 2px 8px 0px",
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
