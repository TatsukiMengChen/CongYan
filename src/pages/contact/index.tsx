import { Bubble, BubbleProps } from "@ant-design/x";
import {
  Avatar,
  Button,
  InputBase,
  Menu,
  MenuItem,
  Typography,
} from "@mui/material";
import markdownit from "markdown-it";
import { useRef, useState } from "react";
import useInputStore from "../../store/input";
import useMessageStore from "../../store/message";
import { Message } from "../../types/message";
import styles from "./index.module.scss";
const md = markdownit({ html: true, breaks: true });

const MarkDown: BubbleProps["messageRender"] = (content) => (
  <Typography fontSize={14}>
    <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
  </Typography>
);

const MessageItem = ({
  position,
  msg,
  message,
  md,
  showTime,
  setShowTime,
}: {
  position?: "start" | "end";
  msg?: string;
  message?: Message;
  md?: boolean;
  showTime: string | null;
  setShowTime: (id: string | null) => void;
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const { removeMessage } = useMessageStore();
  const handleLongClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const target = event.currentTarget.querySelector(
      ".ant-bubble-content",
    ) as HTMLDivElement;
    setAnchorEl(target);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleWithdraw = () => {
    if (message) {
      removeMessage(message.id);
    }
    handleClose();
  };

  return (
    <div className="my-2">
      <Bubble
        onClick={() =>
          setShowTime(showTime === message?.id ? null : message?.id || null)
        }
        onContextMenu={handleLongClick} // 添加长按事件
        className={position === "end" ? styles.bubbleEnd : styles.bubbleStart}
        placement={position}
        content={message ? message.content : msg}
        messageRender={md ? MarkDown : undefined}
        shape="corner"
        variant="shadow"
        header={
          showTime === message?.id && message
            ? new Date(message.time).toLocaleTimeString()
            : ""
        }
        avatar={
          position === "start" ? (
            <Avatar
              sx={{ width: "40px", height: "40px" }}
              src="images/doctor-boy.png"
            />
          ) : (
            <Avatar
              sx={{ width: "40px", height: "40px" }}
              src="images/avatar-boy.png"
            />
          )
        }
      />
      <Menu
        id="basic-menu"
        className={styles.menu}
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {message?.from == "user" && (
          <MenuItem onClick={handleWithdraw}>
            <Typography sx={{ fontSize: 14 }}>撤回</Typography>
          </MenuItem>
        )}
        <MenuItem onClick={handleWithdraw}>
          <Typography sx={{ fontSize: 14 }}>删除</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};

const InputArea = () => {
  const [message, setMessage] = useState("");
  const { input: isTyping, setInput: setIsTyping } = useInputStore();
  const { addMessage } = useMessageStore();

  return (
    <div
      className={`fixed ${isTyping ? "bottom-0px" : "bottom-80px"} box-border flex items-start bg-gray-50 p-2 container dark:bg-dark-8`}
      style={{
        transition: "bottom 0.3s ease-in-out",
      }}
    >
      <InputBase
        className="minh-8 !rounded-md !px-2"
        multiline
        fullWidth
        sx={{
          backgroundColor: "rgb(var(--mdui-color-on-secondary))",
        }}
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onFocus={() => {
          setIsTyping(true);
        }}
        onBlur={() => {
          setIsTyping(false);
        }}
      />
      <Button
        className="h-8 !ml-2 !rounded-md"
        sx={{
          fontSize: "14px",
          color: "rgb(var(--mdui-color-primary))",
          backgroundColor: "rgb(var(--mdui-color-secondary-container))",
        }}
        onClick={() => {
          addMessage({
            content: message,
            time: Date.now(),
            from: "user",
            id: Date.now().toString(),
          });
          setMessage("");
          setTimeout(() => {
            addMessage({
              content: "你好，请问有什么可以帮您？",
              time: Date.now(),
              from: "doctor",
              id: Date.now().toString(),
            });
          }, 3000);
        }}
      >
        发送
      </Button>
    </div>
  );
};

export const ContactPage = () => {
  const messageListRef = useRef<HTMLDivElement>(null);
  const { messages } = useMessageStore();
  const [showTime, setShowTime] = useState<string | null>(null);

  return (
    <div className="h-full">
      <div
        className="box-border flex flex-col p-2 container"
        ref={messageListRef}
      >
        <MessageItem
          position="start"
          msg="你好，请问有什么可以帮助您的？"
          showTime={showTime}
          setShowTime={setShowTime}
        />
        {messages.map((msg) => (
          <MessageItem
            position={msg.from === "user" ? "end" : "start"}
            key={msg.id}
            message={msg}
            showTime={showTime}
            setShowTime={setShowTime}
          />
        ))}
      </div>
      <InputArea />
    </div>
  );
};
