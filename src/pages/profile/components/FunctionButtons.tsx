import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'; // 引入病人图标
import { IconButton, Typography } from "@mui/material";
import { Card } from "antd";
import React from "react";
import { useNavigate } from "react-router";
import useAuthStore from "../../../store/auth"; // 引入 auth store

// 单个按钮组件 (复用 ProfilePage 中的定义)
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
    <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
      <IconButton>
        {React.cloneElement(icon as React.ReactElement, { fontSize: "large" })}
      </IconButton>
      <Typography variant="body2">{title}</Typography>
    </div>
  );
};

export const FunctionButtons: React.FC = () => {
  const navigator = useNavigate();
  const { userInfo } = useAuthStore(); // 获取用户信息

  return (
    <Card className={`mx-4 box-border`}>
      <div className="flex-around">
        <FunctionButton
          icon={<AutoGraphRoundedIcon />}
          title="统计分析"
          onClick={() => navigator("/analysis")}
        />
        <FunctionButton
          icon={<BookOutlinedIcon />}
          title="我的收藏"
          onClick={() => navigator("/collections")}
        />
        {/* 条件渲染：只有医生角色显示 */}
        {userInfo?.user_role === 'doctor' && (
          <FunctionButton
            icon={<PeopleAltOutlinedIcon />}
            title="我的病人"
            onClick={() => navigator("/patients")} // 跳转到病人页面
          />
        )}
      </div>
    </Card>
  );
};
