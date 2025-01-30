import { Button } from "@mui/material";
import { useNavigate } from "react-router";
import { message } from "antd";
import { Dialog, NavBar } from "antd-mobile";
import { ScrollView } from "../../components/ScallView";
import useAuthStore from "../../store/auth";
import ArrowForwardIosRoundedIcon from "@mui/icons-material/ArrowForwardIosRounded";
import { LogoutAPI } from "../../api/auth";

const SettingItem = ({
  title,
  onClick,
}: {
  title: string;
  onClick?: () => void;
}) => {
  return (
    <Button
      className="w-full !b-rd-0 !bg-white"
      color="inherit"
      size="large"
      onClick={onClick}
    >
      <div className="w-full flex-between pl-2">
        {title}
        <ArrowForwardIosRoundedIcon sx={{ fontSize: "16px" }} color="disabled" />
      </div>
    </Button>
  );
};

export const SettingsPage = () => {
  const navigator = useNavigate();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    Dialog.show({
      content: "确定要退出登录吗？",
      closeOnAction: true,
      actions: [
        [
          {
            key: "cancel",
            text: "取消",
          },
          {
            key: "ok",
            text: "确定",
            bold: true,
            danger: true,
          },
        ],
      ],
      onAction: (action) => {
        if (action.key === "ok") {
          message.loading({ content: "正在退出登录...", key: "logout" });
          LogoutAPI().then((res) => {
            if (res.code == 200) {
              message.success({ content: "退出登录成功", key: "logout" });
              logout();
              navigator(-1);
            }
          });
        }
      },
    });
  };
  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>设置</NavBar>
      <ScrollView>
        <SettingItem title="账号管理" onClick={()=> navigator("account")}/>
        <div className="h-2"></div>
        <Button
          className="w-full !b-rd-0 !bg-white"
          color="secondary"
          size="large"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </ScrollView>
    </div>
  );
};
