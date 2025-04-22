import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DotLoading, ErrorBlock, PullToRefresh } from 'antd-mobile';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import NotesIcon from '@mui/icons-material/Notes';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import Navbar from '../../../components/Navbar';
import useTasksStore from '../../../store/tasks';
import useAuthStore from '../../../store/auth';
import styles from './tasks.module.scss'; // 导入 styles 对象

// 辅助函数：格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, loading, error, fetchTasks, clearTasks } = useTasksStore();
  const { userInfo: user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
    } else {
      console.warn("TasksPage useEffect: user or user.id is undefined.");
    }
  }, [fetchTasks, user?.id]);

  const handleTaskClick = (taskUuid: string, textUuid: string) => {
    navigate('/train/detail', {
      state: { task_uuid: taskUuid, text_uuid: textUuid }
    });
  };

  const handleRefresh = async () => {
    console.log("任务页下拉刷新触发");
    if (user?.id) {
      clearTasks(); // 清除旧数据和 fetchAttempted 状态
      await fetchTasks(user.id); // 重新获取任务
      console.log("任务页数据刷新完成");
    } else {
      console.warn("无法刷新任务：用户信息不可用");
      clearTasks(); // 即使无法获取，也清除旧数据
    }
  };

  const renderContent = () => {
    if (loading && tasks.length === 0) {
      return (
        <div className={styles.centerContent}>
          <DotLoading color='primary' />
          <span style={{ marginTop: 12, color: '#666' }}>加载中...</span>
        </div>
      );
    }
    if (error && tasks.length === 0) {
      return <ErrorBlock status="default" title="加载失败" description={error} />;
    }
    if (tasks.length === 0 && !loading) {
      return <ErrorBlock status="empty" title="暂无任务" description="当前没有分配给您的练习任务" />;
    }
    return (
      // 移除 List 组件
      <div className={styles.taskListContainer}>
        {tasks.map((task) => (
          // 移除 List.Item，直接使用 div 并添加点击事件和样式
          <div
            key={task.uuid}
            onClick={() => handleTaskClick(task.uuid, task.text_uuid)}
            className={`${styles.taskItem} ${!task.finished ? styles.clickable : ''}`} // 添加 clickable 类以模拟点击效果
          >
            <div>
              <div className={styles.taskTitle}>
                {/* 直接使用 task.title */}
                <span className={styles.titleText}>{task.title || `任务 ${task.uuid.substring(0, 6)}`}</span>
                {/* 将状态和箭头包裹在一个 div 中 */}
                <div className={styles.statusArrowWrapper}>
                  <span className={`${styles.taskStatus} ${task.finished ? styles.finished : styles.unfinished}`}>
                    {task.finished ? '已完成' : '进行中'}
                  </span>
                  {!task.finished && (
                    <ArrowForwardIosRoundedIcon
                      className={styles.arrowIndicator}
                      sx={{ fontSize: 16, color: '#bbb' }}
                    />
                  )}
                </div>
              </div>
              <div className={styles.taskMeta}>
                {/* 添加备注显示 */}
                {task.remark && (
                  <span className={styles.taskRemark}>
                    <NotesIcon sx={{ fontSize: 16, marginRight: 1, verticalAlign: 'bottom' }} />
                    备注: {task.remark}
                  </span>
                )}
                <span>
                  <AccessTimeIcon sx={{ fontSize: 16, marginRight: 1 }} />
                  创建: {formatDate(task.created_at)}
                </span>
                {/* 更新时间可能意义不大，可以考虑移除或保留 */}
                {/* <span>
                  <EditIcon sx={{ fontSize: 16, marginRight: 1 }} />
                  更新: {formatDate(task.updated_at)}
                </span> */}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="page-container flex flex-col h-full">
      <Navbar onBack={() => navigate(-1)}>我的任务</Navbar>
      <div className={`page-content flex-1 overflow-y-auto ${styles.pullToRefreshContainer}`}>
        <PullToRefresh
          onRefresh={handleRefresh}
          renderText={status => {
            return {
              pulling: '下拉刷新任务列表',
              canRelease: '释放立即刷新',
              refreshing: '刷新中...',
              complete: '刷新成功',
            }[status];
          }}
        >
          {renderContent()}
        </PullToRefresh>
      </div>
    </div>
  );
};

export default TasksPage;
