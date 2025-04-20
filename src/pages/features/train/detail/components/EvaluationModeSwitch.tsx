import { FormControlLabel, Typography } from "@mui/material";
import { AndroidSwitch } from "../../../../../components/Switch";

interface EvaluationModeSwitchProps {
  isEvaluationMode: boolean;
  setIsEvaluationMode: (value: boolean) => void;
}

export const EvaluationModeSwitch = ({
  isEvaluationMode,
  setIsEvaluationMode,
}: EvaluationModeSwitchProps) => {
  return (
    <>
      <FormControlLabel
        value={isEvaluationMode}
        onChange={() => setIsEvaluationMode(!isEvaluationMode)}
        control={<AndroidSwitch />}
        label={<Typography fontSize="small">测评模式</Typography>}
      />
      <Typography fontSize="12px" color="textSecondary">
        测评模式会将测评的数据保存到测评记录中
      </Typography>
    </>
  );
};
