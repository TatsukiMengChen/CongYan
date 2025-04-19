import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { GetUserInfoAPI } from "../../api/user";
import { ScrollView } from "../../components/ScrollView";
import useAuthStore from "../../store/auth";
import { FunctionButtons } from "./components/FunctionButtons";
import { SettingsButtons } from "./components/SettingsButtons";
import { UserInfoCard } from "./components/UserInfoCard";
import { Box, Skeleton } from "@mui/material"; // 引入 Box 和 Skeleton
import styles from "./index.module.scss"; // 引入样式

// 骨架屏组件
const ProfileSkeleton = () => (
  <div className="h-full flex flex-col">
    <ScrollView className="pb-4">
      <Box className={`${styles.bg}`}>
        {/* UserInfoCard Skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 2, pt: 4, mb: 2 }}>
          <Skeleton variant="circular" width={60} height={60} sx={{ mr: 2 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={24} />
            <Skeleton variant="text" width="60%" height={18} />
          </Box>
          <Skeleton variant="rectangular" width={20} height={20} />
        </Box>
        {/* FunctionButtons Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-around', p: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 1 }}/>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 1 }}/>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 1 }}/>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Skeleton variant="rectangular" width={40} height={40} sx={{ mb: 1 }}/>
            <Skeleton variant="text" width={40} height={16} />
          </Box>
        </Box>
      </Box>
      {/* SettingsButtons Skeleton */}
      <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 0.5 }}/>
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 0.5 }}/>
        <Skeleton variant="rectangular" width="100%" height={50} />
      </Box>
       <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 2 }}>
        <Skeleton variant="rectangular" width="100%" height={50} sx={{ mb: 0.5 }}/>
        <Skeleton variant="rectangular" width="100%" height={50} />
      </Box>
    </ScrollView>
  </div>
);


export const ProfilePage = () => {
  const navigator = useNavigate();
  const { userInfo, setUserInfo } = useAuthStore();
  // 初始时 loading 为 true，除非从 localStorage 加载了数据
  const [loading, setLoading] = useState(!useAuthStore.getState().userInfo);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 尝试从 localStorage 加载用户信息
    const storedUserInfo = localStorage.getItem('userInfo');
    let initialLoadFromStorage = false; // 标记是否从 localStorage 成功加载
    if (storedUserInfo && !userInfo) { // 仅当 store 中没有时才从 localStorage 初始化
      try {
        const parsedInfo = JSON.parse(storedUserInfo);
        setUserInfo(parsedInfo);
        setLoading(false); // 如果从 localStorage 加载成功，初始时不显示 loading
        initialLoadFromStorage = true;
      } catch (e) {
        console.error("解析本地用户信息失败:", e);
        localStorage.removeItem('userInfo'); // 清除无效数据
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
          localStorage.setItem('userInfo', JSON.stringify(res.data)); // 存储到 localStorage
        } else {
          setError(res.message || "获取用户信息失败");
          if (res.code === 'tokenInvalid' || res.code === 'tokenExpired') {
            // Token 失效，清除本地存储和状态
            localStorage.removeItem('userInfo');
            setUserInfo(null); // 清空 store 中的用户信息
            // 可选：导航到登录页
            // navigator('/login');
          }
          // 如果 API 调用失败，但之前从 localStorage 加载了数据，保留旧数据，不设置 userInfo 为 null
          if (!initialLoadFromStorage) {
             // 如果不是从 localStorage 加载的，并且 API 失败（非 token 问题），也可能需要清空
             // 但当前逻辑倾向于保留可能存在的旧数据，除非 token 失效
          }
        }
      } catch (err: any) {
        console.error("获取用户信息时发生错误:", err);
        setError(err.message || "获取用户信息时发生未知错误");
        // 如果是网络错误等，不清空可能存在的旧 userInfo
      } finally {
        setLoading(false); // 无论成功或失败，结束 loading 状态
      }
    };

    fetchUserInfo(); // 总是获取最新信息
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setUserInfo]); // 移除 userInfo 依赖

  const handleNavigateToProfileDetail = () => {
    navigator('/profile/detail');
  }

  // 显示骨架屏条件：正在加载中 且 当前没有用户信息（无论是来自 state 还是初始 localStorage）
  if (loading && !userInfo) {
    return <ProfileSkeleton />;
  }

  // 显示错误信息条件：加载完成 且 没有用户信息 且 存在错误
  if (!loading && !userInfo && error) {
    return <div>错误: {error} <button onClick={() => window.location.reload()}>重试</button></div>;
  }

  // 如果有用户信息（无论是旧的还是新的），则渲染页面
  // 如果后台更新失败但本地有旧数据，会显示旧数据
  if (userInfo) {
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
  }

  // 处理其他未预料到的情况，例如加载完成但无用户数据也无错误
  // （理论上在 token 失效时会进入这个逻辑，但上面已经处理了 userInfo 为 null 的情况）
  // 可以选择显示一个空状态或再次尝试加载
  return <div>无法加载用户信息。 <button onClick={() => window.location.reload()}>重试</button></div>; // 或者返回 null/空片段
};
