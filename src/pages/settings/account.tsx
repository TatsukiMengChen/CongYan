import { NavBar } from "antd-mobile";
import { useNavigate } from "react-router";
import { OptionButton } from "../../components/OptionButton";
import { ScrollView } from "../../components/ScrollView";

export const AccountSettingsPage = () => {
  const navigator = useNavigate();
  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>账号管理</NavBar>
      <ScrollView>
        <OptionButton title="手机号" description="未绑定" />

        <OptionButton title="邮箱" description="未绑定" />
        <OptionButton title="修改密码" />
        <div className="h-2"></div>
        <OptionButton title="注销账号" />
      </ScrollView>
    </div>
  );
};
