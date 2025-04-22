import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../../../store/auth';
import { NavBar, List, Avatar, Tag, Input, Dialog, Toast, DatePicker, Picker } from 'antd-mobile'; // 增加 DatePicker, Picker
import { CopyOutlined } from '@ant-design/icons'; // 使用 antd 的复制图标
import { InputRef } from 'antd-mobile/es/components/input';
import styles from './index.module.scss';
import { UserInfo, UpdateUsernameAPI, UpdateUserInfoAPI, UpdateUserInfoPayload } from '../../../api/user'; // 导入 UpdateUserInfoAPI 及相关类型
import { getAvatarSrc } from '../../../utils/avatar'; // 从 utils 导入
import dayjs from 'dayjs'; // 引入 dayjs 用于日期处理
import utc from 'dayjs/plugin/utc'; // 引入 UTC 插件
dayjs.extend(utc); // 使用 UTC 插件

// 辅助函数保持不变
const mapGender = (gender: UserInfo['gender']): string => {
  switch (gender) {
    case 'male': return '男';
    case 'female': return '女';
    // 'other' 和 null 不再是有效选项，但保留 default 以防万一
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

const calculateAge = (birthDateString?: string | null): string | null => {
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

// 新增：格式化出生日期 (只显示 YYYY-MM-DD)
const formatBirthDateDisplay = (birthDateString?: string | null): string => {
  if (!birthDateString) return '未设置';
  try {
    // 尝试将 ISO 字符串转换为 YYYY-MM-DD
    return dayjs(birthDateString).format('YYYY-MM-DD');
  } catch (e) {
    console.error("Error formatting birth date:", e);
    return '日期无效';
  }
};

// 新增：将 Date 对象转换为后端需要的 ISO 字符串 (UTC)
const formatBirthDateForAPI = (date: Date | null): string | null => {
  if (!date) return null;
  // 设置时间为当地时间中午12点，然后转换为UTC，确保日期不会因时区而变
  return dayjs(date).hour(12).minute(0).second(0).millisecond(0).utc().format('YYYY-MM-DDT12:00:00Z');
};

// 辅助函数：确保日期字符串是 ISO 格式 (如果已经是，则不变；如果是 YYYYMMDD，则转换)
const ensureISOFormat = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  // 检查是否已经是 ISO 格式 (简单检查)
  if (dateString.includes('T') && dateString.includes('Z')) {
    return dateString;
  }
  // 尝试从 YYYYMMDD 转换
  if (/^\d{8}$/.test(dateString)) {
    const year = dateString.substring(0, 4);
    const month = dateString.substring(4, 6);
    const day = dateString.substring(6, 8);
    // 假设本地时间，然后转为 UTC ISO String
    // 注意：这可能不完全准确，取决于原始 YYYYMMDD 代表的含义
    // 如果 YYYYMMDD 本身就代表 UTC 日期，转换方式会不同
    // 这里我们假定它是本地日期，需要转成当天开始的 UTC 时间
    return dayjs(`${year}-${month}-${day}`).utc().startOf('day').toISOString();
  }
  // 尝试从 YYYY-MM-DD 转换
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dayjs(dateString).utc().startOf('day').toISOString();
  }

  // 如果格式未知或无效，尝试直接用 dayjs 解析并转 UTC ISO
  const parsedDate = dayjs(dateString);
  if (parsedDate.isValid()) {
    return parsedDate.utc().toISOString();
  }

  console.warn("无法将日期字符串转换为 ISO 格式:", dateString);
  return null; // 或者返回原始字符串，取决于 API 的容错性
};


const ProfileDetailPage: React.FC = () => {
  const { userInfo: storeUserInfo, setUserInfo } = useAuthStore(); // 获取 setUserInfo 方法
  const navigate = useNavigate();
  // 添加本地状态来存储最终使用的用户信息
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(storeUserInfo);
  // 添加状态控制用户名编辑
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [submittingUsername, setSubmittingUsername] = useState(false);
  const usernameInputRef = useRef<InputRef>(null); // 创建 ref
  // 性别编辑状态
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  // 出生日期编辑状态
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  // 病症编辑状态
  const [isEditingDisease, setIsEditingDisease] = useState(false);
  const [newDisease, setNewDisease] = useState<string | null | undefined>(undefined); // 使用 undefined 初始状态区分空字符串和未编辑
  const [submittingDisease, setSubmittingDisease] = useState(false);
  const diseaseInputRef = useRef<InputRef>(null);

  // --- 复制 ID ---
  const copyUserId = async () => {
    if (currentUserInfo?.id) {
      try {
        await navigator.clipboard.writeText(currentUserInfo.id.toString());
        Toast.show({
          content: 'ID 已复制',
          position: 'center',
          duration: 1500,
          icon: <CopyOutlined />,
        });
      } catch (err) {
        console.error('无法复制 ID: ', err);
        Toast.show({
          content: '复制失败',
          position: 'center',
          duration: 1500,
        });
      }
    }
  };

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

  // Effect to focus input when dialog opens
  useEffect(() => {
    if (isEditingUsername) {
      // 使用 setTimeout 确保 DOM 更新后再聚焦
      const timer = setTimeout(() => {
        usernameInputRef.current?.focus();
        usernameInputRef.current?.nativeElement?.select(); // 选中现有文本
      }, 100); // 短暂延迟
      return () => clearTimeout(timer); // 清理定时器
    }
  }, [isEditingUsername]); // 依赖于编辑状态

  // Effect to focus disease input when dialog opens
  useEffect(() => {
    if (isEditingDisease) {
      const timer = setTimeout(() => {
        diseaseInputRef.current?.focus();
        diseaseInputRef.current?.nativeElement?.select();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isEditingDisease]);

  const goBack = () => {
    navigate(-1);
  };

  // --- 用户名编辑 ---
  const startEditUsername = () => {
    if (currentUserInfo) {
      setNewUsername(currentUserInfo.username);
      setIsEditingUsername(true);
    }
  };

  const saveUsername = async () => {
    // ... existing saveUsername logic ...
    // Ensure submitting state is named submittingUsername
    if (!newUsername.trim() || !currentUserInfo) {
      Toast.show({ content: '用户名不能为空', position: 'center' });
      return;
    }
    if (newUsername === currentUserInfo.username) {
      setIsEditingUsername(false);
      return;
    }
    try {
      setSubmittingUsername(true); // Use specific state
      const response = await UpdateUsernameAPI(newUsername);
      if (response.status === 0) {
        const updatedUserInfo = { ...currentUserInfo, username: newUsername };
        updateLocalUserInfo(updatedUserInfo); // Use helper function
        Toast.show({ content: '用户名修改成功', position: 'center' });
      } else {
        Toast.show({ content: response.message || '修改用户名失败', position: 'center' });
      }
    } catch (error) {
      console.error('修改用户名失败:', error);
      Toast.show({ content: '系统错误，请稍后再试', position: 'center' });
    } finally {
      setSubmittingUsername(false); // Use specific state
      setIsEditingUsername(false);
    }
  };

  // --- 通用信息更新处理 ---
  const updateLocalUserInfo = (updatedInfo: UserInfo) => {
    setUserInfo(updatedInfo); // Update store
    setCurrentUserInfo(updatedInfo); // Update local component state
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo)); // Update local storage
  };

  const handleUpdateUserInfo = async (payload: Partial<UpdateUserInfoPayload>) => { // payload 可以是部分的
    if (!currentUserInfo) return false;

    // 构建包含所有字段的完整 payload
    const fullPayload: UpdateUserInfoPayload = {
      gender: payload.gender !== undefined
        ? payload.gender
        : (currentUserInfo.gender === 'male' || currentUserInfo.gender === 'female'
          ? currentUserInfo.gender
          : undefined),
      // 确保 birth_date 是 ISO 格式或 null
      birth_date: payload.birth_date !== undefined
        ? payload.birth_date // 来自 handleBirthDateConfirm 的已经是 ISO 格式
        : ensureISOFormat(currentUserInfo.birth_date), // 从当前用户信息获取并确保格式
      // 处理 disease，确保空字符串转为 null
      disease: payload.disease !== undefined
        ? (payload.disease === '' ? null : payload.disease)
        : currentUserInfo.disease,
    };

    try {
      // 发送包含所有字段的 fullPayload
      const response = await UpdateUserInfoAPI(fullPayload);
      if (response.status === 0) {
        // 使用返回的数据更新，确保本地状态与后端一致
        const updatedUserInfo = response.data ? response.data : {
          ...currentUserInfo,
          ...fullPayload // 使用发送的 fullPayload 更新本地状态（如果后端没返回 data）
        };
        updateLocalUserInfo(updatedUserInfo);
        Toast.show({ content: '信息更新成功', position: 'center' });
        return true; // Indicate success
      } else {
        Toast.show({ content: response.message || '更新失败', position: 'center' });
        return false; // Indicate failure
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      Toast.show({ content: '系统错误，请稍后再试', position: 'center' });
      return false; // Indicate failure
    }
  };


  // --- 性别编辑 ---
  // 只包含男和女
  const genderColumns = [
    [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  ];

  const handleGenderConfirm = async (value: any[]) => {
    const selectedGender = value[0] as "male" | "female";
    if (currentUserInfo && selectedGender !== currentUserInfo.gender) {
      // 只传递变化的字段，handleUpdateUserInfo 会补充其他字段
      await handleUpdateUserInfo({ gender: selectedGender });
    } else if (!currentUserInfo) {
      console.error("Cannot update gender: currentUserInfo is null");
    }
  };

  // --- 出生日期编辑 ---
  const handleBirthDateConfirm = async (value: Date | null) => {
    // formatBirthDateForAPI 现在返回 ISO 字符串或 null
    const formattedDate = formatBirthDateForAPI(value);
    // 检查日期是否真的改变了 (与 currentUserInfo 中的 ISO 格式比较)
    const currentIsoDate = ensureISOFormat(currentUserInfo?.birth_date);
    if (formattedDate !== currentIsoDate) {
      // 只传递变化的字段
      await handleUpdateUserInfo({ birth_date: formattedDate });
    } else {
      // 如果日期未变，可以给个提示或直接关闭选择器
      setShowBirthDatePicker(false); // 关闭选择器
      // Toast.show({ content: '日期未更改', position: 'center', duration: 1500 });
    }
    console.log(formattedDate)
  };

  // --- 病症编辑 ---
  const startEditDisease = () => {
    if (currentUserInfo) {
      // Initialize with current value or empty string if null/undefined
      setNewDisease(currentUserInfo.disease ?? '');
      setIsEditingDisease(true);
    }
  };

  const saveDisease = async () => {
    const diseaseValueToSend = newDisease === '' ? null : newDisease;

    if (diseaseValueToSend === (currentUserInfo?.disease ?? null)) {
      setIsEditingDisease(false);
      setNewDisease(undefined);
      return;
    }

    setSubmittingDisease(true);
    // 只传递变化的字段
    const success = await handleUpdateUserInfo({ disease: diseaseValueToSend });
    setSubmittingDisease(false);
    if (success) {
      setIsEditingDisease(false);
      setNewDisease(undefined);
    }
    // 失败时保持对话框打开？目前逻辑是无论如何都关闭
    setIsEditingDisease(false);
    setNewDisease(undefined);
  };


  // 使用本地状态 currentUserInfo 进行判断和渲染
  if (!currentUserInfo) {
    // 可以显示更具体的加载状态或错误信息
    return <div>加载用户信息中或信息不存在...</div>;
  }

  // 使用 currentUserInfo 进行后续计算和渲染
  const avatarSrc = getAvatarSrc(currentUserInfo);
  const age = calculateAge(currentUserInfo.birth_date);
  // displayGender 现在只会是 '男', '女', 或 '未设置'
  const displayGender = mapGender(currentUserInfo.gender);
  const displayRole = mapRole(currentUserInfo.user_role);
  const displayBirthDate = formatBirthDateDisplay(currentUserInfo.birth_date);
  const displayDisease = currentUserInfo.disease || '未设置';

  return (
    <div className={styles.profileDetailContainer}>
      <NavBar onBack={goBack}>个人信息</NavBar>

      {/* 自定义头部区域 - Avatar 默认是圆形的 */}
      <div className={styles.profileHeader}>
        <Avatar src={avatarSrc} className={styles.headerAvatar} />
        <div className={styles.headerInfo}>
          <div className={styles.headerUsername}>{currentUserInfo.username}</div>
          <div className={styles.headerTags}>
            {displayRole !== '未知' && <Tag color='primary' fill='outline' className={styles.tag}>{displayRole}</Tag>}
            {currentUserInfo.gender && displayGender !== '未设置' && <Tag color={currentUserInfo.gender === 'female' ? 'warning' : 'success'} fill='outline' className={styles.tag}>{displayGender}</Tag>}
            {age && <Tag color='default' fill='outline' className={styles.tag}>{age}</Tag>}
          </div>
        </div>
      </div>

      {/* 详细信息列表 */}
      <List header="详细资料" className={styles.infoList}>
        {/* 用户 ID - 可复制 */}
        <List.Item
          extra={
            <span className={styles.idCopyContainer}>
              {currentUserInfo.id}
              <CopyOutlined className={styles.copyIcon} />
            </span>
          }
          onClick={copyUserId} // 点击整行复制
          arrow={false} // 通常复制项不需要箭头
        >
          用户 ID
        </List.Item>
        {/* 用户名项添加点击编辑功能 */}
        <List.Item extra={currentUserInfo.username} onClick={startEditUsername} arrow className={styles.editableItem}>用户名</List.Item>
        <List.Item extra={currentUserInfo.phone_number || '未绑定'}>手机号</List.Item>
        {/* Gender - Editable */}
        <List.Item extra={displayGender} onClick={() => setShowGenderPicker(true)} arrow className={styles.editableItem}>性别</List.Item>
        <List.Item extra={displayRole}>角色</List.Item>
        {/* Birth Date - Editable */}
        <List.Item extra={displayBirthDate} onClick={() => setShowBirthDatePicker(true)} arrow className={styles.editableItem}>出生日期</List.Item>
        {/* Disease - Editable */}
        {currentUserInfo.user_role === 'patient' && <List.Item extra={displayDisease} onClick={startEditDisease} arrow className={styles.editableItem}>病症</List.Item>}
        <List.Item extra={currentUserInfo.created_at ? new Date(currentUserInfo.created_at).toLocaleDateString() : '未知'}>注册时间</List.Item>
        {currentUserInfo.bind_doctor_id && <List.Item extra={currentUserInfo.bind_doctor_id}>绑定医生ID</List.Item>}
        {currentUserInfo.practice_duration_minutes !== undefined && <List.Item extra={`${currentUserInfo.practice_duration_minutes} 分钟`}>练习时长</List.Item>}
      </List>

      {/* 用户名编辑对话框 */}
      <Dialog
        visible={isEditingUsername}
        title="修改用户名"
        content={
          <Input
            ref={usernameInputRef} // 绑定 ref
            placeholder="请输入新的用户名"
            value={newUsername}
            onChange={(val) => setNewUsername(val)}
          // 移除这里的 onFocus，因为 useEffect 会处理聚焦和选中
          />
        }
        closeOnAction
        onClose={() => setIsEditingUsername(false)}
        actions={[
          [
            {
              key: 'cancel',
              text: '取消',
              onClick: () => setIsEditingUsername(false)
            },
            {
              key: 'save',
              text: '保存',
              bold: true,
              disabled: submittingUsername,
              onClick: saveUsername
            }
          ]
        ]}
      />

      {/* Gender Picker */}
      <Picker
        columns={genderColumns}
        visible={showGenderPicker}
        onClose={() => setShowGenderPicker(false)}
        // 确保 value 总是 'male' 或 'female'，如果不是，提供一个默认值
        value={[currentUserInfo.gender === 'male' || currentUserInfo.gender === 'female' ? currentUserInfo.gender : 'male']}
        onConfirm={handleGenderConfirm}
        title="选择性别"
      />

      {/* Birth Date Picker */}
      <DatePicker
        visible={showBirthDatePicker}
        onClose={() => setShowBirthDatePicker(false)}
        min={new Date(1900, 0, 1)} // January 1, 1900
        max={new Date()} // Cannot select future date
        // defaultValue 应该使用 Date 对象
        defaultValue={currentUserInfo?.birth_date ? dayjs(currentUserInfo.birth_date).toDate() : new Date()}
        onConfirm={handleBirthDateConfirm}
        title="选择出生日期"
      />

      {/* Disease Edit Dialog */}
      <Dialog
        visible={isEditingDisease}
        title="修改病症"
        content={
          <Input
            ref={diseaseInputRef}
            placeholder="请输入病症(留空则不设置)"
            value={newDisease ?? ''} // Use empty string for null/undefined in input
            onChange={(val) => setNewDisease(val)}
          />
        }
        closeOnAction
        onClose={() => {
          setIsEditingDisease(false);
          setNewDisease(undefined); // Reset temp state on close
        }}
        actions={[[
          { key: 'cancel', text: '取消' },
          { key: 'save', text: '保存', bold: true, disabled: submittingDisease, onClick: saveDisease }
        ]]}
      />
    </div>
  );
};

export default ProfileDetailPage;
