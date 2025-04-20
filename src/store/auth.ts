import { create } from "zustand";
import { UserInfo, GetUserInfoAPI } from "../api/user"; // 导入 GetUserInfoAPI

interface AuthState {
  isAuthenticated: boolean;
  userInfo: UserInfo | null; // 添加 userInfo 状态
  token: string | null;
  tokenExpiry: number | null;
  login: (username: string, token: string, role: string, expiry: number) => void; // login 可能需要调整或保持不变，取决于登录时是否获取完整用户信息
  logout: () => void;
  checkAuth: () => void;
  setUserInfo: (userInfo: UserInfo | null) => void; // 添加 setUserInfo action
  fetchUserInfo: () => Promise<void>; // 添加 fetchUserInfo action
}

const useAuthStore = create<AuthState>((set, get) => ({ // 添加 get
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
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userInfo"); // 确保清除本地存储的用户信息（如果之前有存的话）
    set({ isAuthenticated: false, userInfo: null, token: null, tokenExpiry: null }); // 清空 userInfo
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    let storedUserInfo: UserInfo | null = null;

    // 尝试从 localStorage 加载 userInfo
    const userInfoString = localStorage.getItem("userInfo");
    if (userInfoString) {
      try {
        storedUserInfo = JSON.parse(userInfoString);
      } catch (error) {
        console.error("Failed to parse userInfo from localStorage:", error);
        localStorage.removeItem("userInfo"); // 解析失败则移除错误数据
      }
    }

    if (token && tokenExpiry) {
      const expiry = Number(tokenExpiry);
      if (expiry > Date.now()) { // 检查 token 是否过期
        console.log("Token is valid. Restoring auth state.");
        set({
          isAuthenticated: true,
          userInfo: storedUserInfo, // 使用从 localStorage 加载的用户信息
          token,
          tokenExpiry: expiry
        });
        // 如果 localStorage 中没有用户信息，或者需要强制刷新，可以考虑在这里调用 fetchUserInfo
        // if (!storedUserInfo) {
        //   get().fetchUserInfo();
        // }
      } else {
        // Token 过期，执行登出逻辑
        console.log("Token expired. Logging out.");
        get().logout(); // 调用 logout 清理状态和 localStorage
      }
    } else {
      // 没有 token 或 expiry，确保是登出状态
      set({ isAuthenticated: false, userInfo: null, token: null, tokenExpiry: null });
    }
  },
  // 添加 setUserInfo action 实现
  setUserInfo: (userInfo) => {
    set({ userInfo });
    // 同时更新 localStorage
    if (userInfo) {
      localStorage.setItem("userInfo", JSON.stringify(userInfo));
    } else {
      localStorage.removeItem("userInfo");
    }
  },
  // 实现 fetchUserInfo action
  fetchUserInfo: async () => {
    // 确保在调用前是已认证状态且 token 未过期
    if (!get().isAuthenticated || (get().tokenExpiry && get().tokenExpiry! <= Date.now())) {
      console.log("Not authenticated or token expired, cannot fetch user info.");
      // 如果 token 过期但 isAuthenticated 仍为 true，需要登出
      if (get().isAuthenticated) {
        get().logout();
      }
      return;
    }
    try {
      console.log("Fetching user info...");
      const res = await GetUserInfoAPI();
      if (res.status === 0 && res.data) {
        console.log("User info fetched successfully:", res.data);
        set({ userInfo: res.data });
        // 将获取到的用户信息存入 localStorage
        localStorage.setItem("userInfo", JSON.stringify(res.data));
      } else {
        console.error("Failed to fetch user info:", res.message || `Status: ${res.status}`);
        // 获取用户信息失败可能意味着 token 失效或其他问题，可以考虑登出
        // get().logout();
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
      // 网络错误等也可能需要登出
      // get().logout();
    }
  },
}));

export default useAuthStore;
