import React from 'react';
import { List } from 'antd-mobile';
import { CopyOutlined } from '@ant-design/icons';
import styles from './index.module.scss';
import { UserInfo } from '../../../api/user';
import { mapGender, mapRole, formatBirthDateDisplay } from '../../../utils/formatters'; // 假设辅助函数移到 utils.ts

interface ProfileInfoListProps {
  userInfo: UserInfo;
  onCopyUserId: () => void;
  onEditUsername: () => void;
  onEditGender: () => void;
  onEditBirthDate: () => void;
  onEditDisease: () => void;
}

const ProfileInfoList: React.FC<ProfileInfoListProps> = ({
  userInfo,
  onCopyUserId,
  onEditUsername,
  onEditGender,
  onEditBirthDate,
  onEditDisease,
}) => {
  const displayGender = mapGender(userInfo.gender);
  const displayRole = mapRole(userInfo.user_role);
  const displayBirthDate = formatBirthDateDisplay(userInfo.birth_date);
  const displayDisease = userInfo.disease || '未设置';

  return (
    <List header="详细资料" className={styles.infoList}>
      {/* 用户 ID - 可复制 */}
      <List.Item
        extra={
          <span className={styles.idCopyContainer}>
            {userInfo.id}
            <CopyOutlined className={styles.copyIcon} />
          </span>
        }
        onClick={onCopyUserId}
        arrow={false}
      >
        用户 ID
      </List.Item>
      {/* 用户名项添加点击编辑功能 */}
      <List.Item extra={userInfo.username} onClick={onEditUsername} arrow className={styles.editableItem}>用户名</List.Item>
      <List.Item extra={userInfo.phone_number || '未绑定'}>手机号</List.Item>
      {/* Gender - Editable */}
      <List.Item extra={displayGender} onClick={onEditGender} arrow className={styles.editableItem}>性别</List.Item>
      <List.Item extra={displayRole}>角色</List.Item>
      {/* Birth Date - Editable */}
      <List.Item extra={displayBirthDate} onClick={onEditBirthDate} arrow className={styles.editableItem}>出生日期</List.Item>
      {/* Disease - Editable */}
      {userInfo.user_role === 'patient' && <List.Item extra={displayDisease} onClick={onEditDisease} arrow className={styles.editableItem}>病症</List.Item>}
      <List.Item extra={userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : '未知'}>注册时间</List.Item>
      {userInfo.bind_doctor_id && <List.Item extra={userInfo.bind_doctor_id}>绑定医生ID</List.Item>}
      {userInfo.practice_duration_minutes !== undefined && <List.Item extra={`${userInfo.practice_duration_minutes} 分钟`}>练习时长</List.Item>}
    </List>
  );
};

export default ProfileInfoList;
