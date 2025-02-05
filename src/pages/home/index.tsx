import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import styles from "./index.module.scss";
import { useState } from "react";

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

export const HomePage = () => {
  const [showNotice, setShowNotice] = useState(true);
  return (
    <div className="h-full">
      <SearchBar />
      {showNotice && (
        <Alert severity="info" onClose={() => setShowNotice(false)}>
          公告内容
        </Alert>
      )}
    </div>
  );
};
