import { Button, CircularProgress, InputBase } from "@mui/material";
import OpenAI from 'openai';
import { Stream } from 'openai/streaming';
import { useRef, useState } from "react";
import { SendChatMessageAPI } from "../../../api/chat";
import useAuthStore from "../../../store/auth";
import useChatStore from "../../../store/chat";
import useInputStore from "../../../store/input";
import { Message } from "../../../types/message";

export const InputArea = () => {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { input: isTyping, setInput: setIsTyping } = useInputStore();
  const { messages, addMessage, appendContentToMessage, markMessageAsStopped } = useChatStore();
  const { userInfo } = useAuthStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Stop request sent.");
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      content: message,
      time: Date.now(),
      from: "user",
      id: Date.now().toString(),
    };

    addMessage(userMessage);
    const currentMessage = message;
    setMessage("");
    setIsLoading(true);

    const history = messages.map((msg) => ({
      role: msg.from === "user" ? ("user" as const) : ("assistant" as const),
      content: msg.content,
    }));
    history.push({ role: "user", content: currentMessage });

    let assistantMessageId = "";
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const streamOrError = await SendChatMessageAPI(history, userInfo, controller.signal);

      if (streamOrError instanceof Stream) {
        const stream = streamOrError;
        const assistantMessagePlaceholder: Message = {
          content: "",
          time: Date.now(),
          from: "doctor",
          id: Date.now().toString() + "_ai_stream",
        };
        addMessage(assistantMessagePlaceholder);
        assistantMessageId = assistantMessagePlaceholder.id;

        try {
          for await (const chunk of stream) {
            const contentDelta = chunk.choices[0]?.delta?.content || "";
            if (contentDelta) {
              appendContentToMessage(assistantMessageId, contentDelta);
            }
          }
        } catch (streamError: any) {
          if (streamError instanceof OpenAI.APIUserAbortError || streamError.name === 'AbortError') {
            console.log("Stream aborted by user.");
            markMessageAsStopped(assistantMessageId);
          } else {
            console.error("Error processing stream:", streamError);
            addMessage({
              content: "抱歉，处理回复时发生错误。",
              time: Date.now(),
              from: "doctor",
              id: Date.now().toString() + "_streamerr",
            });
          }
        }
      } else if (streamOrError && 'message' in streamOrError && 'code' in streamOrError) {
        const errorRes = streamOrError;
        console.error("API/SDK Error:", errorRes.message);
        addMessage({
          content: `抱歉，发生错误：${errorRes.message}`,
          time: Date.now(),
          from: "doctor",
          id: Date.now().toString() + "_err",
        });
      } else {
        console.error("Unknown API response format:", streamOrError);
        addMessage({
          content: "抱歉，收到了无法处理的响应。",
          time: Date.now(),
          from: "doctor",
          id: Date.now().toString() + "_unk",
        });
      }
    } catch (error: any) {
      if (error instanceof OpenAI.APIUserAbortError || error.name === 'AbortError') {
        console.log("API call aborted before or during setup.");
        if (assistantMessageId) {
          markMessageAsStopped(assistantMessageId);
        }
      } else {
        console.error("Failed to process message stream (unexpected):", error);
        addMessage({
          content: "抱歉，处理消息时遇到意外问题。",
          time: Date.now(),
          from: "doctor",
          id: Date.now().toString() + "_fatalerr",
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isLoading) {
        handleSend();
      }
    }
  };

  return (
    <div>
      {/* Placeholder for spacing */}
      <div style={{ height: "64px" }}></div>
      {/* Input area container */}
      <div
        className={`fixed ${isTyping ? "bottom-0" : "bottom-86px"} box-border flex items-start p-3 container backdrop-blur-sm`}
        style={{
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          transform: isTyping ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
          opacity: isTyping ? 1 : 0.95,
          background: "linear-gradient(to bottom, rgba(255, 245, 255, 0.9), rgba(245, 250, 255, 0.98))",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          boxShadow: "0 -4px 20px rgba(111, 66, 193, 0.1)",
          willChange: "transform, opacity",
        }}
      >
        <InputBase
          className="minh-10 !rounded-full !px-4 !py-2"
          multiline
          fullWidth
          sx={{
            background: "linear-gradient(135deg, #f0f5ff, #f5f0ff)",
            border: "1px solid #c0d0ff", // Changed from #d8daff to a more bluish color
            borderRadius: "24px",
            transition: "all 0.2s ease-in-out",
            "&:hover, &:focus-within": {
              border: "1px solid #7aa0ff", // Changed from #7c4dff to a more bluish color
              boxShadow: "0 0 0 2px rgba(77, 124, 255, 0.2)", // Adjusted the shadow color to match
              background: "linear-gradient(135deg, #ffffff, #f3f6ff)", // Slightly adjusted gradient
            },
          }}
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onFocus={() => setIsTyping(true)}
          onBlur={() => setTimeout(() => setIsTyping(false), 100)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={isLoading}
        />
        <Button
          className="h-10 !ml-2 !rounded-full"
          sx={{
            fontSize: "14px",
            fontWeight: "medium",
            color: "#ffffff",
            background: "linear-gradient(135deg, #7eb6ff, #58a8ff)",
            minWidth: '64px',
            boxShadow: "0 2px 6px rgba(94, 164, 255, 0.3)",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              background: "linear-gradient(135deg, #8ec0ff, #69b5ff)",
              transform: "translateY(-1px)",
              boxShadow: "0 4px 10px rgba(94, 164, 255, 0.4)",
            },
            "&:disabled": {
              background: "linear-gradient(135deg, rgba(126, 182, 255, 0.6), rgba(88, 168, 255, 0.6))",
            }
          }}
          onClick={isLoading ? handleStop : handleSend}
          disabled={!isLoading && !message.trim()}
        >
          {isLoading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            "发送"
          )}
        </Button>
      </div>
    </div>
  );
};
