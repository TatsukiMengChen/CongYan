import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import { Button, Divider, Typography } from "@mui/material"; // 导入 MUI Button
import { Card } from "antd"; // 继续使用 antd Card，但调整样式
import { useNavigate } from "react-router";
import styles from "./PracticeArea.module.scss";

const TextCard = ({ title, type }: { title: string; type: string }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // 处理点击事件
    sessionStorage.removeItem("textList");
    navigate(`/train`, { state: { title, type } });
  };

  return (
    // 使用 MUI Button 样式，调整内边距和类名
    <Button
      variant="contained" // 使用 contained 样式
      className={`!mt-2 !px-2 !py-3 ${styles.gradientButton} flex-1 !rounded-lg !shadow-none`} // 调整 padding, 移除阴影（由 gradient 控制）
      onClick={handleClick}
      sx={{ textTransform: 'none' }} // 防止文字大写
    >
      <div className="flex justify-center items-center h-full">
        {/* 调整字体大小和行高 */}
        <Typography variant="body2" component="span" sx={{ lineHeight: 1.4 }}>
          {title}
        </Typography>
      </div>
    </Button>
  );
};

export const PracticeArea = ({ className }: { className?: string }) => {
  return (
    // 调整 antd Card 的 bodyStyle
    <Card className={`${className || ''}`} bodyStyle={{ padding: '16px 20px' }}> {/* 调整内边距 */}
      <div className="flex items-center">
        <AutoStoriesOutlinedIcon fontSize="small" sx={{ color: 'primary.main' }}/> {/* 给图标添加颜色 */}
        {/* 调整标题样式 */}
        <Typography className="pl-2" variant="body1" fontWeight="medium">自主练习</Typography>
      </div>
      <Divider className="!my-3" />
      {/* 调整按钮容器的间距 */}
      <div className="flex justify-between gap-3"> {/* 增加 gap */}
        <TextCard title="散文" type="prose" />
        <TextCard title="古代诗词" type="ancient poetry" />
        <TextCard title="现代诗词" type="modern poetry" />
      </div>
    </Card>
  );
};
