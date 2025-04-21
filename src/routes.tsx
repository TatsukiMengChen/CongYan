import Spin from "antd/es/spin";
import { useEffect, useRef, useState } from "react";
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
import { ContactPage } from "./pages/contact";
import TrainTextListPage from "./pages/features/train/trainTextList";
import { HomePage } from "./pages/home";
import { ProfilePage } from "./pages/profile";
import ProfileDetailPage from "./pages/profile/detail"; // 引入 ProfileDetailPage
import { SettingsPage } from "./pages/settings"; // 引入SettingsPage
import { AboutSettingsPage } from "./pages/settings/about";
import { AccountSettingsPage } from "./pages/settings/account";
import { ChangePasswordPage } from "./pages/settings/changePassword"; // 导入修改密码页面
import VoiceSettingsPage from "./pages/settings/voice"; // 导入语音设置页面
import useAuthStore from "./store/auth";
import TrainDetailPage from "./pages/features/train/detail";
import AnalysisPage from "./pages/features/analysis";
import PatientsPage from "./pages/features/patients"; // 导入 PatientPage
import PatientDetailPage from "./pages/features/patients/detail"; // 导入 PatientDetailPage
import CorpusPage from "./pages/features/corpus"; // 导入 CorpusPage
import TasksPage from "./pages/features/tasks"; // 导入 TasksPage
import FavoritePage from "./pages/features/favorite"; // 导入 FavoritePage

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
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

  const noAnimation = navigationType === "REPLACE" || isAppRoute;
  const appRouteAnimation = direction === "forward" ? "fade" : "fade-reverse";

  const handleExited = () => {
    if (nodeRef.current) {
      nodeRef.current.classList.remove("fade-exit-active");
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
        <div className="fade-wrapper h-100vh" ref={nodeRef}>
          <Routes location={location}>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <App key={location.pathname} />
                </ProtectedRoute>
              }
            >
              <Route index element={<HomePage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="home" element={<HomePage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
            <Route
              path="/train"
              element={
                <ProtectedRoute>
                  <TrainTextListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/train/detail"
              element={
                <ProtectedRoute>
                  <TrainDetailPage />
                </ProtectedRoute>
              }
            />
            {/* 添加任务列表路由 */}
            <Route
              path="/tasks"
              element={
                <ProtectedRoute>
                  <TasksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analysis"
              element={
                <ProtectedRoute>
                  <AnalysisPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/about"
              element={
                <ProtectedRoute>
                  <AboutSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/account"
              element={
                <ProtectedRoute>
                  <AccountSettingsPage />
                </ProtectedRoute>
              }
            />
            {/* 添加修改密码路由 */}
            <Route
              path="/settings/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
             {/* 添加语音设置路由 */}
            <Route
              path="/settings/voice"
              element={
                <ProtectedRoute>
                  <VoiceSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/detail" // 添加 profile detail 路由
              element={
                <ProtectedRoute>
                  <ProfileDetailPage />
                </ProtectedRoute>
              }
            />
            {/* 添加我的病人路由 */}
            <Route
              path="/patients"
              element={
                <ProtectedRoute>
                  <PatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patients/detail" // 新增：病人详情页
              element={
                <ProtectedRoute>
                  <PatientDetailPage />
                </ProtectedRoute>
              }
            />
            {/* 添加我的语料路由 */}
            <Route
              path="/corpus"
              element={
                <ProtectedRoute>
                  <CorpusPage />
                </ProtectedRoute>
              }
            />
            {/* 添加收藏夹路由 */}
            <Route
              path="/favorite"
              element={
                <ProtectedRoute>
                  <FavoritePage />
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
      <div
        className="h-100vh flex-center"
        style={{
          transition: "height 0.3s ease-in-out",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      {/* <AliveScope> */}
      <AnimatedRoutes />
      {/* </AliveScope> */}
    </BrowserRouter>
  );
};

export default AppRouter;
