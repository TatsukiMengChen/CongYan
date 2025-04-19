import React from "react";
import { FormControl } from "@mui/material";
import TextField from "../../../components/TextField";

interface AccountInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: boolean;
  helperText?: string;
}

export const AccountInput: React.FC<AccountInputProps> = ({
  value,
  onChange,
  error,
  helperText,
}) => {
  return (
    <FormControl error={error}>
      <TextField
        id="account"
        label="邮箱/用户名"
        variant="outlined"
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText}
      />
    </FormControl>
  );
};
