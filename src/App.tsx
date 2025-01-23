import "mdui/components/navigation-bar.js";
import "mdui/components/navigation-bar-item.js";
import { Outlet, useNavigate } from "react-router";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import "./App.css";

function App() {
  const navigator = useNavigate();
  return (
    <main className="app">
      <mdui-navigation-bar scroll-target=".example-scroll-target" value="home">
        <mdui-navigation-bar-item
          value="contact"
          onClick={() => navigator("/contact")}
        >
          <span slot="icon" className="flex-center">
            <HeadsetMicOutlinedIcon />
          </span>
          咨询
        </mdui-navigation-bar-item>
        <mdui-navigation-bar-item
          icon="commute"
          value="home"
          onClick={() => navigator("/")}
        >
          <span slot="icon" className="flex-center">
            <GraphicEqRoundedIcon />
          </span>
          发音
        </mdui-navigation-bar-item>
        <mdui-navigation-bar-item
          value="profile"
          onClick={() => navigator("/profile")}
        >
          <span slot="icon" className="flex-center">
            <PersonOutlineOutlinedIcon />
          </span>
          我的
        </mdui-navigation-bar-item>
      </mdui-navigation-bar>
      <Outlet />
    </main>
  );
}

export default App;
