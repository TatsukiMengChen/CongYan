import { create } from "zustand";

interface InputState {
  input: boolean;
  setInput: (input: boolean) => void;
}

const useInputStore = create<InputState>((set) => ({
  input: false,
  setInput: (input: boolean) => {
    set({ input });
  },
}));

export default useInputStore;