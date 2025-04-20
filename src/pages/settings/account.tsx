import { NavBar } from "antd-mobile";
import { useNavigate } from "react-router";
import { OptionButton } from "../../components/OptionButton";
import { ScrollView } from "../../components/ScrollView";
import useAuthStore from "../../store/auth"; // 导入 useAuthStore

export const AccountSettingsPage = () => {
  const navigator = useNavigate();
  const { userInfo } = useAuthStore(); // 获取 userInfo

  // 根据 userInfo.phone 是否存在来决定显示内容
  const phoneDescription = userInfo?.phone_number ? userInfo.phone_number : "未绑定";

  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>账号管理</NavBar>
      <ScrollView>
        {/* 使用动态的 phoneDescription */}
        <OptionButton title="手机号" description={phoneDescription} />

        <OptionButton title="邮箱" description="未绑定" />
        {/* 添加 onClick 事件导航到修改密码页 */}
        <OptionButton title="修改密码" onClick={() => navigator('/settings/change-password')} />
        <div className="h-2"></div>
        <OptionButton title="注销账号" />
      </ScrollView>
    </div>
  );
};
