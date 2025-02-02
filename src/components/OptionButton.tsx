import { Button, Typography } from "@mui/material";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";

export const OptionButton = ({
  title,
  description,
  onClick,
  className = "",
  icon = (
    <ArrowForwardIosRoundedIcon sx={{ fontSize: "16px" }} color="disabled" />
  ),
}: {
  title: string;
  description?: string;
  onClick?: () => void;
  className?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Button
      className={`w-full !b-rd-0 !bg-white dark:!bg-dark ${className}`}
      color="inherit"
      size="large"
      onClick={onClick}
      sx={{ height: "48px" }}
    >
      <div className="w-full flex-between pl-2">
        <Typography variant="body1" color="textPrimary">{title}</Typography>
        <div className="flex-center">
          <Typography variant="body2" className="text-3 color-gray dark:color-gray-400">
            {description}
          </Typography>
          {icon}
        </div>
      </div>
    </Button>
  );
};
