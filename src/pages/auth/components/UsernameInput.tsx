import React from "react";
import { FormControl } from "@mui/material";
import TextField from "../../../components/TextField";

interface UsernameInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
}

export const UsernameInput: React.FC<UsernameInputProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  return (
    <FormControl error={error}>
      <TextField
        id="username"
        label="用户名"
        variant="outlined"
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
      />
    </FormControl>
  );
};
