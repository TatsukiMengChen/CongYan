import { message } from "antd";
import { jwtDecode } from "jwt-decode"; // 导入 jwt-decode
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
// 导入新的 API 函数
import { AskCodeAPI, PasswordLoginAPI, SmsLoginAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import UserAgreement from "../../components/UserAgreement";
import useAuthStore from "../../store/auth";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";
// 导入新的和更新的组件
import Box from "@mui/material/Box"; // 导入 Box 用于布局
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import { AuthHeader } from "./components/AuthHeader";
import { PasswordInput } from "./components/PasswordInput";
import { PhoneInput } from "./components/PhoneInput";
import { PolicyCheckbox } from "./components/PolicyCheckbox";
// 导入验证码输入组件
import useInputStore from "../../store/input"; // 导入 useInputStore
import { VerificationCodeInput } from "./components/VerificationCodeInput";

// 定义解码后的 Payload 类型 (根据实际 Token 内容调整)
interface DecodedToken {
  id: number;
  phone_number: string;
  role: string;
  exp: number; // 过期时间戳
  // 可能还有其他字段，如 iat (issued at)
}

export const LoginPage = () => {
  const { login: authLogin } = useAuthStore();
  const { input: isTyping } = useInputStore(); // 获取输入状态
  const [loginMethod, setLoginMethod] = useState<"password" | "sms">("sms"); // 默认改为 sms
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState(""); // 验证码状态
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  // 更新 errors 状态以包含验证码
  const [errors, setErrors] = useState({ phoneNumber: "", password: "", verificationCode: "" });
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false); // 发送验证码状态
  const [codeTimer, setCodeTimer] = useState(60); // 验证码计时器
  const navigator = useNavigate();

  // 验证码计时器逻辑 (与注册页相同)
  useEffect(() => {
    let timer: number;
    if (isCodeSent && codeTimer > 0) {
      timer = window.setTimeout(() => setCodeTimer(codeTimer - 1), 1000);
    } else if (codeTimer === 0) {
      setIsCodeSent(false);
      setCodeTimer(60);
    }
    return () => window.clearTimeout(timer);
  }, [isCodeSent, codeTimer]);

  // 更新的 validateForm 函数，根据登录方式验证
  const validateForm = () => {
    let valid = true;
    const newErrors = { phoneNumber: "", password: "", verificationCode: "" };

    // 手机号验证 (始终需要)
    if (!phoneNumber) {
      newErrors.phoneNumber = "手机号是必填项";
      valid = false;
    } else if (!/^1\d{10}$/.test(phoneNumber)) {
      newErrors.phoneNumber = "手机号格式不正确";
      valid = false;
    }

    // 根据登录方式验证密码或验证码
    if (loginMethod === "password") {
      if (!password) {
        newErrors.password = "密码是必填项";
        valid = false;
      }
    } else { // loginMethod === "sms"
      if (!verificationCode) {
        newErrors.verificationCode = "验证码是必填项";
        valid = false;
      } else if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
        newErrors.verificationCode = "验证码必须是6位数字";
        valid = false;
      }
    }

    setErrors(newErrors);
    return valid;
  };

  // 处理登录逻辑
  const handleLogin = () => {
    if (validateForm() && isPolicyChecked) {
      setIsLoginLoading(true);
      message.loading({ content: "登录中...", key: "login" });

      const apiCall = loginMethod === "password"
        ? PasswordLoginAPI(phoneNumber, password)
        : SmsLoginAPI(phoneNumber, verificationCode);

      apiCall
        .then((res) => {
          console.log(`${loginMethod === "password" ? "Password" : "SMS"} LoginAPI 响应:`, res);
          // 检查通用的成功状态和 code (假设后端成功 code 为 "loginSuccessful")
          if (res.status === 0 && res.code === "loginSuccessful" && res.data?.jwt_token) {
            message.success({ content: res.message || "登录成功", key: "login" });

            const token = res.data.jwt_token;
            let decodedPayload: DecodedToken | null = null;
            let username = "User"; // 默认值
            let role = "unknown"; // 默认值
            let expiryTimestamp = Date.now() + 3600 * 1000; // 默认1小时后过期

            try {
              // 解码 JWT Token
              decodedPayload = jwtDecode<DecodedToken>(token);
              console.log("Decoded Token:", decodedPayload);

              // 从解码后的 payload 中获取信息 (如果存在)
              username = decodedPayload.phone_number || username; // 假设用手机号作为用户名显示
              role = decodedPayload.role || role;
              expiryTimestamp = decodedPayload.exp * 1000; // JWT exp 是秒，转为毫秒

              // 将解码后的用户信息存储到 localStorage
              localStorage.setItem('userInfo', JSON.stringify({
                id: decodedPayload.id,
                phone_number: decodedPayload.phone_number,
                role: decodedPayload.role,
                // 可以根据需要存储更多信息
              }));
              // 也可以单独存储 token
              localStorage.setItem('jwtToken', token);

            } catch (error) {
              console.error("解码 JWT Token 失败:", error);
              // 如果解码失败，仍然尝试使用 API 返回的数据（如果有）或默认值
              username = res.data.username || username;
              role = res.data.role || role;
              expiryTimestamp = res.data.expire ? new Date(res.data.expire).getTime() : expiryTimestamp;
              // 清理可能存在的旧 localStorage 数据
              localStorage.removeItem('userInfo');
              localStorage.removeItem('jwtToken');
            }

            // 更新 Zustand store (使用解码或API返回的信息)
            authLogin(
              username,
              token,
              role,
              expiryTimestamp,
            );

            console.log("登录成功");
            navigator("/home", { replace: true });
          } else {
            // 处理登录失败
            let errorMsg = res.message || "登录失败";
            if (res.code === "invalidCredentials") {
              errorMsg = "手机号或密码错误";
              setErrors(prev => ({ ...prev, password: "手机号或密码错误" }));
            } else if (res.code === "invalidSmsCode") {
              errorMsg = "验证码错误或已过期";
              setErrors(prev => ({ ...prev, verificationCode: "验证码错误或已过期" }));
            } else if (res.code === "phoneNotRegistered") {
              errorMsg = "该手机号未注册";
              setErrors(prev => ({ ...prev, phoneNumber: "该手机号未注册" }));
            }
            // 可以根据后端返回的其他 code 添加更多错误处理
            message.error({ content: errorMsg, key: "login" });
            console.log("登录失败:", errorMsg);
            // 清理 localStorage
            localStorage.removeItem('userInfo');
            localStorage.removeItem('jwtToken');
          }
        })
        .catch((err) => {
          message.error({ content: err.message || "登录请求失败", key: "login" });
          console.error("登录错误:", err);
          // 清理 localStorage
          localStorage.removeItem('userInfo');
          localStorage.removeItem('jwtToken');
        })
        .finally(() => {
          setIsLoginLoading(false);
        });
    } else if (!isPolicyChecked) {
      message.warning("请先阅读并同意用户协议和隐私政策");
    }
  };

  // 处理发送验证码 (登录场景)
  const handleSendCode = () => {
    // 验证手机号
    if (!phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号是必填项" }));
      return;
    }
    if (!/^1\d{10}$/.test(phoneNumber)) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号格式不正确" }));
      return;
    }
    setErrors((prev) => ({ ...prev, phoneNumber: "" })); // 清除手机号错误

    message.loading({ content: "正在检查手机号并发送验证码...", key: "send-code" });

    AskCodeAPI(phoneNumber, "login") // 指定 type 为 "login"
      .then((res) => {
        console.log("AskCodeAPI (Login) 响应:", res);
        if (res.status === 0) { // 假设 status 0 表示成功发送
          message.success({ content: res.message || "验证码发送成功", key: "send-code" });
          setIsCodeSent(true);
          setCodeTimer(60);
        } else {
          // 处理错误，例如手机号未注册
          let errorMsg = res.message || "验证码发送失败";
          if (res.code === "phoneNotRegistered") {
            errorMsg = "该手机号未注册";
            setErrors((prev) => ({ ...prev, phoneNumber: errorMsg }));
          } else if (res.code === "statusCheckFailed") {
             errorMsg = "检查手机号状态失败，请稍后重试";
          }
          message.error({ content: errorMsg, key: "send-code" });
          setIsCodeSent(false);
          setCodeTimer(60);
        }
      })
      .catch((error) => {
        message.error({ content: error.message || "验证码发送请求失败", key: "send-code" });
        console.error("发送验证码错误 (Login):", error);
        setIsCodeSent(false);
        setCodeTimer(60);
      });
  };

  // 处理验证码输入变化
   const handleVerificationCodeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // 只允许数字
    if (value.length <= 6) {
      setVerificationCode(value);
      // 当用户开始输入验证码时，清除验证码相关的错误提示
      if (errors.verificationCode) {
        setErrors(prev => ({ ...prev, verificationCode: "" }));
      }
    }
  };


  // ... 现有的 handleUserAgreementOpen/Close 函数 ...
  const handleUserAgreementOpen = () => setIsUserAgreementOpen(true);
  const handleUserAgreementClose = () => setIsUserAgreementOpen(false);
  const handlePrivacyPolicyOpen = () => setIsPrivacyPolicyOpen(true);
  const handlePrivacyPolicyClose = () => setIsPrivacyPolicyOpen(false);

  // 切换登录方式
  const toggleLoginMethod = () => {
    setLoginMethod(prev => prev === "password" ? "sms" : "password");
    // 清除当前方式的错误和输入值
    setErrors({ phoneNumber: errors.phoneNumber, password: "", verificationCode: "" }); // 保留手机号错误
    setPassword("");
    setVerificationCode("");
    setIsCodeSent(false); // 重置验证码发送状态
    setCodeTimer(60);
  };

  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader />
        <PhoneInput
          id="login-phone"
          label="手机号"
          value={phoneNumber}
          onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
          }}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
        />

        {/* 条件渲染密码或验证码输入 */}
        {loginMethod === "password" ? (
          <PasswordInput
            id="login-password"
            label="密码"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
            }}
            error={!!errors.password}
            helperText={errors.password}
          />
        ) : (
          <VerificationCodeInput
            value={verificationCode}
            onChange={handleVerificationCodeChange}
            onSendCode={handleSendCode}
            isCodeSent={isCodeSent}
            codeTimer={codeTimer}
            error={!!errors.verificationCode}
            helperText={errors.verificationCode}
            phoneError={errors.phoneNumber} // 传递手机错误以禁用发送按钮
          />
        )}

        {/* 切换登录方式的链接 */}
        <Box sx={{ textAlign: 'right', my: 1 }}> {/* 右对齐并添加垂直边距 */}
          <Link component="button" variant="body2" onClick={toggleLoginMethod} underline="hover">
            {loginMethod === 'password' ? '使用验证码登录' : '使用密码登录'}
          </Link>
        </Box>


        <PolicyCheckbox
          checked={isPolicyChecked}
          onChange={() => setIsPolicyChecked(!isPolicyChecked)}
          onUserAgreementOpen={handleUserAgreementOpen}
          onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
        />
        <Button
          onClick={handleLogin} // 调用 handleLogin
          variant="contained"
          size="large"
          disabled={!isPolicyChecked || isLoginLoading}
          fullWidth // 使按钮宽度占满
        >
          {isLoginLoading ? "登录中..." : "登录"}
        </Button>
        {/* 注册链接 - 仅在非输入状态下显示 */}
        {!isTyping && (
          <div className="flex-center" style={{ marginTop: '16px' }}>
            没有账号？
            <Link
              href="/register"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                navigator("/register");
              }}
            >
              点我注册
            </Link>
          </div>
        )}
      </AuthCard>
      {/* ... 现有的对话框 ... */}
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
