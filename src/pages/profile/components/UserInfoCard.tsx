import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { Avatar, Box, Chip, Stack, Typography, useTheme } from "@mui/material";
import React from "react";
import { UserInfo } from "../../../api/user";
import { getAvatarSrc } from "../../../utils/avatar";

interface UserInfoCardProps {
  userInfo: UserInfo | null;
  onNavigate?: () => void;
}

// 辅助函数：计算年龄
const calculateAge = (birthDateString?: string | null): string => {
  if (!birthDateString) return "未知年龄";
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}岁`;
  } catch (e) {
    console.error("Error calculating age:", e);
    return "未知年龄";
  }
};

// 辅助函数：转换性别
const formatGender = (gender?: UserInfo["gender"]): string => {
  switch (gender) {
    case "male": return "男";
    case "female": return "女";
    case "other": return "其他";
    default: return "未知性别";
  }
};

// 辅助函数：转换角色
const formatRole = (role?: UserInfo["user_role"]): string => {
  switch (role) {
    case "patient": return "患者";
    case "doctor": return "医生";
    case "relative": return "家属"; // 假设有 relative 角色
    default: return "未知角色";
  }
};


export const UserInfoCard: React.FC<UserInfoCardProps> = ({ userInfo, onNavigate }) => {
  const theme = useTheme(); // 获取主题对象以访问调色板
  const avatarSrc = getAvatarSrc(userInfo);
  console.log(avatarSrc)
  const age = calculateAge(userInfo?.birth_date);
  const gender = formatGender(userInfo?.gender);
  const role = formatRole(userInfo?.user_role);

  // 定义浅色背景的函数或直接在 sx 中使用
  const getLightBackgroundColor = (color: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error') => {
    // 使用 alpha 函数或直接选择浅色调
    // return alpha(theme.palette[color].main, 0.1); // 示例：使用 10% 透明度的主色
    // 或者使用预定义的 light 颜色
    return theme.palette[color].light + '40'; // 示例：使用 light 颜色并附加透明度 (e.g., '40' for ~25% opacity)
    // 或者直接指定颜色
    // switch(color) { ... }
  };


  return (
    <Box>
      <Box
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        px={2}
        pt={4} // 保持顶部内边距
        pb={2} // 保持底部内边距
        className="cursor-pointer"
        onClick={onNavigate}
      >
        <Avatar
          alt={userInfo?.username || "用户头像"}
          src={avatarSrc}
          sx={{ width: 72, height: 72 }}
        />
        <Box ml={2} flexGrow={1}>
          <Typography variant="h6" fontWeight="medium">
            {userInfo?.username || "加载中..."}
          </Typography>
          {/* 使用 Stack 包裹 Chip，方便设置间距 */}
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {/* 角色 Chip - 调整文字颜色 */}
            {role !== "未知角色" && (
              <Chip
                label={role}
                size="small"
                sx={{
                  bgcolor: getLightBackgroundColor('primary'),
                  color: theme.palette.primary.dark, // 使用主题中的深色调
                  fontWeight: 'medium' // 可以适当加粗
                }}
              />
            )}
            {/* 性别 Chip - 调整文字颜色 */}
            {gender !== "未知性别" && (
              <Chip
                label={gender}
                size="small"
                sx={{
                  bgcolor: getLightBackgroundColor(userInfo?.gender === 'female' ? 'secondary' : 'info'),
                  color: userInfo?.gender === 'female' ? theme.palette.secondary.dark : theme.palette.info.dark, // 使用对应主题深色调
                  fontWeight: 'medium'
                }}
              />
            )}
            {/* 年龄 Chip - 调整文字颜色 */}
            {age !== "未知年龄" && (
              <Chip
                label={age}
                size="small"
                sx={{
                  bgcolor: getLightBackgroundColor('success'),
                  color: theme.palette.success.dark, // 使用主题中的深色调
                  fontWeight: 'medium'
                }}
              />
            )}
          </Stack>
        </Box>
        <ArrowForwardIosRoundedIcon color="action" sx={{ fontSize: '1.2rem' }} />
      </Box>
    </Box>
  );
};
