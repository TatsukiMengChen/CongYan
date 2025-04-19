import React, { useState, useEffect } from 'react'; // 引入 useState 和 useEffect
import { useNavigate } from 'react-router';
import useAuthStore from '../../../store/auth';
import { NavBar, List, Avatar, Tag } from 'antd-mobile'; // 引入 Tag
import styles from './index.module.scss'; // 样式文件仍然可能包含其他需要的样式
import { UserInfo } from '../../../api/user';

// 辅助函数保持不变
const mapGender = (gender: UserInfo['gender']): string => {
  switch (gender) {
    case 'male': return '男';
    case 'female': return '女';
    case 'other': return '其他';
    default: return '未设置';
  }
};

const mapRole = (role: UserInfo['user_role']): string => {
  switch (role) {
    case 'patient': return '患者';
    case 'doctor': return '医生';
    case 'relative': return '家属'; // 假设有 relative 角色
    default: return role || '未知';
  }
};

const calculateAge = (birthDateString?: string): string | null => {
  if (!birthDateString) return null;
  try {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return `${age}岁`;
  } catch (e) {
    console.error("Error calculating age:", e);
    return null;
  }
};

// 辅助函数：获取头像 URL
const getAvatarSrc = (userInfo: UserInfo | null): string => {
    // 假设默认头像在 public/avatar/ 目录下
    const defaultAvatarPath = "/avatar/default.png"; // 使用绝对路径
    // 假设最终回退头像在 public/images/ 目录下
    const fallbackAvatar = "/avat/avatar-boy.png"; // 使用绝对路径

    if (!userInfo) {
      console.log("No userInfo, returning fallback:", fallbackAvatar);
      return fallbackAvatar; // 没有用户信息，使用回退头像
    }

    const { avatar_url, user_role, gender } = userInfo;

    // 检查 avatar_url 是否是完整的 URL
    const isFullUrl = avatar_url && (avatar_url.startsWith('http://') || avatar_url.startsWith('https://'));

    if (avatar_url && avatar_url !== defaultAvatarPath && avatar_url !== 'avatar/default.png') { // 同时检查旧的相对路径以防万一
      // 如果是完整 URL，直接使用
      if (isFullUrl) {
        console.log("Using full avatar_url:", avatar_url);
        return avatar_url;
      } else {
        // 如果不是完整 URL，尝试拼接基础路径或假定它是相对于根的路径
        // 如果需要 API 基础路径:
        // const fullPath = `${apiBaseUrl}/${avatar_url.startsWith('/') ? avatar_url.substring(1) : avatar_url}`;
        // 如果假定它是根相对路径:
        const fullPath = avatar_url.startsWith('/') ? avatar_url : `/${avatar_url}`;
        return fullPath;
      }
    }

    // 如果是默认头像路径 (检查绝对和可能的旧相对路径)
    if (avatar_url === defaultAvatarPath || avatar_url === 'avatar/default.png') {
      let rolePart = "";
      switch (user_role) {
        case "patient": rolePart = "patient"; break;
        case "doctor": rolePart = "doctor"; break;
        case "relative": rolePart = "relative"; break;
        default:
          return fallbackAvatar;
      }

      let genderPart = "";
      switch (gender) {
        case "male": genderPart = "boy"; break;
        case "female": genderPart = "girl"; break;
        default: genderPart = "boy"; // 默认性别
      }

      // 拼接绝对路径
      const defaultAvatarGeneratedPath = `/avatar/${rolePart}-${genderPart}.png`;
      return defaultAvatarGeneratedPath;
    }

    // 其他情况（例如 avatar_url 为 null 或 undefined），使用回退头像
    return fallbackAvatar;
  };


const ProfileDetailPage: React.FC = () => {
  const { userInfo: storeUserInfo } = useAuthStore(); // 从 store 获取
  const navigate = useNavigate();
  // 添加本地状态来存储最终使用的用户信息
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(storeUserInfo);

  useEffect(() => {
    // 如果 store 中没有用户信息，尝试从 localStorage 加载
    if (!storeUserInfo) {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const parsedInfo = JSON.parse(storedUserInfo);
          setCurrentUserInfo(parsedInfo);
        } catch (e) {
          console.error("解析本地用户信息失败:", e);
          // 可选：处理错误，例如导航回上一页或显示错误信息
        }
      }
    } else {
      // 如果 store 中有信息，确保本地状态同步
      setCurrentUserInfo(storeUserInfo);
    }
  }, [storeUserInfo]); // 当 store 中的用户信息变化时，重新运行 effect

  const goBack = () => {
    navigate(-1);
  };

  // 使用本地状态 currentUserInfo 进行判断和渲染
  if (!currentUserInfo) {
    // 可以显示更具体的加载状态或错误信息
    return <div>加载用户信息中或信息不存在...</div>;
  }

  // 使用 currentUserInfo 进行后续计算和渲染
  const avatarSrc = getAvatarSrc(currentUserInfo);
  const age = calculateAge(currentUserInfo.birth_date);
  const gender = mapGender(currentUserInfo.gender);
  const role = mapRole(currentUserInfo.user_role);

  return (
    <div className={styles.profileDetailContainer}>
      <NavBar onBack={goBack}>个人信息</NavBar>

      {/* 自定义头部区域 - Avatar 默认是圆形的 */}
      <div className={styles.profileHeader}>
        <Avatar src={avatarSrc} className={styles.headerAvatar} />
        <div className={styles.headerInfo}>
          <div className={styles.headerUsername}>{currentUserInfo.username}</div>
          <div className={styles.headerTags}>
            {role !== '未知' && <Tag color='primary' fill='outline' className={styles.tag}>{role}</Tag>}
            {gender !== '未设置' && <Tag color={currentUserInfo.gender === 'female' ? 'warning' : 'success'} fill='outline' className={styles.tag}>{gender}</Tag>}
            {age && <Tag color='default' fill='outline' className={styles.tag}>{age}</Tag>}
          </div>
        </div>
      </div>

      {/* 详细信息列表 */}
      <List header="详细资料" className={styles.infoList}>
        {/* 移除原来的第一个 List.Item */}
        <List.Item extra={currentUserInfo.username}>用户名</List.Item>
        <List.Item extra={currentUserInfo.phone_number || '未绑定'}>手机号</List.Item>
        <List.Item extra={mapGender(currentUserInfo.gender)}>性别</List.Item>
        <List.Item extra={mapRole(currentUserInfo.user_role)}>角色</List.Item>
        <List.Item extra={currentUserInfo.birth_date || '未设置'}>出生日期</List.Item>
        <List.Item extra={currentUserInfo.created_at ? new Date(currentUserInfo.created_at).toLocaleDateString() : '未知'}>注册时间</List.Item>
        {currentUserInfo.bind_doctor_id && <List.Item extra={currentUserInfo.bind_doctor_id}>绑定医生ID</List.Item>}
        {currentUserInfo.practice_duration_minutes !== undefined && <List.Item extra={`${currentUserInfo.practice_duration_minutes} 分钟`}>练习时长</List.Item>}
      </List>
    </div>
  );
};

export default ProfileDetailPage;
