import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { List, SpinLoading, ErrorBlock } from 'antd-mobile';
import Navbar from '../../../components/Navbar'; // 引入自定义 Navbar
import useTasksStore from '../../../store/tasks'; // 引入 tasks store
import useAuthStore from '../../../store/auth'; // 引入 auth store 获取用户信息

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, loading, error, fetchTasks } = useTasksStore();
  const { userInfo: user } = useAuthStore(); // 获取登录用户信息

  useEffect(() => {
    // 确保 user 和 user.id 存在
    if (user?.id) {
      console.log("TasksPage useEffect: fetching tasks for user id:", user.id);
      fetchTasks(user.id); // 使用登录用户的 ID 获取任务
    } else {
      console.warn("TasksPage useEffect: user or user.id is undefined.");
      // 可以选择显示错误或重定向到登录页
    }
    // 组件卸载时不需要清除任务，因为它是全局状态
    // return () => clearTasks(); // 如果需要在离开页面时清除，可以取消注释
  }, [fetchTasks, user?.id]); // 依赖项包含 user.id

  const handleTaskClick = (taskUuid: string, textUuid: string) => {
    // 跳转到训练详情页，需要传递任务和文本信息
    // 注意：路由和参数需要与 TrainTextDetailPage 匹配
    navigate(`/train/detail?task_uuid=${taskUuid}&text_uuid=${textUuid}`);
  };

  const renderContent = () => {
    if (loading) {
      return <SpinLoading style={{ '--size': '48px', margin: '20px auto' }} />;
    }
    if (error) {
      return <ErrorBlock status="default" title="加载失败" description={error} />;
    }
    if (tasks.length === 0) {
      return <ErrorBlock status="empty" title="暂无任务" description="当前没有分配给您的练习任务" />;
    }
    return (
      <List header="我的练习任务">
        {tasks.map((task) => (
          <List.Item
            key={task.uuid}
            // 假设 practice_text 存在且包含 title
            // 如果 practice_text 可能不存在，需要添加判断逻辑
            description={`创建于: ${new Date(task.created_at).toLocaleDateString()}`}
            clickable
            onClick={() => handleTaskClick(task.uuid, task.text_uuid)} // 传递 task uuid 和 text uuid
            arrow={!task.finished} // 未完成的任务显示箭头
          >
            {/* 显示任务关联的文本标题，如果存在的话 */}
            {task.practice_text?.title || `任务 ${task.uuid.substring(0, 6)}`}
            {task.finished && <span style={{ marginLeft: '8px', color: 'green' }}>(已完成)</span>}
          </List.Item>
        ))}
      </List>
    );
  };

  return (
    <div className="page-container">
      <Navbar onBack={() => navigate(-1)}>我的任务</Navbar>
      <div className="page-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default TasksPage;
