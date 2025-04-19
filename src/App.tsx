import "mdui/components/navigation-bar.js";
import "mdui/components/navigation-bar-item.js";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import { useEffect, useRef, useState } from "react"; // 引入 useEffect 和 useState
import { Outlet, useLocation, useNavigate } from "react-router";
import HeadsetMicOutlinedIcon from "@mui/icons-material/HeadsetMicOutlined";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import "./App.css";
import "./animate.css";
// 移除 HomePage, ContactPage, ProfilePage 的直接导入，它们通过 Outlet 渲染
// import { HomePage } from "./pages/home";
// import { ContactPage } from "./pages/contact";
// import { ProfilePage } from "./pages/profile";
import useInputStore from "./store/input";
import useAuthStore from "./store/auth"; // 引入 auth store
import { GetUserInfoAPI } from "./api/user"; // 引入 API
import { ContactPage } from "./pages/contact";
import { HomePage } from "./pages/home";
import { ProfilePage } from "./pages/profile";

function App() {
  const location = useLocation();
  const nodeRef = useRef<HTMLDivElement>(null);
  const navigator = useNavigate();
  const { input: isTyping } = useInputStore();
  const { userInfo, setUserInfo } = useAuthStore(); // 获取 store 的状态和 action
  const [loading, setLoading] = useState(!userInfo); // 根据 store 中是否有 userInfo 初始化 loading
  const [error, setError] = useState<string | null>(null);

  // 在 App 组件加载时获取用户信息
  useEffect(() => {
    // 尝试从 localStorage 加载用户信息 (可选，如果希望快速显示旧数据)
    const storedUserInfo = localStorage.getItem('userInfo');
    let initialLoadFromStorage = false;
    if (storedUserInfo && !userInfo) {
      try {
        const parsedInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedInfo);
        setLoading(false); // 如果从 localStorage 加载成功，初始时不显示 loading
        initialLoadFromStorage = true;
      } catch (e) {
        console.error("解析本地用户信息失败:", e);
        localStorage.removeItem('userInfo');
      }
    }

    const fetchUserInfo = async () => {
      // 只有在没有从 localStorage 加载数据时，才在开始 fetch 时设置 loading 为 true
      if (!initialLoadFromStorage) {
        setLoading(true);
      }
      setError(null);
      try {
        const res = await GetUserInfoAPI();
        if (res.status === 0 && res.data) {
          setUserInfo(res.data);
          localStorage.setItem('userInfo', JSON.stringify(res.data));
        } else {
          setError(res.message || "获取用户信息失败");
          if (res.code === 'tokenInvalid' || res.code === 'tokenExpired') {
            localStorage.removeItem('userInfo');
            setUserInfo(null);
            // 可选：如果 token 失效，导航到登录页
            // navigator('/login');
          }
          // 如果 API 调用失败，但之前从 localStorage 加载了数据，保留旧数据
          if (!initialLoadFromStorage && !(res.code === 'tokenInvalid' || res.code === 'tokenExpired')) {
             // 如果不是从 localStorage 加载且非 token 问题，可以选择清除或保留
             // 当前逻辑倾向于保留可能存在的旧数据
          }
        }
      } catch (err: any) {
        console.error("获取用户信息时发生错误:", err);
        setError(err.message || "获取用户信息时发生未知错误");
        // 网络错误等情况，保留可能存在的旧 userInfo
      } finally {
        setLoading(false);
      }
    };

    // 如果 store 中没有用户信息，或者总是希望获取最新信息，则调用 fetch
    // 检查 userInfo 是否存在，避免在已有数据时重复请求
    if (!userInfo) {
       fetchUserInfo();
    } else {
      // 如果 store 中已有数据 (可能来自 localStorage 初始化)，则不需要加载
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 将依赖项数组设置为空，确保只运行一次

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

  // 可选：在这里添加全局加载或错误状态显示
  // if (loading && !userInfo) {
  //   return <div>全局加载中...</div>; // 或者一个全局的骨架屏
  // }
  // if (error && !userInfo) {
  //    return <div>全局错误: {error} <button onClick={() => window.location.reload()}>重试</button></div>;
  // }

  return (
    <main className="app h-100vh">
      {/* ... existing mdui-navigation-bar ... */}
      <mdui-navigation-bar
        style={{
          position: "fixed",
          bottom: "0px", // Base position at the bottom
          width: "100%",
          transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)", // Match InputArea animation
          transform: isTyping ? "translateY(80px)" : "translateY(0)", // Slide down when typing
          opacity: isTyping ? 0 : 1, // Fade out when typing
          willChange: "transform, opacity", // Optimize animation
        }}
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
          <div
            ref={nodeRef}
            className={`${isTyping ? "h-full" : "h-[calc(100%-80px)]"}`}
          >
            {/* Outlet 会渲染当前路由匹配的组件，包括 ProfilePage */}
            <Outlet />
          </div>
        </CSSTransition>
      </SwitchTransition>
    </main>
  );
}

export default App;
