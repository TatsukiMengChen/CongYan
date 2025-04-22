import React from 'react';
import { Descriptions, Tag } from 'antd';
import dayjs from 'dayjs';
import { PatientInfo } from '../../../../../api/patients';

// --- 辅助函数 (从父组件或 utils 移入/导入) ---
const calculateAge = (birthDateString?: string | null): string | null => {
  if (!birthDateString) return null;
  try {
    const birthDate = dayjs(birthDateString);
    if (!birthDate.isValid()) return null;
    const today = dayjs();
    const age = today.diff(birthDate, 'year');
    return `${age}岁`;
  } catch (e) {
    console.error("计算年龄出错:", e);
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

interface PatientInfoCardProps {
  patient: PatientInfo;
}

const PatientInfoCard: React.FC<PatientInfoCardProps> = ({ patient }) => {
  // 计算显示信息
  const age = calculateAge(patient.birth_date);
  const displayGender = mapGender(patient.gender);
  const registrationDate = formatDateTime(patient.created_at);
  const displayDisease = patient.disease || '未设置';

  return (
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
    </Descriptions>
  );
};

export default PatientInfoCard;
