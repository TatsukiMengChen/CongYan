import { Bubble, BubbleProps } from "@ant-design/x";
import { Avatar, Menu, MenuItem, Typography } from "@mui/material";
import markdownit from "markdown-it";
import { useState } from "react";
import useChatStore from "../../../store/chat";
import { Message } from "../../../types/message";
import styles from "./MessageItem.module.scss"; // 假设创建对应的 CSS Module 文件

const md = markdownit({ html: true, breaks: true });

const MarkDown: BubbleProps["messageRender"] = (content) => (
  <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
);

interface MessageItemProps {
  position?: "start" | "end";
  msg?: string; // For initial message
  message?: Message; // For dynamic messages
  md?: boolean;
  showTime: string | null;
  setShowTime: (id: string | null) => void;
  userAvatarSrc?: string;
}

export const MessageItem = ({
  position,
  msg,
  message,
  md,
  showTime,
  setShowTime,
  userAvatarSrc,
}: MessageItemProps) => {
  // 使用 menuPosition 状态存储菜单应该出现的位置
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const { removeMessage } = useChatStore();

  const handleLongClick = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    // 阻止浏览器默认的右键菜单
    event.stopPropagation();
    // 设置菜单位置为鼠标点击位置
    setMenuPosition({
      top: event.clientY,
      left: event.clientX,
    });
  };

  const handleClose = () => {
    setMenuPosition(null);
  };

  const handleWithdraw = () => {
    if (message) {
      removeMessage(message.id);
    }
    handleClose();
  };

  const handleCopy = () => {
    const textToCopy = message?.content || msg || "";
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        // 可选：显示复制成功的提示
        console.log("Text copied to clipboard");
      }).catch(err => {
        console.error("Failed to copy text: ", err);
      });
    }
    handleClose();
  };

  return (
    <div className="my-2">
      <Bubble
        onClick={() =>
          setShowTime(showTime === message?.id ? null : message?.id || null)
        }
        onContextMenu={handleLongClick} // 使用 handleLongClick
        className={`${styles.bubble} ${position === "end" ? styles.bubbleEnd : styles.bubbleStart}`}
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
              src="/images/doctor.png"
            />
          ) : (
            <Avatar
              sx={{ width: "40px", height: "40px" }}
              src={userAvatarSrc || "/images/avatar-boy.png"}
            />
          )
        }
      />
      <Menu
        open={menuPosition !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={menuPosition !== null ? menuPosition : undefined}
        MenuListProps={{
          "aria-labelledby": "message-menu",
          dense: true,
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: '120px',
            borderRadius: '8px',
            mt: 1,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleCopy} sx={{ py: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>复制</Typography>
        </MenuItem>
        {message?.from === "user" && (
          <MenuItem onClick={handleWithdraw} sx={{ py: 1 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 500 }}>撤回</Typography>
          </MenuItem>
        )}
        <MenuItem onClick={handleWithdraw} sx={{ py: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: 'error.main' }}>删除</Typography>
        </MenuItem>
      </Menu>
    </div>
  );
};
