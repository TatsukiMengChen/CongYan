import React, { useState, useEffect, useCallback } from 'react';
// 引入 Input
import { Modal, Select, Spin, message, Input } from 'antd';
// GetCorpusAPI 和 CorpusInfo 仍然从 text.ts 导入
import { CorpusInfo, GetCorpusAPI } from '../../../../../api/text';
// 更新导入路径：从 patients.ts 导入任务相关 API 和类型
import { AssignPracticeTaskAPI, PatientInfo } from '../../../../../api/patients';

interface AssignTaskModalProps {
  visible: boolean;
  patient: PatientInfo | undefined; // 需要病人信息来分配任务
  onClose: () => void; // 关闭模态框的回调
  onTaskAssigned: () => void; // 任务分配成功后的回调 (用于刷新列表)
}

const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  visible,
  patient,
  onClose,
  onTaskAssigned,
}) => {
  const [corpusList, setCorpusList] = useState<CorpusInfo[]>([]);
  const [loadingCorpus, setLoadingCorpus] = useState(false);
  const [selectedTextUuid, setSelectedTextUuid] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [corpusError, setCorpusError] = useState<string | null>(null);
  // --- 新增：任务标题和备注状态 ---
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskRemark, setNewTaskRemark] = useState<string>('');
  // --- 结束：任务标题和备注状态 ---


  // 获取语料列表的函数
  const fetchCorpus = useCallback(async () => {
    setLoadingCorpus(true);
    setCorpusError(null);
    try {
      const res = await GetCorpusAPI();
      if (res.status === 0 && res.texts) {
        setCorpusList(res.texts);
      } else {
        const errorMsg = res.message || "加载语料列表失败";
        setCorpusError(errorMsg);
        message.error(errorMsg); // 立即显示错误
      }
    } catch (e) {
      const errorMsg = "网络错误，无法加载语料列表";
      setCorpusError(errorMsg);
      message.error(errorMsg);
      console.error("获取语料错误:", e);
    } finally {
      setLoadingCorpus(false);
    }
  }, []);

  // 当模态框变为可见且列表为空或之前有错误时，获取语料
  useEffect(() => {
    if (visible && (corpusList.length === 0 || corpusError)) {
      fetchCorpus();
    }
  }, [visible, corpusList.length, corpusError, fetchCorpus]);

  // 处理确认分配
  const handleAssignOk = async () => {
    if (!selectedTextUuid) {
      message.warning("请选择一个语料进行分配");
      return;
    }
    if (!patient) {
        message.error("无法获取病人信息，无法分配任务");
        return;
    };

    setAssigning(true);
    try {
      const res = await AssignPracticeTaskAPI({
        patient_id: patient.id,
        text_uuid: selectedTextUuid,
        title: newTaskTitle.trim() || undefined, // 如果为空则不传或传 undefined
        remark: newTaskRemark.trim() || undefined, // 如果为空则不传或传 undefined
      });
      if (res.status === 0) {
        message.success(res.message || "任务分配成功");
        onTaskAssigned(); // 调用成功回调
        handleCancel(); // 关闭模态框并重置状态
      } else {
        message.error(res.message || "任务分配失败");
      }
    } catch (error) {
      message.error("分配任务过程中发生错误");
      console.error("分配任务失败:", error);
    } finally {
      setAssigning(false);
    }
  };

  // 处理取消或关闭
  const handleCancel = () => {
    setSelectedTextUuid(null); // 重置选择
    setNewTaskTitle(''); // 重置标题
    setNewTaskRemark(''); // 重置备注
    // 注意：不重置 corpusList 和 corpusError，以便下次打开时可能复用
    onClose(); // 调用关闭回调
  };

  // 渲染模态框内容
  const renderModalContent = () => {
    if (loadingCorpus) {
      return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
    }
    if (corpusError) {
      return <div style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{corpusError}</div>;
    }
    if (corpusList.length === 0) {
      return <div style={{ textAlign: 'center', padding: '20px' }}>暂无可用的语料</div>;
    }
    return (
      <>
        <Select
          showSearch
          style={{ width: '100%', marginBottom: '1rem' }} // 添加底部边距
          placeholder="请搜索或选择语料 *"
          optionFilterProp="children"
          onChange={(value) => setSelectedTextUuid(value)}
          value={selectedTextUuid}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase()) ||
            (option?.data?.text ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={corpusList.map(corpus => ({
              value: corpus.uuid,
              label: corpus.title || `语料 ${corpus.uuid.substring(0, 8)}...`,
              data: corpus
          }))}
        />
        {/* --- 新增：标题和备注输入框 --- */}
        <Input
            placeholder="请输入任务标题（可选）"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            style={{ marginBottom: '1rem' }}
        />
        <Input.TextArea
            rows={2}
            placeholder="请输入任务备注（可选）"
            value={newTaskRemark}
            onChange={(e) => setNewTaskRemark(e.target.value)}
        />
        {/* --- 结束：标题和备注输入框 --- */}
      </>
    );
  };

  return (
    <Modal
      title={`给 ${patient?.username || '病人'} 分配任务`}
      visible={visible}
      onOk={handleAssignOk}
      onCancel={handleCancel}
      confirmLoading={assigning}
      okText="确认分配"
      cancelText="取消"
      width={600}
      destroyOnClose // 关闭时销毁内部状态，确保每次打开都是新的
    >
      {renderModalContent()}
    </Modal>
  );
};

export default AssignTaskModal;
