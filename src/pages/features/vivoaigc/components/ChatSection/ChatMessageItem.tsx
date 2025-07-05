import React from "react";
import { Tag, Button, message as messageApi } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import { type ChatMessage } from "../../../../../api/vivoAigc";

interface ChatMessageItemProps {
  message: ChatMessage;
  index: number;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  index,
}) => {
  const isUser = message.role === "user";

  /**
   * 复制消息内容
   */
  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      messageApi.success("内容已复制到剪贴板");
    } catch (error) {
      console.error("复制失败:", error);
      messageApi.error("复制失败");
    }
  };

  return (
    <div
      className={`p-3 rounded-lg group transition-all duration-200 hover:shadow-sm ${
        isUser ? "bg-gray-100 ml-4" : "bg-green-50 mr-4"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag color={isUser ? "default" : "green"}>
            {isUser ? "用户" : "AI"}
          </Tag>
          <span className="text-xs text-gray-400">#{index + 1}</span>
        </div>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={copyContent}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          title="复制内容"
        />
      </div>
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
        {message.content}
      </div>
    </div>
  );
};

export default ChatMessageItem;
