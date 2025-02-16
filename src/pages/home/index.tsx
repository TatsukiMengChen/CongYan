import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Button, Divider } from "@mui/material";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { Card } from "antd";
import { useNavigate } from "react-router";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import styles from "./index.module.scss";
import { ScrollView } from "../../components/ScallView";

const SearchBar = () => {
  return (
    <div className={styles.searchBar}>
      <div className="box-border flex items-center pl-4 container">
        <SearchRoundedIcon />
        <Typography className="ml-8" color="textSecondary">
          搜索
        </Typography>
      </div>
    </div>
  );
};

const SwiperItem = () => {
  return (
    <Skeleton
      animation="wave"
      variant="rectangular"
      width={"100%"}
      height={"100%"}
    />
  );
};

const SwiperArea = () => {
  return (
    <Swiper
      className="rounded-lg !m-4"
      slidesPerView={1}
      loop={true}
      pagination={{
        clickable: true,
      }}
      navigation={true}
      modules={[Pagination]}
    >
      <SwiperSlide style={{ aspectRatio: "16/9" }}>
        <SwiperItem />
      </SwiperSlide>
      <SwiperSlide style={{ aspectRatio: "16/9" }}>
        <SwiperItem />
      </SwiperSlide>
      <SwiperSlide style={{ aspectRatio: "16/9" }}>
        <SwiperItem />
      </SwiperSlide>
    </Swiper>
  );
};

const TextCard = ({ title, type }: { title: string; type: string }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 处理点击事件
    sessionStorage.removeItem("textList");
    navigate(`/train`, { state: { title, type } });
  };

  return (
    <Button
      className={`!mt-2 w-full !px-4 !py-8 ${styles.gradientButton}`}
      onClick={handleClick}
    >
      <div className="w-full flex pl-2">
        <Typography style={{ letterSpacing: "8px" }}>{title}</Typography>
      </div>
    </Button>
  );
};

const PracticeArea = () => {
  return (
    <Card className="mx-4">
      <div className="flex items-center">
        <AutoStoriesOutlinedIcon fontSize="small" />
        <Typography className="pl-2">练习</Typography>
      </div>
      <Divider />
      <TextCard title="散文" type="prose" />
      <TextCard title="古代诗词" type="ancient poetry" />
      <TextCard title="现代诗词" type="modern poetry" />
    </Card>
  );
};

export const HomePage = () => {
  return (
    <div className="h-full flex flex-col">
      <SearchBar />
      <ScrollView className="pb-4">
        <Alert severity="info">公告内容</Alert>
        <SwiperArea />
        <PracticeArea />
      </ScrollView>
    </div>
  );
};
