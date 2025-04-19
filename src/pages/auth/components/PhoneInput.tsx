import React from "react";
import { FormControl } from "@mui/material";
import TextField from "../../../components/TextField"; // 假设 TextField 是一个通用组件

interface PhoneInputProps {
    value: string;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    error?: boolean;
    helperText?: string;
    label?: string; // 添加 label 属性
    id?: string; // 添加 id 属性
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    value,
    onChange,
    error,
    helperText,
    label = "手机号", // 默认 label
    id = "phone-number", // 默认 id
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // 只允许输入数字并限制长度
        const numericValue = event.target.value.replace(/[^0-9]/g, "");
        if (numericValue.length <= 11) {
            // 创建一个新的事件对象，包含修改后的值
            const newEvent = {
                ...event,
                target: {
                    ...event.target,
                    value: numericValue,
                },
            };
            onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
        }
    };

    return (
        <FormControl error={error} fullWidth>
            {" "}
            {/* 添加 fullWidth 以保持一致性 */}
            <TextField
                id={id}
                label={label}
                variant="outlined"
                value={value}
                onChange={handleChange} // 使用修改后的事件处理函数
                error={error}
                helperText={helperText}
                type="tel" // 使用 tel 类型以优化移动端用户体验
                inputProps={{
                    maxLength: 11, // 在输入元素中强制限制最大长度
                }}
            />
        </FormControl>
    );
};
