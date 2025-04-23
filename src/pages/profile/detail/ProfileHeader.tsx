import React, { useState, useRef } from 'react';
import { Avatar, Tag, Toast } from 'antd-mobile'; // 移除 ImageUploader
// import type { ImageUploadItem } from 'antd-mobile/es/components/image-uploader'; // 移除类型
import styles from './index.module.scss';
import { UserInfo } from '../../../api/user';
import { getAvatarSrc } from '../../../utils/avatar';
import { mapGender, mapRole, calculateAge } from '../../../utils/formatters';
import { GetOssPreSignedUrlAPI, UploadToOSSAPI } from '../../../api/oss'; // 导入 OSS API
import { UpdateAvatarAPI } from '../../../api/user'; // 导入 User API

interface ProfileHeaderProps {
  userInfo: UserInfo;
  onAvatarChangeSuccess: () => void; // 回调函数保持不变
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ userInfo, onAvatarChangeSuccess }) => {
  // 移除 avatarFileList state
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // 用于引用隐藏的文件输入框

  const avatarSrc = getAvatarSrc(userInfo);
  const age = calculateAge(userInfo.birth_date);
  const displayGender = mapGender(userInfo.gender);
  const displayRole = mapRole(userInfo.user_role);

  // 上传逻辑，不再需要返回 ImageUploadItem
  const handleAvatarUpload = async (file: File): Promise<void> => { // 返回类型改为 void
    setIsUploading(true);
    Toast.show({ icon: 'loading', content: '上传中...', duration: 0, maskClickable: false }); // 添加 maskClickable: false

    try {
      // 1. 获取文件后缀
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) { // 添加基本的文件类型校验
        throw new Error('请选择 jpg, png, gif 格式的图片');
      }
      if (file.size > 5 * 1024 * 1024) { // 示例：限制文件大小为 5MB
        throw new Error('图片大小不能超过 5MB');
      }

      // 2. 获取预签名 URL
      const preSignedUrlRes = await GetOssPreSignedUrlAPI({
        "object-type": "avatar",
        "object-suffix": fileExtension,
      });

      if (preSignedUrlRes.status !== 0 || !preSignedUrlRes.data?.url) {
        throw new Error(preSignedUrlRes.message || '获取上传地址失败');
      }

      const uploadUrl = preSignedUrlRes.data.url;

      // 3. 上传文件到 OSS (使用 fetch)
      await UploadToOSSAPI(uploadUrl, file);

      // 4. 通知后端更新头像
      const updateRes = await UpdateAvatarAPI();
      if (updateRes.status !== 0) {
        throw new Error(updateRes.message || '更新头像失败');
      }

      Toast.show({ icon: 'success', content: '头像更新成功' });
      onAvatarChangeSuccess(); // 通知父组件刷新用户信息

      // 不再需要返回 ImageUploadItem
      // return { url: URL.createObjectURL(file) };

    } catch (error: any) {
      console.error("头像上传失败:", error);
      Toast.show({ icon: 'fail', content: error.message || '上传失败，请重试' });
      // 不再需要抛出错误给 ImageUploader
      // throw error;
    } finally {
      setIsUploading(false);
      Toast.clear();
      // 清理隐藏的 input 的值，以便可以再次选择相同的文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 点击头像时触发
  const handleAvatarClick = () => {
    console.log('点击头像，触发文件选择');
    if (isUploading) {
      Toast.show('正在上传中，请稍候...');
      return;
    }
    // 触发隐藏的文件输入框的点击事件
    fileInputRef.current?.click();
  };

  // 文件选择后的处理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      handleAvatarUpload(selectedFile); // 调用上传处理函数
    }
  };

  return (
    <div className={styles.profileHeader}>
      {/*
        直接在 Avatar 上添加 onClick 事件。
        添加一个隐藏的 input[type=file] 用于选择文件。
      */}
      <div
        onClick={handleAvatarClick} // 点击头像触发文件选择
      >
        <Avatar
          src={avatarSrc}
          className={styles.headerAvatar}
          style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }} // 根据上传状态改变鼠标样式
        />
      </div>
      {/* 隐藏的文件选择输入框 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/png, image/jpeg, image/gif" // 限制可选的文件类型
        onChange={handleFileChange} // 文件选择后触发
      />

      <div className={styles.headerInfo}>
        <div className={styles.headerUsername}>{userInfo.username}</div>
        <div className={styles.headerTags}>
          {displayRole !== '未知' && <Tag color='primary' fill='outline' className={styles.tag}>{displayRole}</Tag>}
          {userInfo.gender && displayGender !== '未设置' && <Tag color={userInfo.gender === 'female' ? 'warning' : 'success'} fill='outline' className={styles.tag}>{displayGender}</Tag>}
          {age && <Tag color='default' fill='outline' className={styles.tag}>{age}</Tag>}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;
