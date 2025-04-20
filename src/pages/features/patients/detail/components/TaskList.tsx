import React from 'react';
import { List, Spin, Empty, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { PracticeTaskInfo } from '../../../../../api/patients';

const { Paragraph, Title } = Typography;

// --- 辅助函数 (从父组件或 utils 移入/导入) ---
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


interface TaskListProps {
    tasks: PracticeTaskInfo[];
    loading: boolean;
    error: string | null;
    // 可以添加 corpusMap 用于显示语料标题，如果需要的话
    // corpusMap: Record<string, CorpusInfo>;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, error }) => {
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
                itemLayout="vertical"
                dataSource={tasks}
                renderItem={task => (
                    // 使用任务 UUID 作为 key
                    <List.Item key={task.uuid}>
                        <List.Item.Meta
                            // 标题可以显示任务 UUID 或语料 UUID
                            title={`任务: ${task.uuid.substring(0, 8)}...`}
                            description={
                                <>
                                    {/* 可以选择显示语料 UUID */}
                                    <Paragraph>语料UUID: {task.text_uuid}</Paragraph>
                                    {/* 如果有 corpusMap，可以在这里显示语料标题 */}
                                    {/* <Paragraph>语料标题: {corpusMap[task.text_uuid]?.title || '加载中...'}</Paragraph> */}
                                    <div>
                                        {/* 根据 finished 字段显示状态 */}
                                        状态: <Tag color={task.finished ? 'green' : 'orange'}>{task.finished ? '已完成' : '待完成'}</Tag> |
                                        分配时间: {formatDateTime(task.created_at)}
                                    </div>
                                </>
                            }
                        />
                        {/* 可以添加操作，例如查看语料详情 */}
                        {/* actions={[<Button size="small" onClick={() => onViewCorpus(task.text_uuid)}>查看语料</Button>]} */}
                    </List.Item>
                )}
            />
        </div>
    );
};

export default TaskList;
