import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Typography from "@mui/material/Typography";
import styles from "./SearchBar.module.scss";

// 添加 className prop
export const SearchBar = ({ className }: { className?: string }) => {
  return (
    // 应用传入的 className
    <div className={`${styles.searchBar} ${className || ''}`}>
      <div className="box-border flex items-center pl-4 container">
        <SearchRoundedIcon />
        <Typography className="ml-8" color="textSecondary">
          搜索
        </Typography>
      </div>
    </div>
  );
};
