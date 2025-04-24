import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import useAuthStore from '../../../store/auth';
import { NavBar, Picker, Toast, DatePicker } from 'antd-mobile'; // 移除 List, Avatar, Tag, Input, Dialog
import { CopyOutlined } from '@ant-design/icons';
// import { InputRef } from 'antd-mobile/es/components/input'; // 不再需要 InputRef
import styles from './index.module.scss';
import { UserInfo, UpdateUsernameAPI, UpdateUserInfoAPI, UpdateUserInfoPayload, GetUserInfoAPI } from '../../../api/user'; // 导入 GetUserInfoAPI
// import { getAvatarSrc } from '../../../utils/avatar'; // 移至 ProfileHeader
import dayjs from 'dayjs'; // 保留 dayjs
import utc from 'dayjs/plugin/utc'; // 保留 utc
import ProfileHeader from './ProfileHeader'; // 导入新组件
import ProfileInfoList from './ProfileInfoList'; // 导入新组件
import EditUsernameDialog from './EditUsernameDialog'; // 导入新组件
import EditDiseaseDialog from './EditDiseaseDialog'; // 导入新组件
import { ensureISOFormat, formatBirthDateForAPI } from '../../../utils/formatters';

dayjs.extend(utc);

// 移除已移至 utils.ts 的辅助函数: mapGender, mapRole, calculateAge, formatBirthDateDisplay

const ProfileDetailPage: React.FC = () => {
  const { userInfo: storeUserInfo, setUserInfo } = useAuthStore();
  const navigate = useNavigate();
  const [currentUserInfo, setCurrentUserInfo] = useState<UserInfo | null>(storeUserInfo);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  // const [newUsername, setNewUsername] = useState(''); // 移至 EditUsernameDialog
  // const [submittingUsername, setSubmittingUsername] = useState(false); // 移至 EditUsernameDialog
  // const usernameInputRef = useRef<InputRef>(null); // 移至 EditUsernameDialog
  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);
  const [isEditingDisease, setIsEditingDisease] = useState(false);
  // const [newDisease, setNewDisease] = useState<string | null | undefined>(undefined); // 移至 EditDiseaseDialog
  // const [submittingDisease, setSubmittingDisease] = useState(false); // 移至 EditDiseaseDialog
  // const diseaseInputRef = useRef<InputRef>(null); // 移至 EditDiseaseDialog

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

  // --- 获取并更新用户信息 ---
  const refreshUserInfo = async () => {
    console.log("尝试刷新用户信息...");
    try {
      const res = await GetUserInfoAPI();
      if (res.status === 0 && res.data) {
        console.log("成功获取最新用户信息:", res.data);
        const freshUserInfo = res.data;
        // 确保日期格式正确
        if (freshUserInfo.birth_date) {
          freshUserInfo.birth_date = ensureISOFormat(freshUserInfo.birth_date);
        }
        updateLocalUserInfo(freshUserInfo); // 使用通用更新函数
      } else {
        console.error("刷新用户信息失败:", res.message);
        Toast.show({ content: res.message || '刷新用户信息失败', position: 'center' });
      }
    } catch (error) {
      console.error('刷新用户信息时发生错误:', error);
      Toast.show({ content: '无法获取最新信息，请稍后重试', position: 'center' });
    }
  };

  useEffect(() => {
    if (!storeUserInfo) {
      const storedUserInfo = localStorage.getItem('userInfo');
      if (storedUserInfo) {
        try {
          const parsedInfo = JSON.parse(storedUserInfo);
          // 在设置之前确保日期格式正确
          if (parsedInfo.birth_date) {
            parsedInfo.birth_date = ensureISOFormat(parsedInfo.birth_date);
          }
          setCurrentUserInfo(parsedInfo);
        } catch (e) {
          console.error("解析本地用户信息失败:", e);
          // 如果本地信息解析失败，尝试从服务器获取
          refreshUserInfo();
        }
      } else {
        // 如果 store 和本地都没有，尝试从服务器获取
        refreshUserInfo();
      }
    } else {
      // 确保从 store 加载时也检查日期格式
      const infoToSet = { ...storeUserInfo };
      if (infoToSet.birth_date) {
        infoToSet.birth_date = ensureISOFormat(infoToSet.birth_date);
      }
      setCurrentUserInfo(infoToSet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeUserInfo]); // 依赖 storeUserInfo，但 refreshUserInfo 本身不应作为依赖

  // 移除 username 和 disease input 的 focus useEffect

  const goBack = () => {
    navigate(-1);
  };

  // --- 用户名编辑 ---
  const startEditUsername = () => {
    setIsEditingUsername(true);
  };

  const saveUsername = async (newUsername: string) => {
    // 实际的 API 调用逻辑保留在主组件中
    if (!currentUserInfo) return; // 添加检查
    try {
      // 注意：子组件已处理空检查和是否更改的逻辑
      const response = await UpdateUsernameAPI(newUsername);
      if (response.status === 0) {
        const updatedUserInfo = { ...currentUserInfo, username: newUsername };
        updateLocalUserInfo(updatedUserInfo);
        Toast.show({ content: '用户名修改成功', position: 'center' });
      } else {
        Toast.show({ content: response.message || '修改用户名失败', position: 'center' });
        throw new Error(response.message || '修改用户名失败'); // 抛出错误以便子组件知道失败
      }
    } catch (error) {
      console.error('修改用户名失败:', error);
      Toast.show({ content: '系统错误，请稍后再试', position: 'center' });
      throw error; // 重新抛出错误
    }
    // finally 逻辑移至子组件
  };

  // --- 通用信息更新处理 ---
  const updateLocalUserInfo = (updatedInfo: UserInfo) => {
    // 确保更新前日期格式正确
    if (updatedInfo.birth_date) {
      updatedInfo.birth_date = ensureISOFormat(updatedInfo.birth_date);
    }
    setUserInfo(updatedInfo);
    setCurrentUserInfo(updatedInfo);
    localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
  };

  const handleUpdateUserInfo = async (payload: Partial<UpdateUserInfoPayload>): Promise<boolean> => { // 返回 boolean 表示成功或失败
    if (!currentUserInfo) return false;

    const fullPayload: UpdateUserInfoPayload = {
      gender: payload.gender !== undefined
        ? payload.gender
        : (currentUserInfo.gender === 'male' || currentUserInfo.gender === 'female'
          ? currentUserInfo.gender
          : undefined),
      birth_date: payload.birth_date !== undefined
        ? payload.birth_date // 已经是 ISO 格式或 null
        : ensureISOFormat(currentUserInfo.birth_date),
      disease: payload.disease !== undefined
        ? (payload.disease === '' ? null : payload.disease) // 空字符串转 null
        : currentUserInfo.disease,
    };

    try {
      const response = await UpdateUserInfoAPI(fullPayload);
      if (response.status === 0) {
        // 确保从后端返回的数据中，日期也是 ISO 格式
        const backendData = response.data;
        if (backendData?.birth_date) {
          backendData.birth_date = ensureISOFormat(backendData.birth_date);
        }
        const updatedUserInfo = backendData ? backendData : {
          ...currentUserInfo,
          ...fullPayload,
          // 如果后端没返回 data，确保 birth_date 格式正确
          birth_date: ensureISOFormat(fullPayload.birth_date)
        };
        updateLocalUserInfo(updatedUserInfo);
        Toast.show({ content: '信息更新成功', position: 'center' });
        return true;
      } else {
        Toast.show({ content: response.message || '更新失败', position: 'center' });
        return false;
      }
    } catch (error) {
      console.error('更新用户信息失败:', error);
      Toast.show({ content: '系统错误，请稍后再试', position: 'center' });
      return false;
    }
  };


  // --- 性别编辑 ---
  const genderColumns = [
    [
      { label: '男', value: 'male' },
      { label: '女', value: 'female' },
    ],
  ];

  const handleGenderConfirm = async (value: any[]) => {
    const selectedGender = value[0] as "male" | "female";
    if (currentUserInfo && selectedGender !== currentUserInfo.gender) {
      await handleUpdateUserInfo({ gender: selectedGender });
    } else if (!currentUserInfo) {
      console.error("Cannot update gender: currentUserInfo is null");
    }
    // Picker 会自动关闭
  };

  // --- 出生日期编辑 ---
  const handleBirthDateConfirm = async (value: Date | null) => {
    const formattedDate = formatBirthDateForAPI(value); // 返回 ISO string 或 null
    const currentIsoDate = ensureISOFormat(currentUserInfo?.birth_date);

    if (formattedDate !== currentIsoDate) {
      await handleUpdateUserInfo({ birth_date: formattedDate });
    }
    // DatePicker 会自动关闭
  };

  // --- 病症编辑 ---
  const startEditDisease = () => {
    setIsEditingDisease(true);
  };

  const saveDisease = async (newDisease: string | null): Promise<boolean> => {
    // 子组件已处理是否更改的逻辑
    // 直接调用通用更新函数
    const success = await handleUpdateUserInfo({ disease: newDisease });
    // 返回成功状态给子组件，以便子组件决定是否关闭对话框
    return success;
    // finally 逻辑移至子组件
  };


  if (!currentUserInfo) {
    return <div>加载用户信息中或信息不存在...</div>;
  }

  // 移除已移至子组件的变量计算: avatarSrc, age, displayGender, displayRole, displayBirthDate, displayDisease

  return (
    <div className={styles.profileDetailContainer}>
      <NavBar onBack={goBack}>个人信息</NavBar>

      {/* 使用 ProfileHeader 组件，并传入刷新函数 */}
      <ProfileHeader userInfo={currentUserInfo} onAvatarChangeSuccess={refreshUserInfo} />

      {/* 使用 ProfileInfoList 组件 */}
      <ProfileInfoList
        userInfo={currentUserInfo}
        onCopyUserId={copyUserId}
        onEditUsername={startEditUsername}
        onEditGender={() => setShowGenderPicker(true)}
        onEditBirthDate={() => setShowBirthDatePicker(true)}
        onEditDisease={startEditDisease}
      />

      {/* 使用 EditUsernameDialog 组件 */}
      <EditUsernameDialog
        visible={isEditingUsername}
        onClose={() => setIsEditingUsername(false)}
        currentUsername={currentUserInfo.username}
        onSave={saveUsername}
      />

      {/* Gender Picker */}
      <Picker
        columns={genderColumns}
        visible={showGenderPicker}
        onClose={() => setShowGenderPicker(false)}
        value={[currentUserInfo.gender === 'male' || currentUserInfo.gender === 'female' ? currentUserInfo.gender : 'male']}
        onConfirm={handleGenderConfirm}
        title="选择性别"
      />

      {/* Birth Date Picker */}
      <DatePicker
        visible={showBirthDatePicker}
        onClose={() => setShowBirthDatePicker(false)}
        min={new Date(1900, 0, 1)}
        max={new Date()}
        // 确保 defaultValue 使用 Date 对象，并处理 null/undefined/无效日期
        defaultValue={currentUserInfo?.birth_date && dayjs(currentUserInfo.birth_date).isValid() ? dayjs(currentUserInfo.birth_date).toDate() : new Date()}
        onConfirm={handleBirthDateConfirm}
        title="选择出生日期"
      />

      {/* 使用 EditDiseaseDialog 组件 */}
      <EditDiseaseDialog
        visible={isEditingDisease}
        onClose={() => setIsEditingDisease(false)}
        currentDisease={currentUserInfo.disease}
        onSave={saveDisease}
      />
    </div>
  );
};

export default ProfileDetailPage;
