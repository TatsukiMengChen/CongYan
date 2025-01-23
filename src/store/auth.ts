import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  user: { username: string; role: string } | null;
  token: string | null;
  tokenExpiry: number | null;
  login: (username: string, token: string, role: string, expiry: number) => void;
  logout: () => void;
  checkAuth: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  token: null,
  tokenExpiry: null,
  login: (username, token, role, expiry) => {
    localStorage.setItem("token", token);
    localStorage.setItem("tokenExpiry", expiry.toString());
    set({ isAuthenticated: true, user: { username, role }, token, tokenExpiry: expiry });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    set({ isAuthenticated: false, user: null, token: null, tokenExpiry: null });
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    if (token && tokenExpiry) {
      console.log("Token is valid");
      set({ isAuthenticated: true });
    } else {
      set({ isAuthenticated: false, user: null, token: null, tokenExpiry: null });
    }
  },
}));

export default useAuthStore;
