import React from 'react';
// 引入 Button 和 DeleteOutlined 图标
import { List, Spin, Empty, Typography, Tag, Button, Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PracticeTaskInfo } from '../../../../../api/patients';

const { Title } = Typography;

// --- 辅助函数 (如果需要，从父组件或 utils 移入/导入) ---
const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return '未知';
    try {
      const date = dayjs(dateString);
      return date.isValid() ? date.format('YYYY-MM-DD HH:mm') : '日期无效';
    } catch (e) {
      return '日期无效';
    }
  };
// --- 结束辅助函数 ---


interface PatientTaskListProps {
  tasks: PracticeTaskInfo[];
  loading: boolean;
  error: string | null;
  onTaskClick: (task: PracticeTaskInfo) => void;
  onDeleteTask: (taskUuid: string) => void; // 添加删除回调函数类型
}

const PatientTaskList: React.FC<PatientTaskListProps> = ({ tasks, loading, error, onTaskClick, onDeleteTask }) => {
  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}><Spin /></div>;
  }
  if (error) {
    return <Empty description={error} />;
  }
  if (tasks.length === 0) {
    return <Empty description="该病人暂无训练任务" />;
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <Title level={5}>训练任务列表</Title>
      <List
        itemLayout="horizontal" // 改回 horizontal 可能更紧凑
        dataSource={tasks}
        renderItem={task => (
          <List.Item
            key={task.uuid}
            // actions 数组用于在列表项右侧添加操作按钮
            actions={[
              <Popconfirm
                title="确定删除此任务吗？"
                onConfirm={(e) => {
                  e?.stopPropagation(); // 阻止事件冒泡触发行点击
                  onDeleteTask(task.uuid);
                }}
                onCancel={(e) => e?.stopPropagation()} // 阻止事件冒泡
                okText="确认删除"
                cancelText="取消"
              >
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => e.stopPropagation()} // 阻止事件冒泡触发行点击
                />
              </Popconfirm>
            ]}
          >
            {/* Meta 部分仍然可点击查看详情 */}
            <div onClick={() => onTaskClick(task)} style={{ flexGrow: 1, cursor: 'pointer' }}>
              <List.Item.Meta
                title={task.practice_text?.title || `任务 ${task.uuid.substring(0, 8)}...`}
                description={
                  <div>
                    状态: <Tag color={task.finished ? 'green' : 'blue'}>{task.finished ? '已完成' : '待完成'}</Tag> |
                    分配时间: {formatDateTime(task.created_at)}
                  </div>
                }
              />
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default PatientTaskList;
