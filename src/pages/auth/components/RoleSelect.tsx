import React from "react";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
} from "@mui/material";

interface RoleSelectProps {
  value: string;
  onChange: (event: SelectChangeEvent<string>) => void;
  error?: boolean;
  helperText?: string;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  return (
    <FormControl error={error} fullWidth>
      <InputLabel id="role-select-label">角色</InputLabel>
      <Select
        labelId="role-select-label"
        id="role-select"
        value={value}
        label="角色"
        onChange={onChange}
      >
        <MenuItem value="">
          <em>请选择...</em>
        </MenuItem>
        <MenuItem value="patient">病人</MenuItem>
        <MenuItem value="doctor">医生</MenuItem>
        <MenuItem value="relative">家属</MenuItem>
      </Select>
      {helperText && <FormHelperText error>{helperText}</FormHelperText>}
    </FormControl>
  );
};
