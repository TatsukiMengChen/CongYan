import "mdui/components/navigation-bar.js";
import "mdui/components/navigation-bar-item.js";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import "./App.css";
import "./animate.css";

function App() {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);
  const navigator = useNavigate();

  return (
    <main className="app h-100vh">
      <mdui-navigation-bar
      style={{position: "fixed", bottom: 0, width: "100%"}}
        scroll-target=".example-scroll-target"
        value={location.pathname === "/" ? "home" : location.pathname.slice(1)}
      >
        <mdui-navigation-bar-item
          value="contact"
          onClick={() => navigator("/contact", { replace: true })}
        >
          <span slot="icon" className="flex-center">
            <HeadsetMicOutlinedIcon />
          </span>
          咨询
        </mdui-navigation-bar-item>
        <mdui-navigation-bar-item
          icon="commute"
          value="home"
          onClick={() => navigator("/", { replace: true })}
        >
          <span slot="icon" className="flex-center">
            <GraphicEqRoundedIcon />
          </span>
          发音
        </mdui-navigation-bar-item>
        <mdui-navigation-bar-item
          value="profile"
          onClick={() => navigator("/profile", { replace: true })}
        >
          <span slot="icon" className="flex-center">
            <PersonOutlineOutlinedIcon />
          </span>
          我的
        </mdui-navigation-bar-item>
      </mdui-navigation-bar>
      <SwitchTransition>
        <CSSTransition
          key={location.key}
          classNames="fade-app"
          timeout={300}
          nodeRef={nodeRef}
        >
          <div ref={nodeRef}>
            <Outlet />
          </div>
        </CSSTransition>
      </SwitchTransition>
    </main>
  );
}

export default App;