import React, { useState, useEffect, useRef } from 'react';
import { Dialog, Input, Toast } from 'antd-mobile';
import { InputRef } from 'antd-mobile/es/components/input';

interface EditDiseaseDialogProps {
  visible: boolean;
  onClose: () => void;
  currentDisease: string | null | undefined;
  onSave: (newDisease: string | null) => Promise<boolean>; // 返回 Promise<boolean> 表示是否成功
}

const EditDiseaseDialog: React.FC<EditDiseaseDialogProps> = ({
  visible,
  onClose,
  currentDisease,
  onSave,
}) => {
  const [newDisease, setNewDisease] = useState<string>(''); // 内部状态用 string
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (visible) {
      // 初始化输入框，将 null/undefined 转为空字符串
      setNewDisease(currentDisease ?? '');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.nativeElement?.select();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setSubmitting(false);
    }
  }, [visible, currentDisease]);

  const handleSave = async () => {
    // 将空字符串转换为 null 以便比较和发送
    const diseaseValueToSend = newDisease.trim() === '' ? null : newDisease.trim();
    const originalValue = currentDisease ?? null; // 将 undefined 也视为 null

    if (diseaseValueToSend === originalValue) {
      onClose(); // 没有变化，直接关闭
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSave(diseaseValueToSend); // 调用父组件的保存逻辑
      if (success) {
        onClose(); // 保存成功后关闭
      }
      // 如果保存失败，父组件会显示 Toast，对话框保持打开状态由 finally 控制
    } catch (error) {
      console.error("Error saving disease in dialog:", error);
      // 父组件已处理 Toast
    } finally {
      // 只有在非提交状态下才允许关闭（例如点击取消按钮）
      // 如果提交失败，保持对话框打开，让用户可以重试或取消
      // setSubmitting(false); // 移动到 try/catch 之后，确保总是执行
      setSubmitting(false);
      // 注意：如果保存失败，对话框不会自动关闭，需要用户手动点击取消或再次尝试保存
    }
  };

  const handleClose = () => {
    // 确保在关闭时重置状态，避免下次打开时显示旧值
    setNewDisease(currentDisease ?? '');
    onClose();
  }

  return (
    <Dialog
      visible={visible}
      title="修改病症"
      content={
        <Input
          ref={inputRef}
          placeholder="请输入病症(留空则不设置)"
          value={newDisease}
          onChange={(val) => setNewDisease(val)}
        />
      }
      closeOnAction // 点击 Action 时关闭对话框的行为由我们自己的逻辑控制
      onClose={handleClose} // 使用自定义的关闭处理
      actions={[[
        { key: 'cancel', text: '取消', onClick: handleClose }, // 点击取消时调用 handleClose
        { key: 'save', text: '保存', bold: true, disabled: submitting, onClick: handleSave }
      ]]}
    />
  );
};

export default EditDiseaseDialog;
