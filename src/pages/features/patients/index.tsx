import React, { useCallback, useEffect, useState } from 'react';
// 移除 Descriptions, Tag, Modal (如果只剩绑定 Modal，则保留 Modal)
import { Empty, FloatButton, Input, List, message, Modal, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router'; // 引入 useLocation
import Navbar from "../../../components/Navbar";
// 移除 UnbindPatientAPI (因为它在详情页使用)
import { BindPatientAPI, GetPatientsAPI, PatientInfo } from '../../../api/patients';
// 移除 PatientDetailModal
import PatientListItem from './components/PatientListItem';
// import { getAvatarSrc } from '../../../utils/avatar';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // 获取 location
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 绑定模态框状态
  const [isBindModalVisible, setIsBindModalVisible] = useState(false);
  const [bindIdInput, setBindIdInput] = useState('');
  const [binding, setBinding] = useState(false);
  // 移除详情模态框状态
  // const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  // const [selectedPatient, setSelectedPatient] = useState<PatientInfo | null>(null);

  const fetchPatients = useCallback(async () => {
    // ... fetchPatients 逻辑不变 ...
    setLoading(true);
    setError(null);
    const res = await GetPatientsAPI();
    if (res.status === 0 && res.patients) {
      setPatients(res.patients);
    } else {
      const errorMsg = res.message || '加载病人列表失败';
      setError(errorMsg);
      // 避免重复显示错误信息
      if (!error) { // 检查之前的 error 状态
        message.error(errorMsg);
      }
    }
    setLoading(false);
  }, [error]); // 依赖 error 状态

  useEffect(() => {
    fetchPatients();
    // 检查是否从详情页返回并需要刷新
    if (location.state?.refresh) {
      fetchPatients();
      // 清除状态避免重复刷新
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [fetchPatients, location.state, navigate]); // 添加依赖

  const handleBack = () => {
    navigate(-1);
  };

  // 移除 handleViewDetails 函数，逻辑已移至 PatientListItem
  // const handleViewDetails = (patientId: number) => { ... };

  // --- 绑定模态框相关函数 (不变) ---
  const showBindModal = () => {
    setIsBindModalVisible(true);
  };

  const handleBindOk = async () => {
    // ... 绑定逻辑不变 ...
    if (!bindIdInput.trim()) {
      message.warning('请输入要绑定的病人ID');
      return;
    }
    setBinding(true);
    const res = await BindPatientAPI(bindIdInput.trim());
    if (res.status === 0) {
      message.success(res.message || '绑定成功');
      setIsBindModalVisible(false);
      setBindIdInput(''); // 清空输入
      await fetchPatients(); // 刷新列表
    } else {
      message.error(res.message || '绑定失败');
    }
    setBinding(false);
  };

  const handleBindCancel = () => {
    setIsBindModalVisible(false);
    setBindIdInput(''); // 清空输入
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBindIdInput(e.target.value);
  };
  // --- 结束绑定模态框相关函数 ---

  // 移除详情模态框关闭处理
  // const handleDetailModalClose = () => { ... };


  const renderContent = () => {
    // ... renderContent 逻辑不变，但不再需要处理 selectedPatient ...
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spin size="large" /></div>;
    }
    if (error && patients.length === 0) {
      return <Empty description={error} />;
    }
    if (patients.length === 0) {
      return <Empty description="暂无病人信息" />;
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={patients}
        renderItem={patient => (
          // PatientListItem 现在自己处理导航
          <PatientListItem
            key={patient.id}
            patient={patient}
          />
        )}
      />
    );
  };

  return (
    <>
      <Navbar onBack={handleBack}>我的病人</Navbar>
      <div style={{ padding: '10px', paddingBottom: '80px' }}>
        {renderContent()}
      </div>
      {/* 绑定病人模态框 (不变) */}
      <Modal
        title="绑定病人"
        visible={isBindModalVisible}
        onOk={handleBindOk}
        onCancel={handleBindCancel}
        confirmLoading={binding}
        okText="确认绑定"
        cancelText="取消"
      >
        <Input
          placeholder="请输入病人的绑定ID"
          value={bindIdInput}
          onChange={handleInputChange}
          onPressEnter={handleBindOk}
        />
      </Modal>

      {/* 移除病人详情模态框 */}
      {/* <PatientDetailModal ... /> */}

      {/* 添加绑定病人浮动按钮 (不变) */}
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={showBindModal}
        tooltip="添加绑定病人"
      />
    </>
  );
};

export default PatientsPage;
