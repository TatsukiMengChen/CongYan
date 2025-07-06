import { FormControlLabel, Typography } from "@mui/material";
import { AndroidSwitch } from "../../../../../components/Switch";

interface EvaluationModeSwitchProps {
  isEvaluationMode: boolean;
  setIsEvaluationMode: (value: boolean) => void;
  backgroundImage?: string | null; // 可选的背景图片状态
}

export const EvaluationModeSwitch = ({
  isEvaluationMode,
  setIsEvaluationMode,
  backgroundImage,
}: EvaluationModeSwitchProps) => {
  return (
    <div
      className={`flex flex-col items-center text-center ${
        backgroundImage
          ? "bg-white/80 backdrop-blur-sm rounded-lg p-2 border border-white/40"
          : ""
      }`}
    >
      <FormControlLabel
        value={isEvaluationMode}
        onChange={() => setIsEvaluationMode(!isEvaluationMode)}
        control={<AndroidSwitch />}
        label={<Typography fontSize="small">测评模式</Typography>}
      />
      <Typography fontSize="11px" color="textSecondary" className="mt-1">
        测评模式会将测评的数据保存到测评记录中
      </Typography>
    </div>
  );
};
