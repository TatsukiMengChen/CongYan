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
import { HomePage } from "./pages/home/home";
import { ProfilePage } from "./pages/profile/profile";
import useAuthStore from "./store/auth";
import Spin from "antd/es/spin";
import { ContactPage } from "./pages/contact/contact";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
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

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const [direction, setDirection] = useState("forward");
  const nodeRef = useRef(null);

  useEffect(() => {
    if (navigationType === "POP") {
      setDirection("backward");
    } else {
      setDirection("forward");
    }
  }, [location, navigationType]);

  const isAuthRoute = location.pathname.startsWith("/login") || location.pathname.startsWith("/register");

  return isAuthRoute ? (
    <SwitchTransition>
      <CSSTransition
        key={location.key}
        classNames={direction === "forward" ? "fade" : "fade-reverse"}
        timeout={300}
        nodeRef={nodeRef}
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
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </CSSTransition>
    </SwitchTransition>
  ) : (
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
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>
  );
};

const AppRouter = () => (
  <BrowserRouter>
    <AnimatedRoutes />
  </BrowserRouter>
);

export default AppRouter;