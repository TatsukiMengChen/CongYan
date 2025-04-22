import { useNavigate } from "react-router";
import { ScrollView } from "../../components/ScrollView";
import useAuthStore from "../../store/auth";
import { FunctionButtons } from "./components/FunctionButtons";
import { SettingsButtons } from "./components/SettingsButtons";
import { UserInfoCard } from "./components/UserInfoCard";
import { Box, Skeleton } from "@mui/material";
import styles from "./index.module.scss";

const UserInfoSkeleton = () => (
  <Box sx={{ p: 2, my: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
      <Skeleton variant="circular" width={60} height={60} />
      <Box sx={{ ml: 2, width: '60%' }}>
        <Skeleton variant="text" width="80%" height={30} />
        <Skeleton variant="text" width="40%" height={20} />
      </Box>
    </Box>
  </Box>
);

export const ProfilePage = () => {
  const navigator = useNavigate();
  const { userInfo } = useAuthStore();

  const handleNavigateToProfileDetail = () => {
    navigator('/profile/detail');
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollView className="pb-4">
        <Box className={`${styles.bg}`}>
          {userInfo ? (
            <UserInfoCard userInfo={userInfo} onNavigate={handleNavigateToProfileDetail} />
          ) : (
            <UserInfoSkeleton />
          )}
          <FunctionButtons />
        </Box>
        <SettingsButtons />
      </ScrollView>
    </div>
  );
};
