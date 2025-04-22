import { ExclamationCircleOutlined, PlusOutlined, LineChartOutlined } from '@ant-design/icons';
import { Button, message, Modal, Spin, Typography, Empty } from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PatientInfo, UnbindPatientAPI, GetPracticeTasksAPI, PracticeTaskInfo, DeletePracticeTaskAPI } from '../../../../api/patients';
import { GetCorpusAPI, CorpusInfo } from '../../../../api/text';
import Navbar from '../../../../components/Navbar';
import { ScrollView } from '../../../../components/ScrollView';
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

  // --- 修改：导航到统计分析页面，传递更多参数 ---
  const navigateToPatientAnalysis = () => {
    if (patient) {
      // 传递 patientId 和 patientName
      navigate(`/analysis?patientId=${patient.id}&patientName=${encodeURIComponent(patient.username)}`);
    }
  };

  const navigateToTaskAnalysis = () => {
    // 确保 patient, selectedTaskForDetail 和 corpusDetail (包含 title) 都存在
    if (patient && selectedTaskForDetail && corpusDetail?.title) {
      // 传递 patientId, patientName, textUuid 和 taskTitle
      navigate(`/analysis?patientId=${patient.id}&patientName=${encodeURIComponent(patient.username)}&textUuid=${selectedTaskForDetail.text_uuid}&taskTitle=${encodeURIComponent(corpusDetail.title)}`);
      handleTaskDetailCancel(); // 关闭模态框
    } else if (patient && selectedTaskForDetail) {
       // 如果 corpusDetail 或 title 不可用，只传递基础信息
       navigate(`/analysis?patientId=${patient.id}&patientName=${encodeURIComponent(patient.username)}&textUuid=${selectedTaskForDetail.text_uuid}`);
       handleTaskDetailCancel(); // 关闭模态框
       // 可以考虑给用户一个提示，说明任务标题未能传递
       message.warning("未能获取任务标题，部分信息可能缺失");
    }
  };
  // --- 结束：导航到统计分析页面 ---


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
    // 使用 flex 布局使内容区域填充剩余空间
    <div className="flex flex-col h-screen">
      <Navbar onBack={handleBack}>病人详情 - {patient.username}</Navbar>
      {/* 添加一个 div 来控制 ScrollView 的高度 */}
      <div className="flex-grow overflow-hidden"> {/* flex-grow 使其填充剩余空间, overflow-hidden 防止内容溢出 */}
        <ScrollView className="py-4 px-4"> {/* ScrollView 内部可以滚动 */}
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

          {/* 操作按钮区域 (修改：添加查看统计分析按钮) */}
          <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {/* 新增：查看病人整体统计分析按钮 */}
            <Button
              type="default" // 或者 primary，根据设计调整
              icon={<LineChartOutlined />}
              onClick={navigateToPatientAnalysis}
              block
            >
              查看统计分析
            </Button>
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
        </ScrollView>
      </div>

      {/* 分配任务模态框 (不变) */}
      <AssignTaskModal
        visible={isAssignModalVisible}
        patient={patient}
        onClose={handleAssignModalClose}
        onTaskAssigned={handleTaskAssigned}
      />

      {/* 语料详情模态框 (修改：添加页脚按钮) */}
      <Modal
        title={corpusDetail?.title || (selectedTaskForDetail ? `任务 ${selectedTaskForDetail.text_uuid.substring(0, 8)}...` : "语料详情")}
        visible={isTaskDetailVisible}
        onCancel={handleTaskDetailCancel}
        // 添加页脚
        footer={[
          <Button key="back" onClick={handleTaskDetailCancel}>
            关闭
          </Button>,
          // 新增：查看该任务的统计分析按钮
          <Button
            key="analysis"
            type="primary"
            icon={<LineChartOutlined />}
            onClick={navigateToTaskAnalysis}
            // 仅当语料加载完成时启用
            disabled={loadingCorpusDetail || !!corpusDetailError || !corpusDetail}
          >
            查看任务统计分析
          </Button>,
        ]}
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
    </div> // 关闭 flex 容器
  );
};

export default PatientDetailPage;
