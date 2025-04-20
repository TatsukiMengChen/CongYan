import ShowChartIcon from '@mui/icons-material/ShowChart';
import { Box, Skeleton, Typography } from '@mui/material';
import { Card } from 'antd';
import { useEffect } from 'react'; // 移除 useState
import { useNavigate } from 'react-router';
// 移除 GetPracticeTasksAPI 的导入
import useAuthStore from '../../../store/auth';
import useTasksStore from '../../../store/tasks'; // 1. 导入 useTasksStore
import { CustomProgressBar } from './CustomProgressBar';
import styles from './ProgressArea.module.scss';

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
  // 2. 从 store 获取状态和方法，移除本地 state
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const userInfo = useAuthStore((state) => state.userInfo);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated); // 保留 isAuthenticated 用于判断是否应尝试加载
  const navigate = useNavigate();

  // 3. 使用 useEffect 触发 store 中的 fetchTasks
  useEffect(() => {
    // 仅在用户已认证且 userInfo 存在时尝试获取任务
    if (isAuthenticated && userInfo?.id) {
      // fetchTasks 内部会检查是否需要重新加载
      fetchTasks(userInfo.id);
    }
    // 注意：这里不需要处理未登录或 userInfo 不存在的情况，
    // 因为 store 的初始状态会反映这一点（loading: false, tasks: [], error: null）
    // 或者 fetchTasks 内部可以处理 patientId 无效的情况（如果需要）
  }, [userInfo?.id, isAuthenticated, fetchTasks]); // 依赖项包含 userInfo.id, isAuthenticated 和 fetchTasks


  // --- 计算逻辑保持不变，但现在使用来自 store 的 tasks, loading, error ---
  let completionPercentage = 0;
  let completedTasks = 0;
  let totalTasks = 0;
  let uncompletedTasks = 0;
  let motivationalQuote = "加载中...";
  let progressColor = 'linear-gradient(to right, #64b5f6, #2196f3)';

  if (!loading && !error) {
    totalTasks = tasks.length;
    if (totalTasks === 0) {
      completionPercentage = 100;
      completedTasks = 0;
      uncompletedTasks = 0;
      progressColor = 'linear-gradient(to right, #64b5f6, #2196f3)';
    } else {
      completedTasks = tasks.filter(task => task.finished).length;
      uncompletedTasks = totalTasks - completedTasks;
      completionPercentage = Math.round((completedTasks / totalTasks) * 100);
      progressColor = getProgressColor(completionPercentage);
    }
    motivationalQuote = getMotivationalQuote(completionPercentage, completedTasks, totalTasks);
  } else if (error) {
    // 使用 store 中的 error 信息
    motivationalQuote = `加载失败: ${error}`;
  }
  // --- 结束计算逻辑 ---


  const renderContent = () => {
    // 使用 store 中的 loading 和 error 状态
    if (loading) {
      return (
        <Box sx={{ pt: 1 }}>
          <Skeleton variant="rectangular" height={8} sx={{ mb: 1, borderRadius: '5px' }} />
          <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" />
        </Box>
      );
    }
    // 注意：这里的 error 显示逻辑可以简化，因为 motivationalQuote 已经包含了错误信息
    // if (error) {
    //   return <Typography color="error" variant="body2" sx={{ mt: 1 }}>加载失败: {error}</Typography>;
    // }

    // 总是显示进度条和激励语，即使没有任务
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mt: 1.5 }}>
          <Box sx={{ width: '100%', mr: 1.5 }}>
            <CustomProgressBar
              value={completionPercentage === 0 ? 5 : completionPercentage}
              gradient={progressColor}
            />
          </Box>
          <Box sx={{ minWidth: 40 }}>
            <Typography variant="body2" color="text.secondary" fontWeight="medium">{`${completionPercentage}%`}</Typography>
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
          {totalTasks === 0 && !error ? ( // 仅在无错误且无任务时显示 "暂无任务"
            "暂无任务"
          ) : !error ? ( // 如果有任务且无错误
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
          ) : null /* 如果有错误，则不显示计数 */}
        </Typography>
        <Typography variant="body2" color={error ? "error" : "text.secondary"} sx={{ mt: 1, fontStyle: 'italic' }}>
          {motivationalQuote}
        </Typography>
      </>
    );
  };

  const handleCardClick = () => {
    navigate('/tasks');
  };

  return (
    <Card
      className={`${className || ''} overflow-hidden`}
      bodyStyle={{ padding: 0 }}
      onClick={handleCardClick}
      hoverable
    >
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
