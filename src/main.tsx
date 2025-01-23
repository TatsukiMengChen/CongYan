import ReactDOM from "react-dom/client";
import "virtual:uno.css";
import "@unocss/reset/normalize.css";
import "mdui/mdui.css";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { setColorScheme } from "mdui/functions/setColorScheme.js";
import AppRouter from "./routes";
import { lightBlue } from "@mui/material/colors";
import { pink } from "@mui/material/colors";
import "./index.css";

setColorScheme("#03A9F4");

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
  palette: {
    primary: lightBlue,
    secondary: pink,
  },
});

const rootElement = document.getElementById("root") as HTMLElement;

// 检测是否为移动设备
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

if (isMobile) {
  //rootElement.style.paddingTop = "60px";
}

ReactDOM.createRoot(rootElement).render(
  <ThemeProvider theme={theme}>
    <AppRouter />
  </ThemeProvider>,
);
