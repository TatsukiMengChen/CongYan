import React from 'react';
import { List, Avatar, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { PatientInfo } from '../../../../api/patients';
import { getAvatarSrc } from '../../../../utils/avatar';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router'; // 引入 useNavigate

// --- 辅助函数 (暂时放在这里，可以移到 utils) ---
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
// --- 结束辅助函数 ---

interface PatientListItemProps {
  patient: PatientInfo;
  // onViewDetails 不再需要，改为内部处理导航
}

const PatientListItem: React.FC<PatientListItemProps> = ({ patient }) => {
  const navigate = useNavigate(); // 获取 navigate 函数
  const age = calculateAge(patient.birth_date);
  const displayGender = mapGender(patient.gender);

  // 处理查看详情点击事件，导航到详情页
  const handleViewDetailsClick = () => {
    navigate('/patients/detail', { state: { patient } }); // 传递 patient 对象
  };

  return (
    <List.Item
      actions={[<a key="view-details" onClick={handleViewDetailsClick}>查看详情</a>]} // 使用新的处理函数
    >
      <List.Item.Meta
        avatar={<Avatar size={64} icon={<UserOutlined />} src={getAvatarSrc(patient)} />}
        title={<a onClick={handleViewDetailsClick}>{patient.username}</a>} // 标题也可以点击跳转
        description={
          <>
            {age && <Tag color='default'>{age}</Tag>}
            {displayGender !== '未设置' && <Tag color={patient.gender === 'female' ? 'warning' : 'success'}>{displayGender}</Tag>}
            {!age && displayGender === '未设置' && <span>基础信息未完善</span>}
          </>
        }
      />
    </List.Item>
  );
};

export default PatientListItem;
