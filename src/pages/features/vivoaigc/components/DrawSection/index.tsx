import React, { useState } from "react";
import { Typography } from "antd";
import DrawInputForm from "./DrawInputForm";
import DrawResults from "./DrawResults";

const { Title, Paragraph } = Typography;

export interface DrawTask {
  taskId: string;
  prompt: string;
  status: "pending" | "processing" | "completed" | "failed";
  images?: string[];
  error?: string;
  timestamp: number;
  queue_ahead?: number;
  task_eta?: number;
}

const DrawSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<DrawTask[]>([]);
  const [currentTask, setCurrentTask] = useState<DrawTask | null>(null);

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Title level={3} className="!mb-2">
          AI绘画
        </Title>
        <Paragraph className="text-gray-600">
          基于 Vivo AIGC 官方 API 的文生图功能，支持多种绘画风格
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 输入区域 */}
        <div className="lg:col-span-2">
          <DrawInputForm
            loading={loading}
            setLoading={setLoading}
            tasks={tasks}
            setTasks={setTasks}
            setCurrentTask={setCurrentTask}
          />
        </div>

        {/* 结果显示区域 */}
        <div className="lg:col-span-1">
          <DrawResults
            loading={loading}
            currentTask={currentTask}
            tasks={tasks}
            setTasks={setTasks}
            setCurrentTask={setCurrentTask}
          />
        </div>
      </div>
    </div>
  );
};

export default DrawSection;
