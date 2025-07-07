import React, { useState } from "react";
import { Typography } from "antd";
import { type ChatMessage } from "../../../../../api/vivoAigc";
import ChatInputForm from "./ChatInputForm";
import ChatResults from "./ChatResults";

const { Title, Paragraph } = Typography;

const ChatSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Title level={3} className="!mb-2">
          大模型对话
        </Title>
        <Paragraph className="text-gray-600">
          基于 Vivo BlueLM-TB-Pro 大语言模型的智能对话功能
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 输入区域 */}
        <div className="lg:col-span-2">
          <ChatInputForm
            loading={loading}
            setLoading={setLoading}
            setCurrentResponse={setCurrentResponse}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
          />
        </div>

        {/* 结果显示区域 */}
        <div className="lg:col-span-1">
          <ChatResults
            loading={loading}
            currentResponse={currentResponse}
            chatHistory={chatHistory}
            setChatHistory={setChatHistory}
            setCurrentResponse={setCurrentResponse}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatSection;
