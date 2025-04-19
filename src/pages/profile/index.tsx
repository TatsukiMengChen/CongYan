import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GetUserInfoAPI } from "../../api/user";
import { ScrollView } from "../../components/ScrollView";
import useAuthStore from "../../store/auth";
import { FunctionButtons } from "./components/FunctionButtons";
import { SettingsButtons } from "./components/SettingsButtons";
import { UserInfoCard } from "./components/UserInfoCard";
import { Box } from "@mui/material"; // 引入 Box
import styles from "./index.module.scss"; // 引入样式

export const ProfilePage = () => {
  const navigator = useNavigate();
  const { userInfo, setUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await GetUserInfoAPI();
        if (res.status === 0 && res.data) {
          setUserInfo(res.data);
        } else {
          setError(res.message || "获取用户信息失败");
          if (res.code === 'tokenInvalid' || res.code === 'tokenExpired') {
          }
        }
      } catch (err: any) {
        console.error("获取用户信息时发生错误:", err);
        setError(err.message || "获取用户信息时发生未知错误");
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [setUserInfo]);

  const handleNavigateToProfileDetail = () => {
    navigator('/profile-detail');
  }

  if (loading && !userInfo) {
    return <div>加载中...</div>;
  }

  if (error) {
    return <div>错误: {error} <button onClick={() => window.location.reload()}>重试</button></div>;
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollView className="pb-4">
        <Box className={`${styles.bg}`}>
          <UserInfoCard userInfo={userInfo} onNavigate={handleNavigateToProfileDetail} />
          <FunctionButtons />
        </Box>
        <SettingsButtons />
      </ScrollView>
    </div>
  );
};
