import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import { IconButton, Typography } from "@mui/material"; // 引入 SxProps 和 Theme
import { Card } from "antd";
import React from "react";
import { useNavigate } from "react-router";

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

  return (
    // 将 sx 属性应用到 Card 上，并合并现有类名
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
          onClick={() => navigator("/collections")} // 假设收藏页路由为 /collections
        />
      </div>
    </Card>
  );
};
