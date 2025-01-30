import { Button } from "@mui/material";
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
      className={`w-full !b-rd-0 !bg-white ${className}`}
      color="inherit"
      size="large"
      onClick={onClick}
    >
      <div className="w-full flex-between pl-2">
        {title}
        <div className="flex-center">
          <span className="text-3 color-gray">{description}</span>
          {icon}
        </div>
      </div>
    </Button>
  );
};
