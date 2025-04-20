import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import { IconButton } from "@mui/material";

interface RecordingControlsProps {
  isRecording: boolean;
  handleRecordStart: () => void;
  handleRecordEnd: () => void;
}

export const RecordingControls = ({
  isRecording,
  handleRecordStart,
  handleRecordEnd,
}: RecordingControlsProps) => {
  return (
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
  );
};
