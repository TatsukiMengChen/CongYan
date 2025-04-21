import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineOppositeContent from "@mui/lab/TimelineOppositeContent";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import { Card, Empty, Typography } from "antd";
import { PracticeHistory } from "../../../../api/train";
import styles from "../index.module.scss"; // 复用样式
import { useEffect, useMemo, useState } from "react"; // 引入 useMemo
import { useTheme } from "@mui/material";

// 改进版 HistoryItem 组件，使用更明亮的颜色
const HistoryItem = ({ data }: { data: PracticeHistory }) => {
  const getColor = (score: number | undefined) => {
    if (score === undefined || score === null) return "inherit";
    if (score >= 90) return "#2ecc71"; // 明亮的绿色
    if (score >= 80) return "#3498db"; // 明亮的蓝色
    if (score >= 60) return "#f39c12"; // 明亮的橙色
    return "#e74c3c"; // 明亮的红色
  };

  const getDotColor = (score: number | undefined) => {
    if (score === undefined || score === null) return "inherit";
    if (score >= 90) return "success";
    if (score >= 80) return "primary";
    if (score >= 60) return "warning";
    return "error";
  };

  const formatTime = (isoString: string | undefined) => {
    if (!isoString) return "N/A";
    try {
      const date = new Date(isoString);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // 对于移动端，简化日期显示
      const isMobile = window.innerWidth < 600;
      
      if (isMobile) {
        if (date.toDateString() === today.toDateString()) {
          return `今天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else if (date.toDateString() === yesterday.toDateString()) {
          return `昨天 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        } else {
          return `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
      } else {
        return date.toLocaleString();
      }
    } catch (e) {
      return isoString;
    }
  };

  return (
    <TimelineItem>
      <TimelineOppositeContent 
        color="text.primary" 
        style={{ 
          fontSize: window.innerWidth < 600 ? '0.8rem' : '0.875rem',
          maxWidth: window.innerWidth < 600 ? '120px' : 'auto' 
        }}
      >
        {formatTime(data.created_at)}
      </TimelineOppositeContent>
      <TimelineSeparator>
        <TimelineDot 
          color={getDotColor(data.score)} 
          sx={{ boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }} // 添加阴影提升立体感
        />
        <TimelineConnector />
      </TimelineSeparator>
      <TimelineContent 
        color="text.primary" 
        style={{ 
          fontWeight: 'bold',
          color: getColor(data.score),
          fontSize: window.innerWidth < 600 ? '1rem' : '1.1rem' 
        }}
      >
        {data.score !== undefined ? data.score.toFixed(1) : "N/A"}
      </TimelineContent>
    </TimelineItem>
  );
};

interface HistoryTimelineCardProps {
  history: PracticeHistory[];
  isLoading: boolean;
  // 更新 context 属性类型
  context: {
    patientId: string | null;
    patientName: string | null; // 添加 patientName
    textUuid: string | null;
    taskTitle: string | null; // 添加 taskTitle
  };
}

export const HistoryTimelineCard = ({ history, isLoading, context }: HistoryTimelineCardProps) => {
  const theme = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);

  // 更新 cardTitle 逻辑以使用 name 和 title
  const cardTitle = useMemo(() => {
    if (context.patientName && context.taskTitle) {
      // 同时有病人和任务信息
      return `任务 "${context.taskTitle}" 历史记录`;
    } else if (context.patientName) {
       // 只有病人信息
      return `病人 ${context.patientName} 历史记录`;
    } else if (context.taskTitle) {
        // 只有任务信息
        return `任务 "${context.taskTitle}" 历史记录`;
    }
    // 默认标题
    return "历史记录";
  }, [context]);
  
  // 监听窗口大小变化以响应式调整
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Card 
      className={styles.card} 
      // 使用动态标题
      title={cardTitle}
      bodyStyle={{ maxHeight: '60vh', overflowY: 'auto' }} // 添加滚动，防止内容过多
    >
      {isLoading ? (
        <Typography color="text.secondary" style={{ textAlign: 'center', padding: '16px' }}>加载中...</Typography>
      ) : history.length > 0 ? (
        <Timeline 
          position={isMobile ? "right" : "alternate"} // 移动端使用右侧布局节省空间
          sx={{ 
            padding: isMobile ? '0 0 0 10px' : '0 16px', // 移动端减少内边距
            '& .MuiTimelineItem-root:before': {
              // 移动端时减少或移除左侧空间
              flex: isMobile ? '0' : '1',
              padding: isMobile ? '0' : '6px 16px'
            }
          }}
        >
          {/* 注意：传入的 history 已经是升序 */}
          {history.reverse().map((item) => (
            <HistoryItem key={item.uuid} data={item} />
          ))}
        </Timeline>
      ) : (
        <Empty description="暂无历史记录" />
      )}
    </Card>
  );
};
