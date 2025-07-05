import React from "react";
import { Icon as IconifyIcon } from "@iconify/react";

// 图标映射：将常用的Antd图标映射到更好看的Iconify图标
const ICON_MAP = {
  // 基础操作
  plus: "material-symbols:add-rounded",
  edit: "material-symbols:edit-rounded",
  delete: "material-symbols:delete-rounded",
  save: "material-symbols:save-rounded",
  close: "material-symbols:close-rounded",
  check: "material-symbols:check-rounded",
  copy: "material-symbols:content-copy-rounded",

  // 导航
  "arrow-left": "material-symbols:arrow-back-ios-rounded",
  "arrow-right": "material-symbols:arrow-forward-ios-rounded",
  "arrow-up": "material-symbols:keyboard-arrow-up-rounded",
  "arrow-down": "material-symbols:keyboard-arrow-down-rounded",
  back: "material-symbols:arrow-back-rounded",

  // 功能
  search: "material-symbols:search-rounded",
  filter: "material-symbols:filter-list-rounded",
  upload: "material-symbols:cloud-upload-rounded",
  download: "material-symbols:cloud-download-rounded",
  scan: "material-symbols:qr-code-scanner-rounded",
  camera: "material-symbols:photo-camera-rounded",
  eye: "material-symbols:visibility-rounded",
  "eye-off": "material-symbols:visibility-off-rounded",

  // AI和机器人
  robot: "material-symbols:smart-toy-rounded",
  ai: "material-symbols:psychology-rounded",
  "auto-fix": "material-symbols:auto-fix-high-rounded",
  magic: "material-symbols:auto-awesome-rounded",
  format: "material-symbols:format-align-left-rounded",

  // 内容
  book: "material-symbols:menu-book-rounded",
  text: "material-symbols:text-fields-rounded",
  image: "material-symbols:image-rounded",
  document: "material-symbols:description-rounded",
  folder: "material-symbols:folder-rounded",
  file: "material-symbols:insert-drive-file-rounded",

  // 状态
  loading: "material-symbols:progress-activity",
  error: "material-symbols:error-rounded",
  warning: "material-symbols:warning-rounded",
  success: "material-symbols:check-circle-rounded",
  info: "material-symbols:info-rounded",

  // 分类和标签
  tag: "material-symbols:label-rounded",
  category: "material-symbols:category-rounded",
  calendar: "material-symbols:calendar-month-rounded",
  time: "material-symbols:schedule-rounded",

  // 比较和分析
  compare: "material-symbols:compare-arrows-rounded",
  analytics: "material-symbols:analytics-rounded",
  chart: "material-symbols:show-chart-rounded",
  stats: "material-symbols:bar-chart-rounded",

  // 设置
  settings: "material-symbols:settings-rounded",
  gear: "material-symbols:settings-rounded",
  config: "material-symbols:tune-rounded",

  // 社交和分享
  share: "material-symbols:share-rounded",
  like: "material-symbols:favorite-rounded",
  star: "material-symbols:star-rounded",

  // 多媒体
  play: "material-symbols:play-arrow-rounded",
  pause: "material-symbols:pause-rounded",
  stop: "material-symbols:stop-rounded",
  volume: "material-symbols:volume-up-rounded",
  mic: "material-symbols:mic-rounded",

  // 网络
  wifi: "material-symbols:wifi-rounded",
  cloud: "material-symbols:cloud-rounded",
  sync: "material-symbols:sync-rounded",
  refresh: "material-symbols:refresh-rounded",

  // 安全
  lock: "material-symbols:lock-rounded",
  unlock: "material-symbols:lock-open-rounded",
  security: "material-symbols:security-rounded",

  // 用户
  user: "material-symbols:person-rounded",
  users: "material-symbols:group-rounded",
  account: "material-symbols:account-circle-rounded",

  // 更多操作
  more: "material-symbols:more-horiz-rounded",
  menu: "material-symbols:menu-rounded",
  grid: "material-symbols:grid-view-rounded",
  list: "material-symbols:view-list-rounded",
} as const;

interface IconProps {
  name: keyof typeof ICON_MAP;
  size?: number | string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  className = "",
  style = {},
  onClick,
}) => {
  const iconName = ICON_MAP[name];

  if (!iconName) {
    console.warn(`Icon "${name}" not found in ICON_MAP`);
    return null;
  }

  const iconStyle: React.CSSProperties = {
    fontSize: typeof size === "number" ? `${size}px` : size,
    color,
    cursor: onClick ? "pointer" : "default",
    ...style,
  };

  return (
    <IconifyIcon
      icon={iconName}
      className={className}
      style={iconStyle}
      onClick={onClick}
    />
  );
};

export default Icon;
