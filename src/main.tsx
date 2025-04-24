import { lightBlue, pink } from "@mui/material/colors";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import "@unocss/reset/normalize.css";
import { ConfigProvider, App, theme } from "antd";
import { setColorScheme } from "mdui/functions/setColorScheme.js";
import "mdui/mdui.css";
import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "./index.scss";
import AppRouter from "./routes";
import { getTheme } from "mdui/functions/getTheme.js";
import DebugOverlay from "./components/DebugOverlay"; // 导入 DebugOverlay

console.log(getTheme());
const { darkAlgorithm, defaultAlgorithm } = theme;

// 设置默认颜色
const primaryColor = "#4FC3F7";
setColorScheme(primaryColor);

const Root = () => {
  const [prefersDarkMode, setPrefersDarkMode] = useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  // Check if User Agent contains "DebugMode"
  const showDebugOverlay = import.meta.env.DEV || navigator.userAgent.includes("DebugMode");


  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersDarkMode(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (prefersDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [prefersDarkMode]);

  const muiTheme = createTheme({
    palette: {
      mode: prefersDarkMode ? "dark" : "light",
      primary: { main: lightBlue[300] },
      secondary: pink,
    },
  });

  const antdTheme = {
    algorithm: prefersDarkMode ? darkAlgorithm : defaultAlgorithm,
    token: {
      colorPrimary: lightBlue[300],
    },
  };

  return (
    <>
      {" "}
      {/* Use Fragment to wrap multiple elements */}
      <ThemeProvider theme={muiTheme}>
        <ConfigProvider theme={antdTheme}>
          <App>
            <AppRouter />
          </App>
        </ConfigProvider>
      </ThemeProvider>
      {/* Render Debug Overlay outside the main app structure but within Root */}
      {/* Conditionally render based on environment or UA */}
      {showDebugOverlay && <DebugOverlay prefersDarkMode={prefersDarkMode} />}
    </>
  );
};

const rootElement = document.getElementById("root") as HTMLElement;

ReactDOM.createRoot(rootElement).render(<Root />);
