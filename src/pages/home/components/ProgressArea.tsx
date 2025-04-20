import ShowChartIcon from '@mui/icons-material/ShowChart';
// 移除 LinearProgress 和 LinearProgressProps 的导入
import { Box, Skeleton, Typography } from '@mui/material';
import { Card } from 'antd'; // 导入 Ant Design Card
import { useEffect, useState } from 'react';
import { GetPracticeTasksAPI, PracticeTaskInfo } from '../../../api/patients'; // 确认路径正确
import useAuthStore from '../../../store/auth'; // 确认路径正确
// 导入新的自定义进度条组件
import { CustomProgressBar } from './CustomProgressBar';
import styles from './ProgressArea.module.scss'; // 导入 SCSS Module

// 激励语句函数
const getMotivationalQuote = (percentage: number, completed: number, total: number): string => {
  if (total === 0) {
    return "可以放松一下或开始自主练习！";
  }
  if (percentage === 100) {
    return "太棒了！所有任务已完成！🎉";
  }
  if (percentage >= 80) {
    return "非常出色！离终点只有一步之遥！";
  }
  if (percentage >= 50) {
    return "干得不错！已完成一半，继续加油！";
  }
  if (percentage > 0) {
    return "开了个好头！坚持就是胜利！";
  }
  return "开始新的训练，向着目标前进吧！";
};

// 新增：根据百分比获取进度条颜色 (渐变)
const getProgressColor = (percentage: number): string => {
  if (percentage < 20) {
    return 'linear-gradient(to right, #e57373, #f44336)'; // 红色渐变
  }
  if (percentage < 40) {
    return 'linear-gradient(to right, #ffb74d, #ff9800)'; // 橙色渐变
  }
  if (percentage < 60) {
    return 'linear-gradient(to right, #fff176, #ffc107)'; // 黄色渐变
  }
  if (percentage < 80) {
    return 'linear-gradient(to right, #aed581, #8bc34a)'; // 浅绿渐变，替换了黄绿
  }
  if (percentage < 100) {
    return 'linear-gradient(to right, #81c784, #4caf50)'; // 绿色渐变 - 表示全部完成
  }
  return 'linear-gradient(to right, #64b5f6, #2196f3)'; // 蓝色渐变 - 作为兜底颜色
};


export const ProgressArea = ({ className }: { className?: string }) => {
  const [tasks, setTasks] = useState<PracticeTaskInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userInfo = useAuthStore((state) => state.userInfo);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    const fetchTasks = async (userId: number) => {
      setLoading(true);
      setError(null);
      try {
        const res = await GetPracticeTasksAPI(userId);
        if (res.status === 0 && res.tasks) {
          // 确保 tasks 是数组
          setTasks(Array.isArray(res.tasks) ? res.tasks : []);
        } else {
          // 如果 API 返回成功但 tasks 为空或不存在，也设置为空数组
          if (res.status === 0) {
            setTasks([]);
          } else {
            setError(res.message || "获取训练任务失败");
            setTasks([]); // 清空任务以防显示旧数据
          }
        }
      } catch (err: any) {
        setError(err.message || "获取训练任务时发生错误");
        setTasks([]); // 清空任务
      } finally {
        setLoading(false);
      }
    };

    if (userInfo) {
      fetchTasks(userInfo.id);
    } else if (isAuthenticated) {
      setLoading(true);
    } else {
      setLoading(false);
      setError("用户未登录");
      setTasks([]);
    }
  }, [userInfo, isAuthenticated]);


  // --- 修改计算逻辑 ---
  let completionPercentage = 0;
  let completedTasks = 0;
  let totalTasks = 0;
  let uncompletedTasks = 0;
  let motivationalQuote = "加载中...";
  let progressColor = 'linear-gradient(to right, #64b5f6, #2196f3)'; // 默认渐变

  if (!loading && !error) {
    totalTasks = tasks.length;
    if (totalTasks === 0) {
      completionPercentage = 100; // 空列表视为100%
      completedTasks = 0; // 明确已完成为0
      uncompletedTasks = 0; // 明确未完成为0
      progressColor = 'linear-gradient(to right, #64b5f6, #2196f3)'; // 空列表
    } else {
      completedTasks = tasks.filter(task => task.finished).length;
      uncompletedTasks = totalTasks - completedTasks;
      completionPercentage = Math.round((completedTasks / totalTasks) * 100);
      // 获取动态颜色
      progressColor = getProgressColor(completionPercentage);
    }
    // 传入任务数给激励语函数
    motivationalQuote = getMotivationalQuote(completionPercentage, completedTasks, totalTasks);
  } else if (error) {
    motivationalQuote = "加载失败";
  }
  // --- 结束修改计算逻辑 ---


  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ pt: 1 }}>
          {/* 更新 Skeleton 以匹配自定义进度条的高度 */}
          <Skeleton variant="rectangular" height={8} sx={{ mb: 1, borderRadius: '5px' }} />
          <Skeleton variant="text" width="60%" sx={{ mb: 1 }} /> {/* 模拟计数 */}
          <Skeleton variant="text" width="80%" /> {/* 模拟激励语 */}
        </Box>
      );
    }
    if (error) {
      return <Typography color="error" variant="body2" sx={{ mt: 1 }}>加载失败: {error}</Typography>;
    }

    // 总是显示进度条和激励语，即使没有任务
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1.5 }}>
          <Box sx={{ width: '100%', mr: 1.5 }}>
            {/* 使用自定义进度条组件 */}
            <CustomProgressBar
              value={completionPercentage === 0 ? 5 : completionPercentage}
              gradient={progressColor}
            />
          </Box>
          <Box sx={{ minWidth: 40 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{`${completionPercentage}%`}</Typography>
          </Box>
        </Box>
        {/* 添加任务计数显示 */}
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {totalTasks === 0 ? (
            "暂无任务"
          ) : (
            <>
              <Typography component="span" variant="caption" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                已完成 {completedTasks}
              </Typography>
              {' / '}
              <Typography component="span" variant="caption" sx={{ color: uncompletedTasks > 0 ? 'warning.main' : 'text.secondary', fontWeight: 'medium' }}>
                未完成 {uncompletedTasks}
              </Typography>
              {' / '}
              <Typography component="span" variant="caption" sx={{ color: 'primary.main', fontWeight: 'medium' }}>
                总计 {totalTasks}
              </Typography>
            </>
          )}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
          {motivationalQuote}
        </Typography>
      </>
    );
  };


  return (
    <Card
      className={`${className || ''} overflow-hidden`}
      // 清除 antd Card 的默认内边距，让模块控制
      bodyStyle={{ padding: 0 }}
    >
      {/* 将内容包裹在应用了样式的 div 中 */}
      <div className={styles.progressCardBody}>
        <div className="flex items-center">
          <ShowChartIcon fontSize="small" sx={{ color: 'primary.main' }} />
          <Typography className="pl-2" variant="body1" fontWeight="medium">训练进度</Typography>
        </div>
        {renderContent()}
      </div>
    </Card>
  );
};
