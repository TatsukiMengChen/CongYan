import React from "react";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { FormControl, FormHelperText } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/zh-cn"; // 导入中文语言包

dayjs.locale("zh-cn"); // 全局或组件内设置语言为中文

interface BirthDatePickerProps {
    value: Dayjs | null;
    onChange: (date: Dayjs | null) => void;
    error?: boolean;
    helperText?: string;
}

export const BirthDatePicker: React.FC<BirthDatePickerProps> = ({
    value,
    onChange,
    error,
    helperText,
}) => {
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="zh-cn">
            <FormControl error={error} fullWidth>
                <DatePicker
                    label="出生日期"
                    value={value}
                    onChange={onChange}
                    disableFuture // 禁止选择未来的日期
                    slotProps={{
                        textField: {
                            helperText: error ? helperText : "", // 如果有错误，显示辅助文本
                            error: error, // 设置错误状态
                            fullWidth: true, // 确保文本框占满宽度
                        },
                    }}
                />
                {/* 如果 slotProps 未处理辅助文本，可以在下方显示 */}
                {/* {helperText && !error && <FormHelperText>{helperText}</FormHelperText>} */}
                {/* {error && helperText && <FormHelperText error>{helperText}</FormHelperText>} */}
            </FormControl>
        </LocalizationProvider>
    );
};
