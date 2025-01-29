import { Button } from "@mui/material";
import { useNavigate } from "react-router";
import { message } from "antd";
import { Dialog, NavBar } from "antd-mobile";
import { ScallView } from "../../components/ScallView";
import useAuthStore from "../../store/auth";
import { LogoutAPI } from "../../api/auth";


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
          LogoutAPI().then(() => {
            message.success({ content: "退出登录成功", key: "logout" });
            logout();
            navigator(-1);
            // navigator("/login", { replace: true });
          });
        }
      },
    });
  };
  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>标题</NavBar>
      <ScallView>
        <Button
          className="w-full !b-rd-0 !bg-white"
          color="secondary"
          size="large"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </ScallView>
    </div>
  );
};
