import React from "react";
import { FormControl } from "@mui/material";
import TextField from "../../../components/TextField";

interface EmailInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  return (
    <FormControl error={error}>
      <TextField
        id="email"
        label="邮箱"
        variant="outlined"
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
      />
    </FormControl>
  );
};
