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
    localStorage.setItem("user", JSON.stringify({ username, role }));
    set({ isAuthenticated: true, user: { username, role }, token, tokenExpiry: expiry });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("user");
    set({ isAuthenticated: false, user: null, token: null, tokenExpiry: null });
  },
  checkAuth: () => {
    const token = localStorage.getItem("token");
    const tokenExpiry = localStorage.getItem("tokenExpiry");
    const user = localStorage.getItem("user");
    if (token && tokenExpiry && user) {
      console.log("Token is valid");
      set({ isAuthenticated: true, user: JSON.parse(user), token, tokenExpiry: Number(tokenExpiry) });
    } else {
      set({ isAuthenticated: false, user: null, token: null, tokenExpiry: null });
    }
  },
}));

export default useAuthStore;
