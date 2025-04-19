import { InputArea } from "./components/InputArea"; // 导入 InputArea
import { MessageList } from "./components/MessageList"; // 导入 MessageList

export const ContactPage = () => {
  return (
    <div className="relative h-full flex flex-col">
      {/* 消息列表区域 */}
      <MessageList />
      {/* 输入区域 */}
      <InputArea />
    </div>
  );
};
