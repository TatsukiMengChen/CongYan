import { create } from "zustand";
import { Message } from "../types/message";

interface MessageState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  removeMessage: (id: string) => void;
}

const useMessageStore = create<MessageState>((set) => ({
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
}));

export default useMessageStore;