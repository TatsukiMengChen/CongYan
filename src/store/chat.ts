import { create } from "zustand";
import { Message } from "../types/message";

interface ChatState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
  appendContentToMessage: (id: string, contentDelta: string) => void; // 新增方法
  markMessageAsStopped: (id: string, stopText?: string) => void; // 新增 action
}

const useChatStore = create<ChatState>((set) => ({
  messages: [],
  setMessages: (messages) => {
    set({ messages });
  },
  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },
  removeMessage: (id: string) => {
    set((state) => ({
      messages: state.messages.filter((msg) => msg.id !== id),
    }));
  },
  // 实现追加内容的方法
  appendContentToMessage: (id, contentDelta) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + contentDelta } : msg
      ),
    })),
  // 实现标记停止的方法
  markMessageAsStopped: (id, stopText = " (已停止)") =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + stopText } : msg
      ),
    })),
}));

export default useChatStore;