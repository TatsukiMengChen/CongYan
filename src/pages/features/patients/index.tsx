import React, { useState, useEffect } from 'react';
import { List, Avatar, Spin, Empty, message } from 'antd'; // 引入 Spin, Empty 和 message
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router';
import Navbar from "../../../components/Navbar";
import { GetPatientsAPI, PatientInfo } from '../../../api/patients'; // 引入 API 函数和类型
import { getAvatarSrc } from '../../../utils/avatar'; // 更新导入路径

const PatientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<PatientInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError(null);
      const res = await GetPatientsAPI();
      if (res.status === 0 && res.patients) {
        setPatients(res.patients);
      } else {
        setError(res.message || '加载病人列表失败');
        message.error(res.message || '加载病人列表失败');
      }
      setLoading(false);
    };

    fetchPatients();
  }, []); // 空依赖数组，仅在组件挂载时运行

  const handleBack = () => {
    navigate(-1);
  };

  // 处理查看详情点击事件 (暂未实现具体跳转逻辑)
  const handleViewDetails = (patientId: number) => {
    console.log("查看病人详情:", patientId);
    // navigate(`/patient/${patientId}`); // 示例：跳转到病人详情页
    message.info(`暂未实现查看病人 ${patientId} 详情`);
  };

  const renderContent = () => {
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spin size="large" /></div>;
    }
    if (error) {
      // 可以显示更友好的错误提示或重试按钮
      return <Empty description={error} />;
    }
    if (patients.length === 0) {
      return <Empty description="暂无病人信息" />;
    }
    return (
      <List
        itemLayout="horizontal"
        dataSource={patients}
        renderItem={patient => (
          <List.Item
            actions={[<a key="view-details" onClick={() => handleViewDetails(patient.id)}>查看详情</a>]}
          >
            <List.Item.Meta
              // 使用 getAvatarSrc 处理头像，需要 PatientInfo 兼容 UserInfo
              avatar={<Avatar icon={<UserOutlined />} src={getAvatarSrc(patient)} />}
              title={<a>{patient.username}</a>} // 点击标题暂无操作
              // 可以添加更多描述信息，例如性别、年龄等
              description={`手机号: ${patient.phone_number || '未提供'}`}
            />
          </List.Item>
        )}
      />
    );
  };


  return (
    <>
      <Navbar onBack={handleBack}>我的病人</Navbar>
      <div style={{ padding: '10px' }}>
        {renderContent()}
      </div>
    </>
  );
};

export default PatientsPage;
