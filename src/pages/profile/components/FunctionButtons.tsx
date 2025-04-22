import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import BookOutlinedIcon from "@mui/icons-material/BookOutlined"; // 确保引入收藏图标
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined'; // 引入病人图标
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined'; // 引入语料图标
import LinkIcon from '@mui/icons-material/Link'; // 引入绑定图标
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
        {/* 统计分析按钮 (所有角色可见) */}
        <FunctionButton
          icon={<AutoGraphRoundedIcon />}
          title="统计分析"
          onClick={() => navigator("/analysis")}
        />
        {/* 我的收藏按钮 (所有角色可见) */}
        <FunctionButton
          icon={<BookOutlinedIcon />}
          title="我的收藏"
          onClick={() => navigator("/favorite")} // 确保导航到正确的路径
        />
        {/* 我的语料按钮 (仅医生可见) */}
        {userInfo?.user_role === 'doctor' && (
          <FunctionButton
            icon={<LibraryBooksOutlinedIcon />} // 使用语料图标
            title="语料管理" // 修改标题为语料管理
            onClick={() => navigator("/corpus")} // 跳转到语料页面
          />)}
        {/* 我的病人按钮 (仅医生可见) */}
        {userInfo?.user_role === 'doctor' && (
          <FunctionButton
            icon={<PeopleAltOutlinedIcon />}
            title="我的病人"
            onClick={() => navigator("/patients")} // 跳转到病人页面
          />
        )}
        {/* 绑定管理按钮 (仅家属可见) */}
        {userInfo?.user_role === 'relative' && (
          <FunctionButton
            icon={<LinkIcon />} // 使用链接/绑定图标
            title="绑定管理"
            onClick={() => navigator("/relative/management")} // 跳转到家属绑定管理页面 (待创建)
          />
        )}
      </div>
    </Card>
  );
};