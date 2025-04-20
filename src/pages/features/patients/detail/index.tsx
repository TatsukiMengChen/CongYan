import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, message, Modal, Spin, Typography, Empty } from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
// 引入 DeletePracticeTaskAPI
import { PatientInfo, UnbindPatientAPI, GetPracticeTasksAPI, PracticeTaskInfo, DeletePracticeTaskAPI } from '../../../../api/patients';
import { GetCorpusAPI, CorpusInfo } from '../../../../api/text';
import Navbar from '../../../../components/Navbar';
import PatientInfoCard from './components/PatientInfoCard';
import PatientTaskList from './components/PatientTaskList';
import AssignTaskModal from './components/AssignTaskModal';

const { Paragraph } = Typography;

const PatientDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient as PatientInfo | undefined;
  const [unbinding, setUnbinding] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [tasks, setTasks] = useState<PracticeTaskInfo[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState<string | null>(null);

  // --- 新增：语料详情模态框状态 ---
  const [isTaskDetailVisible, setIsTaskDetailVisible] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<PracticeTaskInfo | null>(null);
  const [loadingCorpusDetail, setLoadingCorpusDetail] = useState(false);
  const [corpusDetail, setCorpusDetail] = useState<CorpusInfo | null>(null);
  const [corpusDetailError, setCorpusDetailError] = useState<string | null>(null);
  // --- 结束：语料详情模态框状态 ---

  const [deletingTask, setDeletingTask] = useState(false); // 添加删除任务加载状态

  // 获取任务列表逻辑 (fetchTasks) 保持不变
  const fetchTasks = useCallback(async () => {
    if (!patient) return;
    setLoadingTasks(true);
    setTasksError(null);
    try {
      const res = await GetPracticeTasksAPI(patient.id);
      if (res.status === 0 && res.tasks) {
        // 注意：现在后端返回的任务列表不包含 practice_text 了
        setTasks(res.tasks);
      } else {
        const errorMsg = res.message || "加载训练任务列表失败";
        setTasksError(errorMsg);
        message.error(errorMsg);
      }
    } catch (e) {
      const errorMsg = "网络错误，无法加载训练任务列表";
      setTasksError(errorMsg);
      message.error(errorMsg);
      console.error("获取任务错误:", e);
    } finally {
      setLoadingTasks(false);
    }
  }, [patient]);

  // useEffect 获取任务列表逻辑保持不变
  useEffect(() => {
    if (patient) {
      fetchTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient]);

  // 返回处理 (handleBack) 保持不变
  const handleBack = () => {
    navigate(-1);
  };

  // 解绑逻辑 (confirmUnbind, handleUnbind) 保持不变
  const confirmUnbind = () => {
    if (!patient) return;
    Modal.confirm({
      title: '确认解绑',
      icon: <ExclamationCircleOutlined />,
      content: `确定要解除与病人 ${patient.username} (${patient.id}) 的绑定关系吗？`,
      okText: '确认解绑',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleUnbind,
      okButtonProps: { loading: unbinding },
    });
  };

  const handleUnbind = async () => {
    if (!patient) return;
    setUnbinding(true);
    try {
      const res = await UnbindPatientAPI(patient.id);
      if (res.status === 0) {
        message.success(res.message || '解绑成功');
        navigate('/patients', { replace: true, state: { refresh: true } });
      } else {
        message.error(res.message || '解绑失败');
      }
    } catch (error) {
      message.error('解绑过程中发生错误');
      console.error("解绑失败:", error);
    } finally {
      setUnbinding(false);
    }
  };

  // 分配任务模态框控制 (showAssignModal, handleAssignModalClose, handleTaskAssigned) 保持不变
  const showAssignModal = () => {
    setIsAssignModalVisible(true);
  };

  const handleAssignModalClose = () => {
    setIsAssignModalVisible(false);
  };

  const handleTaskAssigned = () => {
    fetchTasks();
  };

  // --- 新增：处理任务点击和获取语料详情 ---
  const fetchCorpusDetail = useCallback(async (textUuid: string) => {
    setLoadingCorpusDetail(true);
    setCorpusDetail(null);
    setCorpusDetailError(null);
    try {
      const res = await GetCorpusAPI(textUuid);
      if (res.status === 0 && res.texts && res.texts.length > 0) {
        setCorpusDetail(res.texts[0]); // API 返回数组，取第一个
      } else {
        const errorMsg = res.message || "加载语料详情失败";
        setCorpusDetailError(errorMsg);
        message.error(errorMsg);
      }
    } catch (e) {
      const errorMsg = "网络错误，无法加载语料详情";
      setCorpusDetailError(errorMsg);
      message.error(errorMsg);
      console.error("获取语料详情错误:", e);
    } finally {
      setLoadingCorpusDetail(false);
    }
  }, []);

  const handleTaskClick = (task: PracticeTaskInfo) => {
    setSelectedTaskForDetail(task);
    setIsTaskDetailVisible(true);
    fetchCorpusDetail(task.text_uuid); // 获取语料详情
  };

  const handleTaskDetailCancel = () => {
    setIsTaskDetailVisible(false);
    setSelectedTaskForDetail(null);
    setCorpusDetail(null);
    setCorpusDetailError(null);
  };
  // --- 结束：处理任务点击和获取语料详情 ---

  // --- 新增：处理删除任务 ---
  const handleDeleteTask = async (taskUuid: string) => {
    setDeletingTask(true); // 可以考虑为特定任务项添加加载状态，但全局状态更简单
    try {
      const res = await DeletePracticeTaskAPI(taskUuid);
      if (res.status === 0) {
        message.success(res.message || "删除任务成功");
        fetchTasks(); // 刷新任务列表
      } else {
        message.error(res.message || "删除任务失败");
      }
    } catch (error) {
      message.error("删除任务过程中发生错误");
      console.error("删除任务失败:", error);
    } finally {
      setDeletingTask(false);
    }
  };
  // --- 结束：处理删除任务 ---

  // 处理病人信息不存在的情况 (不变)
  if (!patient) {
    return (
      <>
        <Navbar onBack={handleBack}>病人详情</Navbar>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          无法加载病人信息，请返回列表页重试。
        </div>
      </>
    );
  }

  // 主页面渲染
  return (
    <>
      <Navbar onBack={handleBack}>病人详情 - {patient.username}</Navbar>
      <div style={{ padding: '15px', paddingBottom: '80px' }}>
        <PatientInfoCard patient={patient} />

        {/* 传递 onDeleteTask 给任务列表组件 */}
        <PatientTaskList
          tasks={tasks}
          // 可以传递 deletingTask 状态给列表项以显示加载指示，但目前省略
          loading={loadingTasks || deletingTask} // 列表加载中或正在删除任务时显示 Spin
          error={tasksError}
          onTaskClick={handleTaskClick}
          onDeleteTask={handleDeleteTask} // 传递删除处理函数
        />

        {/* 操作按钮区域 (不变) */}
        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={showAssignModal} // 打开分配任务模态框
            block
          >
            分配新任务
          </Button>
          <Button type="primary" danger onClick={confirmUnbind} loading={unbinding} block>
            解除绑定
          </Button>
        </div>
      </div>

      {/* 分配任务模态框 (不变) */}
      <AssignTaskModal
        visible={isAssignModalVisible}
        patient={patient}
        onClose={handleAssignModalClose}
        onTaskAssigned={handleTaskAssigned}
      />

      {/* 语料详情模态框 (不变) */}
      <Modal
        title={corpusDetail?.title || "语料详情"}
        visible={isTaskDetailVisible}
        onCancel={handleTaskDetailCancel}
        footer={null} // 不需要底部按钮
        destroyOnClose
      >
        {loadingCorpusDetail ? (
          <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>
        ) : corpusDetailError ? (
          <Empty description={corpusDetailError} />
        ) : corpusDetail ? (
          <Paragraph copyable={{ tooltips: ['复制', '已复制'] }} style={{ whiteSpace: 'pre-wrap' }}>
            {corpusDetail.text}
          </Paragraph>
        ) : (
          <Empty description="无法加载语料内容" /> // 理论上不应出现，除非API成功但没数据
        )}
      </Modal>
    </>
  );
};

export default PatientDetailPage;
