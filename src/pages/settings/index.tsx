import { Button } from "@mui/material";
import { message } from "antd";
import { Dialog, NavBar } from "antd-mobile";
import { useNavigate } from "react-router";
import { LogoutAPI } from "../../api/auth";
import { OptionButton } from "../../components/OptionButton";
import { ScrollView } from "../../components/ScallView";
import useAuthStore from "../../store/auth";

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
        <OptionButton title="账号管理" onClick={() => navigator("account")} />
        <OptionButton title="关于聪言" onClick={() => navigator("about")} />
        <div className="px-5 py-2 color-gray">隐私</div>
        <OptionButton title="个人信息收集清单" />
        <OptionButton title="第三方信息共享清单" />
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
