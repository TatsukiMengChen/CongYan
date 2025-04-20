import Skeleton from "@mui/material/Skeleton";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

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

export const SwiperArea = ({ className }: { className?: string }) => {
  return (
    <Swiper
      className={`rounded-lg ${className || ''}`}
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
