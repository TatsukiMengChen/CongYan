import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Input, Toast } from 'antd-mobile';
import { InputRef } from 'antd-mobile/es/components/input';

interface EditUsernameDialogProps {
  visible: boolean;
  onClose: () => void;
  currentUsername: string;
  onSave: (newUsername: string) => Promise<void>; // 接收一个返回 Promise 的保存函数
}

const EditUsernameDialog: React.FC<EditUsernameDialogProps> = ({
  visible,
  onClose,
  currentUsername,
  onSave,
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (visible) {
      setNewUsername(currentUsername); // 对话框显示时，用当前用户名初始化输入框
      // 使用 setTimeout 确保 DOM 更新后再聚焦
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.nativeElement?.select(); // 选中现有文本
      }, 100); // 短暂延迟
      return () => clearTimeout(timer); // 清理定时器
    } else {
      // 对话框关闭时重置状态
      setSubmitting(false);
    }
  }, [visible, currentUsername]);

  const handleSave = async () => {
    if (!newUsername.trim()) {
      Toast.show({ content: '用户名不能为空', position: 'center' });
      return;
    }
    if (newUsername === currentUsername) {
      onClose(); // 没有变化，直接关闭
      return;
    }
    setSubmitting(true);
    try {
      await onSave(newUsername); // 调用父组件传入的保存逻辑
      onClose(); // 保存成功后关闭
    } catch (error) {
      // 错误处理已在父组件的 onSave 中完成 (Toast提示)
      // 这里可以选择是否保持对话框打开，目前逻辑是无论如何都尝试关闭
      console.error("Error saving username in dialog:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      visible={visible}
      title="修改用户名"
      content={
        <Input
          ref={inputRef}
          placeholder="请输入新的用户名"
          value={newUsername}
          onChange={(val) => setNewUsername(val)}
        />
      }
      closeOnAction
      onClose={onClose}
      actions={[
        [
          {
            key: 'cancel',
            text: '取消',
            onClick: onClose,
          },
          {
            key: 'save',
            text: '保存',
            bold: true,
            disabled: submitting,
            onClick: handleSave,
          },
        ],
      ]}
    />
  );
};

export default EditUsernameDialog;
