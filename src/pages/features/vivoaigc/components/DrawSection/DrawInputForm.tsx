import React from "react";
import {
  Button,
  Input,
  Form,
  Select,
  Card,
  message,
  InputNumber,
  Upload,
} from "antd";
import { PictureOutlined, UploadOutlined } from "@ant-design/icons";
import {
  createVivoAigcSDK,
  DRAW_STYLES,
  IMAGE_SIZES,
} from "../../../../../api/vivoAigc";
import type { DrawTask } from "./index";

const { TextArea } = Input;
const { Option } = Select;

interface DrawInputFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  tasks: DrawTask[];
  setTasks: React.Dispatch<React.SetStateAction<DrawTask[]>>;
  setCurrentTask: (task: DrawTask | null) => void;
}

const DrawInputForm: React.FC<DrawInputFormProps> = ({
  loading,
  setLoading,
  tasks,
  setTasks,
  setCurrentTask,
}) => {
  const [form] = Form.useForm();

  /**
   * 创建 SDK 实例
   */
  const createSDK = () => {
    return createVivoAigcSDK({
      appId: import.meta.env.VITE_VIVO_AIGC_APP_ID || "",
      appKey: import.meta.env.VITE_VIVO_AIGC_APP_KEY || "",
      baseURL:
        import.meta.env.VITE_VIVO_AIGC_BASE_URL || "https://api-ai.vivo.com.cn",
    });
  };

  /**
   * 提交绘画任务
   */
  const handleSubmitDraw = async (values: any) => {
    if (!values.prompt?.trim()) {
      message.error("请输入图像描述");
      return;
    }

    setLoading(true);

    try {
      const sdk = createSDK();

      // 创建任务
      const newTask: DrawTask = {
        taskId: "",
        prompt: values.prompt,
        status: "pending",
        timestamp: Date.now(),
      };

      // 提交绘画任务
      const taskId = await sdk.draw.textToImage(values.prompt, {
        width: values.width || 512,
        height: values.height || 512,
        styleConfig: values.styleConfig || DRAW_STYLES.GENERAL_V6,
        cfgScale: values.cfgScale || 7,
        steps: values.steps || 20,
        seed: values.seed || -1,
      });

      newTask.taskId = taskId;
      newTask.status = "processing";

      // 添加到任务列表
      setTasks((prev) => [newTask, ...prev]);
      setCurrentTask(newTask);

      message.success(`绘画任务已提交，任务ID: ${taskId}`);

      // 开始轮询任务状态
      pollTaskProgress(newTask, sdk);
    } catch (error: any) {
      message.error(`绘画任务提交失败: ${error.message}`);
      console.error("Draw task submission error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 轮询任务进度
   */
  const pollTaskProgress = async (task: DrawTask, sdk: any) => {
    const maxAttempts = 30; // 最多轮询30次
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const result = await sdk.draw.getTaskProgress(task.taskId);

        // 更新任务进度信息
        const updatedTask: DrawTask = {
          ...task,
          queue_ahead: result.queue_ahead,
          task_eta: result.task_eta,
        };

        if (result.status === 2) {
          // 完成
          const completedTask: DrawTask = {
            ...updatedTask,
            status: "completed",
            images: result.images_url || [],
          };

          // 更新任务状态
          setTasks((prev) =>
            prev.map((t) => (t.taskId === task.taskId ? completedTask : t)),
          );
          setCurrentTask(completedTask);

          message.success("绘画完成！");
        } else if (result.status === 3 || result.status === 4) {
          // 失败或取消
          const failedTask: DrawTask = {
            ...updatedTask,
            status: "failed",
            error: result.status === 3 ? "绘画任务失败" : "绘画任务已取消",
          };

          setTasks((prev) =>
            prev.map((t) => (t.taskId === task.taskId ? failedTask : t)),
          );
          setCurrentTask(failedTask);

          message.error(failedTask.error);
        } else if (result.status === 0 || result.status === 1) {
          // 队列中或正在处理，更新状态并继续轮询
          const processingTask: DrawTask = {
            ...updatedTask,
            status: result.status === 0 ? "pending" : "processing",
          };

          setTasks((prev) =>
            prev.map((t) => (t.taskId === task.taskId ? processingTask : t)),
          );
          setCurrentTask(processingTask);

          if (attempts < maxAttempts) {
            setTimeout(poll, 2000);
          } else {
            // 超时
            const timeoutTask: DrawTask = {
              ...updatedTask,
              status: "failed",
              error: "绘画任务超时",
            };

            setTasks((prev) =>
              prev.map((t) => (t.taskId === task.taskId ? timeoutTask : t)),
            );
            setCurrentTask(timeoutTask);

            message.error("绘画任务超时");
          }
        }
      } catch (error: any) {
        console.error("Poll task progress error:", error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          const errorTask: DrawTask = {
            ...task,
            status: "failed",
            error: `请求错误: ${error.message}`,
          };

          setTasks((prev) =>
            prev.map((t) => (t.taskId === task.taskId ? errorTask : t)),
          );
          setCurrentTask(errorTask);

          message.error("轮询任务进度失败");
        }
      }
    };

    poll();
  };

  return (
    <Card title="绘画输入" className="h-fit">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmitDraw}
        initialValues={{
          width: 512,
          height: 512,
          styleConfig: DRAW_STYLES.GENERAL_V6,
          cfgScale: 7,
          steps: 20,
          seed: -1,
        }}
      >
        <Form.Item
          name="prompt"
          label="图像描述"
          rules={[{ required: true, message: "请输入图像描述" }]}
        >
          <TextArea
            rows={4}
            placeholder="请详细描述您想要生成的图像..."
            className="resize-none"
          />
        </Form.Item>

        {/* 风格选择器 */}
        <Form.Item name="styleConfig" label="绘画风格">
          <Select placeholder="选择绘画风格">
            <Option value={DRAW_STYLES.GENERAL_V6}>
              <div>
                <div className="font-medium">通用v6.0</div>
                <div className="text-xs text-gray-500">
                  通用风格，适合大多数场景
                </div>
              </div>
            </Option>
          </Select>
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="width" label="图像宽度">
            <InputNumber
              min={400}
              max={1200}
              step={8}
              className="w-full"
              placeholder="400-1200"
            />
          </Form.Item>

          <Form.Item name="height" label="图像高度">
            <InputNumber
              min={400}
              max={1200}
              step={8}
              className="w-full"
              placeholder="400-1200"
            />
          </Form.Item>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Form.Item
            name="cfgScale"
            label="文本相关度"
            tooltip="控制生成图像与文本描述的相关度，值越高越相关"
          >
            <InputNumber min={3} max={15} step={0.5} className="w-full" />
          </Form.Item>

          <Form.Item
            name="steps"
            label="采样步数"
            tooltip="生成图像的迭代次数，步数越多质量越高但时间越长"
          >
            <InputNumber min={20} max={50} step={1} className="w-full" />
          </Form.Item>

          <Form.Item
            name="seed"
            label="随机种子"
            tooltip="控制随机性，使用相同种子可以生成相似图像，-1为随机"
          >
            <InputNumber
              min={-1}
              max={999999999}
              className="w-full"
              placeholder="-1 (随机)"
            />
          </Form.Item>
        </div>

        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          icon={<PictureOutlined />}
          className="w-full"
          size="large"
        >
          {loading ? "生成中..." : "开始绘画"}
        </Button>
      </Form>
    </Card>
  );
};

export default DrawInputForm;
