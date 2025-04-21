import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'; // 引入图标
import { Typography } from '@mui/material'; // 移除 Button 导入
import { Card } from 'antd'; // 引入 antd Card
import React from 'react';
import { useNavigate } from 'react-router';
import styles from './PersonalizedTrainingArea.module.scss'; // 引入 SCSS 模块

interface PersonalizedTrainingAreaProps {
  className?: string;
}

export const PersonalizedTrainingArea: React.FC<PersonalizedTrainingAreaProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleStartTraining = () => {
    // 跳转到个性化训练页面
    navigate('/personalized');
  };

  return (
    // 使用 antd Card
    <Card
      className={`${className || ''} overflow-hidden`}
      bodyStyle={{ padding: 0 }} // Card 本身无内边距
      hoverable // 添加悬浮效果
      onClick={handleStartTraining} // 点击卡片触发
    >
      {/* 添加带样式的内部 div */}
      <div className={styles.personalizedTrainingCardBody}>
        {/* 标题和图标 */}
        <div className={styles.titleContainer}>
          <AutoAwesomeOutlinedIcon fontSize="small" className={styles.icon} />
          <Typography variant="body1" fontWeight="medium">个性化训练</Typography>
        </div>
        {/* 描述文字 */}
        {/* 调整描述文字下边距，因为按钮移除了 */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0 }}>
          根据您的进度和需求，为您量身定制训练计划。
        </Typography>
        {/* 移除 Button */}
      </div>
    </Card>
  );
};
