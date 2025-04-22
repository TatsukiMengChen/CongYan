import React, { useCallback, useEffect, useState } from 'react';
import { Empty, FloatButton, Input, List, message, Modal, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router';
import Navbar from "../../../components/Navbar";
import { BindPatientAPI, GetPatientsAPI, PatientInfo } from '../../../api/patients';
import PatientListItem from './components/PatientListItem';
import { ScrollView } from '../../../components/ScrollView';

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isBindModalVisible, setIsBindModalVisible] = useState(false);
  const [bindIdInput, setBindIdInput] = useState('');
  const [binding, setBinding] = useState(false);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await GetPatientsAPI();
    if (res.status === 0 && res.patients) {
      setPatients(res.patients);
    } else {
      const errorMsg = res.message || '加载病人列表失败';
      setError(errorMsg);
      if (!error) {
        message.error(errorMsg);
      }
    }
    setLoading(false);
  }, [error]);

  useEffect(() => {
    fetchPatients();
    if (location.state?.refresh) {
      fetchPatients();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [fetchPatients, location.state, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const showBindModal = () => {
    setIsBindModalVisible(true);
  };

  const handleBindOk = async () => {
    if (!bindIdInput.trim()) {
      message.warning('请输入要绑定的病人ID');
      return;
    }
    setBinding(true);
    const res = await BindPatientAPI(bindIdInput.trim());
    if (res.status === 0) {
      message.success(res.message || '绑定成功');
      setIsBindModalVisible(false);
      setBindIdInput('');
      await fetchPatients();
    } else {
      message.error(res.message || '绑定失败');
    }
    setBinding(false);
  };

  const handleBindCancel = () => {
    setIsBindModalVisible(false);
    setBindIdInput('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBindIdInput(e.target.value);
  };

  const renderContent = () => {
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
          <PatientListItem
            key={patient.id}
            patient={patient}
          />
        )}
      />
    );
  };

  return (
    <div className='flex flex-col h-full'>
      <Navbar onBack={handleBack}>我的病人</Navbar>
        <ScrollView className="flex-grow py-2 px-2.5">
          {renderContent()}
        </ScrollView>
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
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={showBindModal}
        tooltip="添加绑定病人"
      />
    </div>
  );
};

export default PatientsPage;
