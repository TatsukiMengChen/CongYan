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
import { HomePage } from "./pages/home";
import { ContactPage } from "./pages/contact";
import { ProfilePage } from "./pages/profile";

function App() {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);
  const navigator = useNavigate();

  const tabs = [
    {
      name: "contact",
      title: "咨询",
      icon: <HeadsetMicOutlinedIcon />,
      component: <ContactPage />,
    },
    {
      name: "home",
      title: "发音",
      icon: <GraphicEqRoundedIcon />,
      component: <HomePage />,
    },
    {
      name: "profile",
      title: "我的",
      icon: <PersonOutlineOutlinedIcon />,
      component: <ProfilePage />,
    },
  ];

  return (
    <main className="app h-100vh">
      <mdui-navigation-bar
        style={{ position: "fixed", bottom: 0, width: "100%" }}
        scroll-target=".example-scroll-target"
        value={location.pathname === "/" ? "home" : location.pathname.slice(1)}
      >
        {tabs.map((tab) => (
          <mdui-navigation-bar-item
            key={tab.name}
            value={tab.name}
            onClick={() => navigator(`/${tab.name}`, { replace: true })}
          >
            <span slot="icon" className="flex-center">
              {tab.icon}
            </span>
            {tab.title}
          </mdui-navigation-bar-item>
        ))}
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
