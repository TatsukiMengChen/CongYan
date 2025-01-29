import { useEffect, useState, useRef } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import "./animate.css"; // 引入动画样式
import App from "./App";
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { HomePage } from "./pages/home";
import { ProfilePage } from "./pages/profile";
import { SettingsPage } from "./pages/settings"; // 引入SettingsPage
import useAuthStore from "./store/auth";
import Spin from "antd/es/spin";
import { ContactPage } from "./pages/contact";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState("forward");

  useEffect(() => {
    if (navigationType === "POP") {
      setDirection("backward");
    } else {
      setDirection("forward");
    }
  }, [location, navigationType]);

  const isAppRoute =
    location.pathname === "/" ||
    location.pathname === "/home" ||
    location.pathname === "/profile" ||
    location.pathname === "/contact";

  const noAnimation =
    navigationType === "REPLACE";
  const appRouteAnimation = isAppRoute
    ? "fade-app"
    : direction === "forward"
    ? "fade"
    : "fade-reverse";

  const handleExited = () => {
    if (isAppRoute) {
      if (nodeRef.current) {
        nodeRef.current.classList.remove("fade-exit-active");
        nodeRef.current.classList.remove("fade-app-exit-active");
      }
    }
  };

  return (
    <SwitchTransition>
      <CSSTransition
        key={location.key}
        classNames={noAnimation ? "" : appRouteAnimation}
        timeout={noAnimation ? 0 : 300}
        nodeRef={nodeRef}
        onExited={handleExited}
      >
        <div className="fade-wrapper" ref={nodeRef}>
          <Routes location={location}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <App />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </CSSTransition>
    </SwitchTransition>
  );
};

const AppRouter = () => {
  const { checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authenticate = async () => {
      await checkAuth();
      setLoading(false);
    };
    authenticate();
  }, []);

  if (loading) {
    return (
      <div className="h-100vh flex-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default AppRouter;
