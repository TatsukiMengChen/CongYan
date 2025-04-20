import Alert from "@mui/material/Alert";
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'; // 导入图标
import { PullToRefresh } from "antd-mobile"; // 1. 导入 PullToRefresh
import { ScrollView } from "../../components/ScrollView";
import useAuthStore from "../../store/auth"; // 2. 导入 auth store
import useTasksStore from "../../store/tasks"; // 2. 导入 tasks store
import { PracticeArea } from "./components/PracticeArea";
import { ProgressArea } from "./components/ProgressArea"; // 导入 ProgressArea
import { SearchBar } from "./components/SearchBar";
import { SwiperArea } from "./components/SwiperArea";

export const HomePage = () => {
  // 3. 获取 store 中的方法和用户信息
  const { clearTasks, fetchTasks } = useTasksStore();
  const { userInfo } = useAuthStore();

  // 4. 定义刷新处理函数
  const handleRefresh = async () => {
    console.log("下拉刷新触发");
    if (userInfo?.id) {
      // 先清除旧数据和 fetchAttempted 状态
      clearTasks();
      // 然后重新获取任务数据
      await fetchTasks(userInfo.id);
      console.log("任务数据刷新完成");
    } else {
      console.warn("无法刷新任务：用户信息不可用");
      // 如果需要，可以在这里处理未登录或用户信息丢失的情况
      // 例如，可以仅清除任务而不尝试获取
      clearTasks();
    }
  };

  return (
    <div className="h-full flex flex-col">
      <SearchBar />
      {/* 5. 将 PullToRefresh 包裹在 ScrollView 内部，并传入 onRefresh */}
      <ScrollView className="flex-1"> {/* 让 ScrollView 占据剩余空间 */}
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="pb-4 px-4"> {/* 将内边距移到 PullToRefresh 的子元素上 */}
            <Alert
              severity="info"
              variant="outlined"
              icon={<CampaignOutlinedIcon fontSize="inherit" />}
              className="mt-4 !rounded-lg"
            >
              公告内容
            </Alert>
            <SwiperArea className="mt-4" />
            <ProgressArea className="mt-4" />
            <PracticeArea className="mt-4" />
          </div>
        </PullToRefresh>
      </ScrollView>
    </div>
  );
};
