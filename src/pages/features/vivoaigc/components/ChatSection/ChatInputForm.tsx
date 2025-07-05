import React from "react";
import { Button, Input, Form, Select, Card, message } from "antd";
import { SendOutlined, HistoryOutlined } from "@ant-design/icons";
import {
  createVivoAigcSDK,
  VIVO_MODELS,
  SYSTEM_PROMPTS,
  type ChatMessage,
} from "../../../../../api/vivoAigc";
import ChatParameterPanel from "./ChatParameterPanel";

const { TextArea } = Input;
const { Option } = Select;

interface ChatInputFormProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setCurrentResponse: (response: string) => void;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

const ChatInputForm: React.FC<ChatInputFormProps> = ({
  loading,
  setLoading,
  setCurrentResponse,
  chatHistory,
  setChatHistory,
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
   * 发送单轮对话
   */
  const handleSingleChat = async (values: any) => {
    if (!values.prompt?.trim()) {
      message.error("请输入对话内容");
      return;
    }

    setLoading(true);
    setCurrentResponse("");

    try {
      const sdk = createSDK();
      const response = await sdk.chat.chat(values.prompt, {
        model: values.model || VIVO_MODELS.BLUELM_TB_PRO,
        systemPrompt: values.systemPrompt,
        temperature: values.temperature || 0.9,
        maxTokens: values.maxTokens || 2048,
      });

      setCurrentResponse(response);

      // 添加到历史记录
      const newMessages: ChatMessage[] = [
        { role: "user", content: values.prompt },
        { role: "assistant", content: response },
      ];
      setChatHistory((prev) => [...prev, ...newMessages]);

      message.success("对话成功");
    } catch (error: any) {
      message.error(`对话失败: ${error.message}`);
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 发送多轮对话
   */
  const handleMultiTurnChat = async (values: any) => {
    if (!values.prompt?.trim()) {
      message.error("请输入对话内容");
      return;
    }

    setLoading(true);
    setCurrentResponse("");

    try {
      const sdk = createSDK();
      const newUserMessage: ChatMessage = {
        role: "user",
        content: values.prompt,
      };
      const conversationMessages = [...chatHistory, newUserMessage];

      const response = await sdk.chat.chatWithMessages(conversationMessages, {
        model: values.model || VIVO_MODELS.BLUELM_TB_PRO,
        systemPrompt: values.systemPrompt,
        temperature: values.temperature || 0.9,
        maxTokens: values.maxTokens || 2048,
      });

      setCurrentResponse(response);

      // 更新历史记录
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response,
      };
      setChatHistory([...conversationMessages, assistantMessage]);

      message.success("多轮对话成功");
    } catch (error: any) {
      message.error(`多轮对话失败: ${error.message}`);
      console.error("Multi-turn chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="对话输入" className="h-fit">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSingleChat}
        initialValues={{
          model: VIVO_MODELS.BLUELM_TB_PRO,
          systemPrompt: SYSTEM_PROMPTS.ASSISTANT,
          temperature: 0.9,
          maxTokens: 2048,
        }}
      >
        <Form.Item
          name="prompt"
          label="对话内容"
          rules={[{ required: true, message: "请输入对话内容" }]}
        >
          <TextArea
            rows={4}
            placeholder="请输入您想要对话的内容..."
            className="resize-none"
          />
        </Form.Item>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="model" label="模型选择">
            <Select>
              <Option value={VIVO_MODELS.BLUELM_TB_PRO}>BlueLM-TB-Pro</Option>
            </Select>
          </Form.Item>

          <Form.Item name="systemPrompt" label="系统提示">
            <Select>
              <Option value={SYSTEM_PROMPTS.ASSISTANT}>通用助手</Option>
              <Option value={SYSTEM_PROMPTS.CREATIVE}>创意写作</Option>
              <Option value={SYSTEM_PROMPTS.PROFESSIONAL}>专业回答</Option>
              <Option value={SYSTEM_PROMPTS.FRIENDLY}>友好助手</Option>
            </Select>
          </Form.Item>
        </div>

        {/* 参数面板 */}
        <ChatParameterPanel />

        <div className="flex gap-2">
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SendOutlined />}
            className="flex-1"
          >
            发送单轮对话
          </Button>
          <Button
            type="default"
            onClick={() => form.validateFields().then(handleMultiTurnChat)}
            loading={loading}
            icon={<HistoryOutlined />}
            className="flex-1"
          >
            发送多轮对话
          </Button>
        </div>
      </Form>
    </Card>
  );
};

export default ChatInputForm;
