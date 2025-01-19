import React from "react";
import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "@unocss/reset/normalize.css";
import App from "./App";
import useAuthStore from "./store/auth";

const rootElement = document.getElementById("root") as HTMLElement;

// 检测是否为移动设备
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  //rootElement.style.paddingTop = "60px";
}

const Root = () => {
  const { checkAuth } = useAuthStore();
  checkAuth(); // 检查 Token 并恢复登录状态

  return <App />;
};

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
