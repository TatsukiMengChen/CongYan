import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Descriptions, message, Modal, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { PatientInfo, UnbindPatientAPI } from '../../../../api/patients'; // 引入 UnbindPatientAPI
import Navbar from '../../../../components/Navbar';

// --- 辅助函数 (可以从 utils 导入) ---
const calculateAge = (birthDateString?: string | null): string | null => {
  if (!birthDateString) return null;
  try {
    const birthDate = dayjs(birthDateString);
    if (!birthDate.isValid()) return null;
    const today = dayjs();
    const age = today.diff(birthDate, 'year');
    return `${age}岁`;
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
};

const mapGender = (gender: PatientInfo['gender']): string => {
  switch (gender) {
    case 'male': return '男';
    case 'female': return '女';
    default: return '未设置';
  }
};

const formatDateTime = (dateString?: string | null): string => {
  if (!dateString) return '未知';
  try {
    const date = dayjs(dateString);
    return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '日期无效';
  } catch (e) {
    return '日期无效';
  }
};
// --- 结束辅助函数 ---

const PatientDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient as PatientInfo | undefined; // 从 state 获取病人信息
  const [unbinding, setUnbinding] = useState(false);

  const handleBack = () => {
    navigate(-1); // 返回上一页
  };

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
        // 解绑成功后，可能需要通知列表页刷新，或者直接返回
        navigate('/patients', { replace: true, state: { refresh: true } }); // 返回列表页并标记刷新
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

  if (!patient) {
    // 如果没有病人信息（例如直接访问URL），可以显示错误或重定向
    return (
      <>
        <Navbar onBack={handleBack}>病人详情</Navbar>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          无法加载病人信息，请返回列表页重试。
        </div>
      </>
    );
  }

  // 计算显示信息
  const age = calculateAge(patient.birth_date);
  const displayGender = mapGender(patient.gender);
  const registrationDate = formatDateTime(patient.created_at);
  const displayDisease = patient.disease || '未设置';

  return (
    <>
      <Navbar onBack={handleBack}>病人详情 - {patient.username}</Navbar>
      <div style={{ padding: '15px' }}>
        <Descriptions bordered column={1} size="small" title="基础信息">
          <Descriptions.Item label="用户 ID">{patient.id}</Descriptions.Item>
          <Descriptions.Item label="用户名">{patient.username}</Descriptions.Item>
          <Descriptions.Item label="手机号">{patient.phone_number || '未提供'}</Descriptions.Item>
          <Descriptions.Item label="性别">
            {displayGender !== '未设置' ? (
              <Tag color={patient.gender === 'female' ? 'warning' : 'success'}>{displayGender}</Tag>
            ) : (
              displayGender
            )}
          </Descriptions.Item>
          <Descriptions.Item label="年龄">{age || '未设置'}</Descriptions.Item>
          <Descriptions.Item label="病症">{displayDisease}</Descriptions.Item>
          <Descriptions.Item label="注册时间">{registrationDate}</Descriptions.Item>
          {/* 可以根据需要添加更多信息 */}
        </Descriptions>

        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <Button type="primary" danger onClick={confirmUnbind} loading={unbinding} block>
            解除绑定
          </Button>
        </div>
      </div>
    </>
  );
};

export default PatientDetailPage;
