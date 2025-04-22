import React, { useState } from 'react';
import { Input, Button, Card, Typography, Spin, message, Alert, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import Navbar from '../../../../components/Navbar';
import useAuthStore from '../../../../store/auth';
import { BindPatientAPI } from '../../../../api/patients'; // Remove UnbindPatientAPI import, only use BindPatientAPI

const { Title, Text } = Typography;

const RelativeManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { userInfo, fetchUserInfo } = useAuthStore();
  const [bindIdInput, setBindIdInput] = useState('');
  const [isBinding, setIsBinding] = useState(false);
  const [isUnbinding, setIsUnbinding] = useState(false);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBindInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBindIdInput(e.target.value);
  };

  const handleBind = async () => {
    if (!bindIdInput.trim()) {
      message.warning('请输入要绑定的病人ID');
      return;
    }
    setIsBinding(true);
    try {
      const res = await BindPatientAPI(bindIdInput.trim());
      if (res.status === 0) {
        message.success(res.message || '绑定成功');
        setBindIdInput('');
        await fetchUserInfo(); // Refresh user info to get updated bind_id
        //刷新页面
        window.location.reload();
      } else {
        message.error(res.message || '绑定失败，请检查病人ID是否正确');
      }
    } catch (error: any) {
      message.error(error.message || '绑定过程中发生错误');
    } finally {
      setIsBinding(false);
    }
  };

  const confirmUnbind = () => {
    if (!userInfo?.bind_patient_id) return;
    Modal.confirm({
      title: '确认解绑',
      icon: <ExclamationCircleOutlined />,
      content: `确定要解除与病人 (ID: ${userInfo.bind_patient_id}) 的绑定关系吗？`,
      okText: '确认解绑',
      okType: 'danger',
      cancelText: '取消',
      onOk: handleUnbind,
      okButtonProps: { loading: isUnbinding },
    });
  };

  const handleUnbind = async () => {
    // No need to check userInfo.bind_patient_id here as we are setting it to '0'
    setIsUnbinding(true);
    try {
      // Call BindPatientAPI with '0' to unbind
      const res = await BindPatientAPI('0');
      if (res.status === 0) {
        message.success(res.message || '解绑成功');
        await fetchUserInfo(); // Refresh user info
        // 刷新页面
        window.location.reload();
      } else {
        message.error(res.message || '解绑失败');
      }
    } catch (error: any) {
      message.error(error.message || '解绑过程中发生错误');
    } finally {
      setIsUnbinding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Navbar onBack={handleBack}>绑定管理</Navbar>
      <div className="p-4 flex-grow">
        <Card>
          {userInfo?.bind_patient_id ? (
            <div>
              <Title level={5}>当前已绑定</Title>
              <Text>您当前已绑定病人，ID为：</Text>
              <Text strong code>{userInfo.bind_patient_id}</Text>
              <Button
                type="primary"
                danger
                onClick={confirmUnbind}
                loading={isUnbinding}
                style={{ marginTop: '20px' }}
                block
              >
                解除绑定
              </Button>
            </div>
          ) : (
            <div>
              <Title level={5}>绑定新病人</Title>
              <Alert message="您当前未绑定任何病人。请输入病人的专属绑定ID进行绑定。" type="info" showIcon style={{ marginBottom: '20px' }} />
              <Input
                placeholder="请输入病人的绑定ID"
                value={bindIdInput}
                onChange={handleBindInputChange}
                onPressEnter={handleBind}
                style={{ marginBottom: '10px' }}
              />
              <Button
                type="primary"
                onClick={handleBind}
                loading={isBinding}
                block
              >
                确认绑定
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RelativeManagementPage;
