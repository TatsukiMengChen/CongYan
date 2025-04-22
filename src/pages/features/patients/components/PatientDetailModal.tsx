import React from 'react';
import { Modal, Descriptions, Button, Tag, message } from 'antd';
import { PatientInfo } from '../../../../api/patients';
import dayjs from 'dayjs';

// --- 辅助函数 (与 ListItem 重复，应提取到 utils) ---
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

interface PatientDetailModalProps {
  patient: PatientInfo | null;
  visible: boolean;
  onClose: () => void;
  // onUnbind: (patientId: number) => void; // 解绑回调，暂时不用
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, visible, onClose }) => {
  if (!patient) return null;

  const age = calculateAge(patient.birth_date);
  const displayGender = mapGender(patient.gender);
  const registrationDate = formatDateTime(patient.created_at);
  const displayDisease = patient.disease || '未设置';

  const handleUnbind = () => {
    // TODO: 实现解绑逻辑
    message.info(`预留解绑病人 ${patient.username} (${patient.id}) 的功能`);
    // 调用 onUnbind(patient.id);
  };

  return (
    <Modal
      title="病人详细信息"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="unbind" type="primary" danger onClick={handleUnbind}>
          解除绑定
        </Button>,
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
      ]}
      width={600} // 可以调整宽度
    >
      <Descriptions bordered column={1} size="small">
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
        {/* <Descriptions.Item label="练习时长">{patient.practice_duration_minutes !== undefined ? `${patient.practice_duration_minutes} 分钟` : 'N/A'}</Descriptions.Item> */}
      </Descriptions>
    </Modal>
  );
};

export default PatientDetailModal;
