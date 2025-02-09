import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import styles from "./index.module.scss";
import Skeleton from "@mui/material/Skeleton";

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

export const HomePage = () => {
  return (
    <div className="h-full">
      <SearchBar />
      <Alert severity="info">公告内容</Alert>
      <SwiperArea />
    </div>
  );
};
