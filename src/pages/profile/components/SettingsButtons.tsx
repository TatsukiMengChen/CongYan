import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { Button, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router";

// 单个按钮组件 (复用 ProfilePage 中的定义)
const FunctionButton2 = ({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) => {
  return (
    <Button
      color="inherit"
      className="w-full border-none !b-rd-0"
      onClick={onClick}
    >
      <div className="h-full w-full flex-between px-4 py-2">
        {React.cloneElement(icon as React.ReactElement, { color: "action" })}
        <Typography
          variant="body2"
          className="w-full text-left text-4 !ml-4"
          color="textPrimary"
        >
          {title}
        </Typography>
        <ArrowForwardIosRoundedIcon fontSize="small" color="action" />
      </div>
    </Button>
  );
};

export const SettingsButtons: React.FC = () => {
  const navigator = useNavigate();

  return (
    <div className="mt-4">
      <FunctionButton2
        icon={<HelpOutlineOutlinedIcon />}
        title="使用帮助"
        // onClick={() => navigator("/help")} // 假设帮助页路由为 /help
      />
      <FunctionButton2
        icon={<InfoOutlinedIcon />}
        title="关于软件"
        // onClick={() => navigator("/about")} // 假设关于页路由为 /about
      />
      <FunctionButton2
        icon={<SettingsOutlinedIcon />}
        title="设置"
        onClick={() => navigator("/settings")}
      />
    </div>
  );
};
