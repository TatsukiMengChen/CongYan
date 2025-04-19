import { create } from "zustand";
import { UserInfo } from "../api/user"; // 导入 UserInfo 类型

interface AuthState {
  isAuthenticated: boolean;
  userInfo: UserInfo | null; // 添加 userInfo 状态
  token: string | null;
  tokenExpiry: number | null;
  login: (username: string, token: string, role: string, expiry: number) => void; // login 可能需要调整或保持不变，取决于登录时是否获取完整用户信息
  logout: () => void;
  checkAuth: () => void;
  setUserInfo: (userInfo: UserInfo | null) => void; // 添加 setUserInfo action
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userInfo: null, // 初始化 userInfo
  token: null,
  tokenExpiry: null,
  login: (username, token, role, expiry) => {
    localStorage.setItem("token", token);
    localStorage.setItem("tokenExpiry", expiry.toString());
    set({
      isAuthenticated: true,
      userInfo: null, // 登录后先设为 null，等待后续获取
      token,
      tokenExpiry: expiry
    });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    set({ isAuthenticated: false, userInfo: null, token: null, tokenExpiry: null }); // 清空 userInfo
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (token && tokenExpiry) {
      const expiry = Number(tokenExpiry);
      if (expiry > Date.now()) { // 检查 token 是否过期
        console.log("Token is valid");
        set({
          isAuthenticated: true,
          userInfo: null, // 初始化为 null，让需要的页面去获取
          token,
          tokenExpiry: expiry
        });
      } else {
        // Token 过期，执行登出逻辑
        localStorage.removeItem("token");
        localStorage.removeItem("tokenExpiry");
        set({ isAuthenticated: false, userInfo: null, token: null, tokenExpiry: null });
      }
    } else {
      set({ isAuthenticated: false, userInfo: null, token: null, tokenExpiry: null }); // 清空 userInfo
    }
  },
  // 添加 setUserInfo action 实现
  setUserInfo: (userInfo) => set({ userInfo }),
}));

export default useAuthStore;
