import MicNoneRoundedIcon from "@mui/icons-material/MicNoneRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import { IconButton } from "@mui/material";

interface RecordingControlsProps {
  isRecording: boolean;
  handleRecordStart: () => void;
  handleRecordEnd: () => void;
  disabled?: boolean; // 在连接或录音后分析期间为 true
}

export const RecordingControls = ({
  isRecording,
  handleRecordStart,
  handleRecordEnd,
  disabled,
}: RecordingControlsProps) => {
  const isDisabled = !!disabled;

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
      disabled={isDisabled} // 直接使用计算出的禁用状态
    >
      {isRecording ? (
        // 正在录音，显示停止图标
        <MicRoundedIcon color={isDisabled ? "disabled" : "primary"} fontSize="large" />
      ) : (
        // 未录音，显示开始图标
        <MicNoneRoundedIcon color={isDisabled ? "disabled" : "action"} fontSize="large" />
      )}
    </IconButton>
  );
};
