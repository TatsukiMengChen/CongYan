import { Button } from "@mui/material";
import { NavBar } from "antd-mobile";
import { useNavigate } from "react-router";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { ScrollView } from "../../components/ScallView";

interface ItemProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

const Item: React.FC<ItemProps> = ({ title, description, onClick }) => {
  return (
    <Button
      className="w-full !b-rd-0 !bg-white"
      color="inherit"
      size="large"
      onClick={onClick}
    >
      <div className="w-full flex-between pl-2">
        {title}
        <div className="flex-center">
          <span className="text-3 color-gray">{description}</span>
          <ArrowForwardIosRoundedIcon
            sx={{ fontSize: "16px" }}
            color="disabled"
          />
        </div>
      </div>
    </Button>
  );
};

export const AccountSettingsPage = () => {
  const navigator = useNavigate();
  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>账号管理</NavBar>
      <ScrollView>
        <Item title="手机号" description="未绑定" />

        <Item title="邮箱" description="未绑定" />
        <Item title="修改密码" />
        <div className="h-2"></div>
        <Item title="注销账号" />
      </ScrollView>
    </div>
  );
};
