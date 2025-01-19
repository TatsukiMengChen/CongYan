import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (email: string, token: string) => void;
  logout: () => void;
  checkAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: (email, token) => {
    localStorage.setItem("token", token);
    set({ isAuthenticated: true, user: { email } });
  },
  logout: () => {
    localStorage.removeItem("token");
    set({ isAuthenticated: false, user: null });
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    if (token) {
      // 这里可以添加一个 API 请求来验证 Token 是否有效
      set({ isAuthenticated: true, user: { email: "user@example.com" } });
    }
  },
}));

export default useAuthStore;
