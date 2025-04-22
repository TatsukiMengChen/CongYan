import { useEffect, useRef, useState } from "react";
import useAuthStore from "../../../store/auth";
import useChatStore from "../../../store/chat";
import { getAvatarSrc } from "../../../utils/avatar";
import { MessageItem } from "./MessageItem"; // 导入 MessageItem

export const MessageList = () => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const { messages } = useChatStore();
  const [showTime, setShowTime] = useState<string | null>(null);
  const { userInfo } = useAuthStore();

  const userAvatarSrc = getAvatarSrc(userInfo);

  // Scroll to bottom effect
  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className="flex-grow box-border flex flex-col overflow-y-auto p-2 container"
      ref={messageListRef}
    >
      {/* Initial message */}
      <MessageItem
        position="start"
        msg="你好，请问有什么可以帮助您的？"
        showTime={showTime}
        setShowTime={setShowTime}
      />
      {/* Dynamic message list */}
      {messages.map((msg) => (
        <MessageItem
          position={msg.from === "user" ? "end" : "start"}
          key={msg.id}
          message={msg}
          md={msg.from === 'doctor'}
          showTime={showTime}
          setShowTime={setShowTime}
          userAvatarSrc={userAvatarSrc}
        />
      ))}
    </div>
  );
};
