import React from "react";
import { Card, Spin, Empty, Tag, Button, message } from "antd";
import { DownloadOutlined, ClearOutlined } from "@ant-design/icons";
import type { DrawTask } from "./index";

interface DrawResultsProps {
  loading: boolean;
  currentTask: DrawTask | null;
  tasks: DrawTask[];
  setTasks: React.Dispatch<React.SetStateAction<DrawTask[]>>;
  setCurrentTask: (task: DrawTask | null) => void;
}

const DrawResults: React.FC<DrawResultsProps> = ({
  loading,
  currentTask,
  tasks,
  setTasks,
  setCurrentTask,
}) => {
  /**
   * 下载图片
   */
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
      message.success("图片下载成功");
    } catch (error) {
      message.error("图片下载失败");
    }
  };

  /**
   * 清空任务历史
   */
  const clearTasks = () => {
    setTasks([]);
    setCurrentTask(null);
    message.success("任务历史已清空");
  };

  /**
   * 获取状态标签
   */
  const getStatusTag = (status: DrawTask["status"], task?: DrawTask) => {
    const statusConfig = {
      pending: {
        color: "orange",
        text: task?.queue_ahead
          ? `排队中 (前面${task.queue_ahead}人)`
          : "等待中",
      },
      processing: {
        color: "blue",
        text: task?.task_eta ? `生成中 (预计${task.task_eta}秒)` : "生成中",
      },
      completed: { color: "green", text: "已完成" },
      failed: { color: "red", text: "失败" },
    };

    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  return (
    <Card
      title="绘画结果"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ClearOutlined />}
          onClick={clearTasks}
          disabled={tasks.length === 0}
        >
          清空历史
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin tip="正在生成图片..." />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 当前任务结果 */}
          {currentTask && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusTag(currentTask.status, currentTask)}
                  <span className="text-sm text-gray-500">
                    #{currentTask.taskId.slice(-8)}
                  </span>
                </div>
              </div>

              <div className="text-sm mb-3">
                <strong>描述：</strong>
                {currentTask.prompt}
              </div>

              {/* 进度信息 */}
              {(currentTask.status === "pending" ||
                currentTask.status === "processing") && (
                <div className="text-xs text-gray-500 mb-3 p-2 bg-blue-50 rounded">
                  {currentTask.status === "pending" &&
                    currentTask.queue_ahead && (
                      <div>
                        ⏳ 排队中，前面还有 {currentTask.queue_ahead} 个任务
                      </div>
                    )}
                  {currentTask.status === "processing" &&
                    currentTask.task_eta && (
                      <div>
                        🎨 正在生成中，预计还需 {currentTask.task_eta} 秒
                      </div>
                    )}
                  {!currentTask.queue_ahead && !currentTask.task_eta && (
                    <div>⏳ 任务进行中，请耐心等待...</div>
                  )}
                </div>
              )}

              {currentTask.status === "completed" && currentTask.images && (
                <div className="space-y-3">
                  {currentTask.images.map((imageUrl, index) => (
                    <div key={index} className="space-y-2">
                      <img
                        src={imageUrl}
                        alt={`Generated ${index + 1}`}
                        className="w-full rounded-lg shadow-sm"
                        style={{ maxHeight: "400px", objectFit: "contain" }}
                      />
                      <Button
                        type="primary"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() =>
                          downloadImage(
                            imageUrl,
                            `generated-image-${index + 1}.jpg`,
                          )
                        }
                        className="w-full"
                      >
                        下载图片
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {currentTask.status === "failed" && (
                <div className="text-red-500 text-sm">
                  错误：{currentTask.error || "生成失败"}
                </div>
              )}
            </div>
          )}

          {/* 历史任务 */}
          {tasks.length > 1 && (
            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">
                历史任务
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {tasks.slice(1).map((task, index) => (
                  <div
                    key={task.taskId}
                    className="border rounded p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setCurrentTask(task)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {getStatusTag(task.status, task)}
                      <span className="text-xs text-gray-400">
                        {new Date(task.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 truncate">
                      {task.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {tasks.length === 0 && !loading && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无绘画任务"
            />
          )}
        </div>
      )}
    </Card>
  );
};

export default DrawResults;
