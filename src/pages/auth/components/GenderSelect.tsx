import React from "react";
import {
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormHelperText,
} from "@mui/material";

interface GenderSelectProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
}

export const GenderSelect: React.FC<GenderSelectProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  return (
    <FormControl error={error} component="fieldset" fullWidth>
      <FormLabel component="legend">性别</FormLabel>
      <RadioGroup row aria-label="gender" name="gender" value={value} onChange={onChange}>
        <FormControlLabel value="male" control={<Radio />} label="男" />
        <FormControlLabel value="female" control={<Radio />} label="女" />
        {/* <FormControlLabel value="other" control={<Radio />} label="其他" /> */}
      </RadioGroup>
      {helperText && <FormHelperText error>{helperText}</FormHelperText>}
    </FormControl>
  );
};
