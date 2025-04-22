import React from "react";
import {
    FormControl,
    InputLabel,
    OutlinedInput,
    InputAdornment,
    Button,
    FormHelperText,
} from "@mui/material";

interface VerificationCodeInputProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSendCode: () => void; // 保持此属性名称的一致性
    isCodeSent: boolean;
    codeTimer: number;
    error?: boolean;
    helperText?: string;
    phoneError?: string; // 如果需要，可以添加属性以显示与手机号相关的错误
}

export const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
    value,
    onChange,
    onSendCode,
    isCodeSent,
    codeTimer,
    error,
    helperText,
    phoneError, // 接收手机号相关的错误
}) => {
    return (
        <FormControl error={error || !!phoneError} fullWidth> {/* 考虑手机号相关的错误 */}
            <InputLabel htmlFor="verification-code">验证码</InputLabel>
            <OutlinedInput
                id="verification-code"
                label="验证码"
                type="text" // 保持为文本类型以允许前导零（如果需要），验证逻辑处理数字
                value={value}
                onChange={onChange} // 直接使用传入的 onChange
                error={error || !!phoneError} // 考虑手机号相关的错误
                endAdornment={
                    <InputAdornment position="end">
                        <Button
                            onClick={onSendCode} // 触发传入的发送验证码处理函数
                            variant="contained"
                            size="small"
                            disabled={isCodeSent}
                        >
                            {isCodeSent ? `${codeTimer}s` : "获取验证码"}
                        </Button>
                    </InputAdornment>
                }
                inputProps={{ maxLength: 6 }}
            />
            {/* 显示特定错误或通用的帮助文本 */}
            {(error || !!phoneError) && (
                <FormHelperText error>{helperText || phoneError}</FormHelperText>
            )}
        </FormControl>
    );
};
