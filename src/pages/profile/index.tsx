import React from "react";
import Avatar from "@mui/material/Avatar";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import styles from "./index.module.scss";
import { Card } from "antd";
import { Button, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import useAuthStore from "../../store/auth";

const FunctionButton = ({
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
}) => {
  return (
    <div className="flex flex-col items-center" onClick={onClick}>
      <IconButton>
        {React.cloneElement(icon as React.ReactElement, { fontSize: "large" })}
      </IconButton>
      <Typography variant="body2">{title}</Typography>
    </div>
  );
};

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

export const ProfilePage = () => {
  const navigator = useNavigate();
  const { user } = useAuthStore();

  return (
    <div className="h-full">
      <div className={`${styles.bg}`}>
        <div className="flex-between px-4 pt-12">
          <Avatar
            alt="Avatar"
            src="images/avatar-boy.png"
            sx={{ width: 80, height: 80 }}
          ></Avatar>
          <div className="ml-4 w-full">
            <Typography variant="h6" color="textPrimary">
              {user?.username}
            </Typography>
            <Typography variant="inherit" color="textPrimary">
              已练习0时0分
            </Typography>
          </div>
          <ArrowForwardIosRoundedIcon color="action" />
        </div>
        <Card className={`mx-4 mt-8 box-border ${styles.card}`}>
          <div className="flex-around">
            <FunctionButton icon={<AutoGraphRoundedIcon />} title="统计分析" />
            <FunctionButton icon={<BookOutlinedIcon />} title="我的收藏" />
          </div>
        </Card>
      </div>
      <div className="mt-4">
        <FunctionButton2 icon={<HelpOutlineOutlinedIcon />} title="使用帮助" />
        <FunctionButton2 icon={<InfoOutlinedIcon />} title="关于软件" />
        <FunctionButton2
          icon={<SettingsOutlinedIcon />}
          title="设置"
          onClick={() => navigator("/settings")}
        />
      </div>
    </div>
  );
};
