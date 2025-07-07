import React from "react";
import { Button, Card, Spin, Divider, Tag, message } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import { type ChatMessage } from "../../../../../api/vivoAigc";
import ChatMessageItem from "./ChatMessageItem";

interface ChatResultsProps {
  loading: boolean;
  currentResponse: string;
  chatHistory: ChatMessage[];
  setChatHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setCurrentResponse: (response: string) => void;
}

const ChatResults: React.FC<ChatResultsProps> = ({
  loading,
  currentResponse,
  chatHistory,
  setChatHistory,
  setCurrentResponse,
}) => {
  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    setChatHistory([]);
    setCurrentResponse("");
    message.success("历史记录已清空");
  };

  return (
    <Card
      title="对话结果"
      className="h-fit"
      extra={
        <Button
          type="text"
          size="small"
          icon={<ClearOutlined />}
          onClick={clearHistory}
          disabled={chatHistory.length === 0}
        >
          清空历史
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin tip="AI正在思考中..." />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 当前回复 */}
          {currentResponse && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Tag color="blue">AI回复</Tag>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentResponse}
              </div>
            </div>
          )}

          {/* 历史记录 */}
          {chatHistory.length > 0 && (
            <div>
              <Divider orientation="left">对话历史</Divider>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {chatHistory.map((msg, index) => (
                  <ChatMessageItem key={index} message={msg} index={index} />
                ))}
              </div>
            </div>
          )}

          {/* 空状态 */}
          {!loading && !currentResponse && chatHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">💬</div>
              <div>开始您的AI对话之旅</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ChatResults;
