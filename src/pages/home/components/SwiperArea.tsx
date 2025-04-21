import Skeleton from "@mui/material/Skeleton";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface SwiperItemData {
  imageUrl: string;
  linkUrl: string;
  title: string;
}

const SwiperItem = ({ item }: { item: SwiperItemData }) => {
  return (
    <a href={item.linkUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
      <img
        src={item.imageUrl}
        alt={item.title}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Optionally display the title */}
      {/* <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: 'white', padding: '8px' }}>{item.title}</div> */}
    </a>
  );
};

const LoadingSwiperItem = () => {
  return (
    <Skeleton
      animation="wave"
      variant="rectangular"
      width={"100%"}
      height={"100%"}
    />
  );
}

interface SwiperAreaProps {
  className?: string;
  items?: SwiperItemData[];
  loading?: boolean;
}

export const SwiperArea = ({ className, items, loading = false }: SwiperAreaProps) => {
  const slides = loading || !items || items.length === 0
    ? Array.from({ length: 3 }).map((_, index) => (
      <SwiperSlide key={`loading-${index}`} style={{ aspectRatio: "16/9" }}>
        <LoadingSwiperItem />
      </SwiperSlide>
    ))
    : items.map((item, index) => (
      <SwiperSlide key={index} style={{ aspectRatio: "16/9" }}>
        <SwiperItem item={item} />
      </SwiperSlide>
    ));

  return (
    <Swiper
      className={`rounded-lg ${className || ''}`}
      slidesPerView={1}
      loop={!loading && items && items.length > 1} // Only loop if not loading and more than one item
      pagination={{
        clickable: true,
      }}
      // navigation={true}
      modules={[Pagination, Navigation]} // Add Navigation module
    >
      {slides}
    </Swiper>
  );
};
