import Alert from "@mui/material/Alert";
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'; // 导入图标
import { ScrollView } from "../../components/ScrollView";
import { PracticeArea } from "./components/PracticeArea";
import { ProgressArea } from "./components/ProgressArea"; // 导入 ProgressArea
import { SearchBar } from "./components/SearchBar";
import { SwiperArea } from "./components/SwiperArea";

export const HomePage = () => {
  return (
    <div className="h-full flex flex-col">
      <SearchBar />
      <ScrollView className="pb-4 px-4"> {/* 添加左右内边距 */}
        {/* 更新 Alert 样式 */}
        <Alert
          severity="info"
          variant="outlined" // 使用 outlined 样式
          icon={<CampaignOutlinedIcon fontSize="inherit" />} // 添加图标
          className="mt-4 !rounded-lg" // 添加圆角
        >
          公告内容
        </Alert>
        <SwiperArea className="mt-4" />
        <ProgressArea className="mt-4" /> {/* 添加训练进度组件 */}
        <PracticeArea className="mt-4" />
      </ScrollView>
    </div>
  );
};
