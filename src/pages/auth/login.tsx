import { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router";
import { LoginAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import UserAgreement from "../../components/UserAgreement";
import useAuthStore from "../../store/auth";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";
// 导入新的和更新的组件
import { AuthHeader } from "./components/AuthHeader";
// import { AccountInput } from "./components/AccountInput"; // 已移除
import { PhoneInput } from "./components/PhoneInput"; // 已添加
import { PasswordInput } from "./components/PasswordInput";
import { PolicyCheckbox } from "./components/PolicyCheckbox";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
// 如果有未使用的导入，请移除

export const LoginPage = () => {
  const { login: authLogin } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState(""); // 从 account 更改
  const [password, setPassword] = useState("");
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  const [errors, setErrors] = useState({ phoneNumber: "", password: "" }); // 从 account 更改
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigator = useNavigate();

  // 更新的 validateForm 函数
  const validateForm = () => {
    let valid = true;
    const newErrors = { phoneNumber: "", password: "" }; // 从 account 更改

    // 手机号验证
    if (!phoneNumber) {
      newErrors.phoneNumber = "手机号是必填项";
      valid = false;
    } else if (!/^1\d{10}$/.test(phoneNumber)) { // 基本验证
      newErrors.phoneNumber = "手机号格式不正确";
      valid = false;
    }


    // 密码验证
    if (!password) {
      newErrors.password = "密码是必填项";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // 更新的 onSubmit 函数
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm() && isPolicyChecked) { // 同时检查政策
      console.log({ phone_number: phoneNumber, password }); // 使用 phone_number
      setIsLoginLoading(true);
      message.loading({ content: "登录中...", key: "login" });
      LoginAPI(phoneNumber, password) // 使用 phoneNumber
        .then((res) => {
          console.log("LoginAPI 响应:", res);
          // 使用 mock 响应中的 status 和 code
          if (res.status === 0 && res.code === 6 && res.data?.jwt_token) {
            message.success({ content: res.message || "登录成功", key: "login" });
            // 使用 mock 响应中的数据更新 auth store
            const timestamp = res.data.expire ? new Date(res.data.expire).getTime() : Date.now() + 3600 * 1000; // 后备过期时间
            authLogin(
              res.data.username || "MockUser", // 使用响应中的 username 或后备值
              res.data.jwt_token,
              res.data.role || "patient", // 使用响应中的 role 或后备值
              timestamp,
            );
            console.log("登录成功");
            navigator("/home", { replace: true });
          } else {
            message.error({ content: res.message || "登录失败", key: "login" });
            console.log("登录失败:", res.message);
            // 可选：登录失败时清除密码字段
            // setPassword("");
          }
        })
        .catch((err) => { // 为网络错误添加 catch 块
          message.error({ content: "登录请求失败", key: "login" });
          console.error("登录错误:", err);
        })
        .finally(() => {
          setIsLoginLoading(false);
        });
    } else if (!isPolicyChecked) {
      message.warning("请先阅读并同意用户协议和隐私政策");
    }
  };

  // ... 现有的 handleUserAgreementOpen/Close 函数 ...
  const handleUserAgreementOpen = () => setIsUserAgreementOpen(true);
  const handleUserAgreementClose = () => setIsUserAgreementOpen(false);
  const handlePrivacyPolicyOpen = () => setIsPrivacyPolicyOpen(true);
  const handlePrivacyPolicyClose = () => setIsPrivacyPolicyOpen(false);


  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader />
        <PhoneInput // 使用 PhoneInput
          id="login-phone"
          label="手机号" // 登录页的明确标签
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
        />
        <PasswordInput
          id="login-password"
          label="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={!!errors.password}
          helperText={errors.password}
        />
        <PolicyCheckbox
          checked={isPolicyChecked}
          onChange={() => setIsPolicyChecked(!isPolicyChecked)}
          onUserAgreementOpen={handleUserAgreementOpen}
          onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
        />
        <Button
          onClick={onSubmit}
          variant="contained"
          size="large"
          disabled={!isPolicyChecked || isLoginLoading} // 加载时也禁用按钮
        // loading={isLoginLoading} // Button 没有 loading 属性，通过 disabled 状态处理
        >
          {isLoginLoading ? "登录中..." : "登录"}
        </Button>
        <div className="flex-center">
          没有账号？
          <Link
            href="/register" // 保留 href 用于语义，但阻止默认行为
            underline="hover"
            onClick={(e) => {
              e.preventDefault();
              navigator("/register"); // 使用 navigator 进行 SPA 导航
            }}
          >
            点我注册
          </Link>
        </div>
      </AuthCard>
      <UserAgreement
        open={isUserAgreementOpen}
        onClose={handleUserAgreementClose}
      />
      <PrivacyPolicy
        open={isPrivacyPolicyOpen}
        onClose={handlePrivacyPolicyClose}
      />
    </AuthContainer>
  );
};
