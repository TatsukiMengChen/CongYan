import { message } from "antd";
import { jwtDecode } from "jwt-decode"; // 导入 jwt-decode
import { useEffect, useState, useCallback } from "react"; // 导入 useCallback
import { useNavigate } from "react-router";
// 导入新的 API 函数
import { AskCodeAPI, PasswordLoginAPI, SmsLoginAPI, CheckRegisteredStatusAPI, GeetestResult } from "../../api/auth"; // 导入 CheckRegisteredStatusAPI 和 GeetestResult
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
import { useCaptcha } from "../../hooks/useCaptcha"; // 导入 useCaptcha

// 定义解码后的 Payload 类型 (根据实际 Token 内容调整)
interface DecodedToken {
  id: number;
  'phone-number': string; // 使用实际的键名
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
  const [isLoginLoading, setIsLoginLoading] = useState(false); // 登录按钮加载状态
  const [isCodeSent, setIsCodeSent] = useState(false); // 发送验证码状态
  const [codeTimer, setCodeTimer] = useState(60); // 验证码计时器
  const [isCheckingPhone, setIsCheckingPhone] = useState(false); // 检查手机号状态的加载状态
  const [isSendingCode, setIsSendingCode] = useState(false); // 发送验证码的加载状态
  const [lastVerifiedPhone, setLastVerifiedPhone] = useState<string | null>(null); // 最后成功验证的手机号
  const [lastGeetestResult, setLastGeetestResult] = useState<GeetestResult | null>(null); // 最后一次成功的人机验证结果
  const navigator = useNavigate();
  const { triggerCaptcha, isCaptchaReady } = useCaptcha({
      // 可选：添加 onError 处理，例如记录日志或设置错误状态
      onError: (error) => {
          console.error("Captcha Hook Error:", error);
          // 如果需要，可以在这里设置一个错误状态来显示给用户
          // setCaptchaError("人机验证失败，请稍后重试");
          // 清理可能存在的加载状态
          setIsCheckingPhone(false);
          setIsLoginLoading(false);
      }
  }); // 初始化 useCaptcha

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

  // 手机号变化时清除验证状态、错误和 Geetest 结果
  useEffect(() => {
    setLastVerifiedPhone(null);
    setLastGeetestResult(null); // 清除 Geetest 结果
    setErrors(prev => ({ ...prev, phoneNumber: "" }));
  }, [phoneNumber]);

  // 更新的 validateForm 函数，根据登录方式验证
  const validateForm = useCallback(() => {
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
  }, [phoneNumber, password, verificationCode, loginMethod]); // 添加依赖

  // 内部函数：实际发送验证码
  const sendCodeInternal = useCallback(async (geetestResult?: GeetestResult | null) => {
    setIsSendingCode(true);
    message.loading({ content: "正在发送验证码...", key: "send-code" });
    try {
      // 注意：AskCodeAPI 现在也接收 geetestResult
      const res = await AskCodeAPI(phoneNumber, geetestResult);
      console.log("AskCodeAPI (Login) 响应:", res);
      if (res.status === 0) { // 假设 status 0 表示成功发送
        message.success({ content: res.message || "验证码发送成功", key: "send-code" });
        setIsCodeSent(true);
        setCodeTimer(60);
        setErrors(prev => ({ ...prev, verificationCode: "" })); // 清除验证码错误
      } else {
        // 处理错误，例如手机号未注册 (虽然理论上已被 CheckRegisteredStatusAPI 过滤) 或验证码发送限制
        let errorMsg = res.message || "验证码发送失败";
        if (res.code === "captchaFailed") {
            errorMsg = "人机验证失败，请重试";
        } else if (res.code === "rateLimitExceeded") {
            errorMsg = "验证码发送频繁，请稍后再试";
        }
        // 不再需要处理 phoneNotRegistered，因为前面已经检查过
        message.error({ content: errorMsg, key: "send-code" });
        setIsCodeSent(false); // 保持按钮可用
        setCodeTimer(60);
      }
    } catch (error: any) {
      message.error({ content: error.message || "验证码发送请求失败", key: "send-code" });
      console.error("发送验证码错误 (Login):", error);
      setIsCodeSent(false);
      setCodeTimer(60);
    } finally {
      setIsSendingCode(false);
    }
  }, [phoneNumber]); // 添加依赖

  // 处理发送验证码 (包含前置检查和人机验证)
  const handleSendCode = useCallback(async () => {
    // 1. 本地验证手机号格式
    if (!phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号是必填项" }));
      return;
    }
    if (!/^1\d{10}$/.test(phoneNumber)) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号格式不正确" }));
      return;
    }
    setErrors((prev) => ({ ...prev, phoneNumber: "" })); // 清除本地格式错误

    // 2. 检查是否需要重新验证手机号状态
    if (phoneNumber === lastVerifiedPhone) {
      console.log("手机号状态已验证，尝试发送验证码");
      // 如果后端要求每次发码都需要验证，这里可能需要触发 triggerCaptcha
      // 假设如果状态已验证，则可以直接发码或复用之前的验证（如果 AskCodeAPI 支持）
      // 为了简化，我们假设可以直接调用 sendCodeInternal，它内部处理 Geetest (如果需要)
      await sendCodeInternal(lastGeetestResult); // 尝试传递上次的 geetest 结果
      return;
    }

    // 3. 需要验证手机号状态，启动人机验证
    if (!isCaptchaReady) {
        message.error("人机验证组件未就绪，请稍候...");
        return;
    }
    setIsCheckingPhone(true);

    try {
      const geetestResult = await triggerCaptcha();
      console.log("人机验证成功 (for status check):", geetestResult);
      setLastGeetestResult(geetestResult); // !! 存储验证结果 !!

      // 4. 人机验证成功，检查手机号注册状态
      const statusRes = await CheckRegisteredStatusAPI(phoneNumber, geetestResult);
      console.log("CheckRegisteredStatusAPI 响应:", statusRes);

      if (statusRes.status === 0 && statusRes.code === "phoneRegistered") {
        // 5. 手机号已注册，更新状态并发送验证码
        setLastVerifiedPhone(phoneNumber); // 记录已验证 *状态* 的手机号
        await sendCodeInternal(geetestResult); // 使用同一次人机验证结果发送验证码
      } else if (statusRes.code === "phoneNotRegistered") {
        setErrors((prev) => ({ ...prev, phoneNumber: "该手机号未注册" }));
        setLastVerifiedPhone(null); // 清除状态验证
        setLastGeetestResult(null); // 清除 geetest 结果，因为手机号无效
      } else {
        // 处理其他检查错误，如人机验证失败
        console.error("手机号状态检查失败:", statusRes.message || statusRes.code);
        setErrors((prev) => ({ ...prev, phoneNumber: statusRes.message || "手机号状态检查失败" }));
        setLastVerifiedPhone(null);
        // 不清除 lastGeetestResult，因为可能是临时网络问题，验证本身可能有效
      }
    } catch (error: any) {
      // 处理 triggerCaptcha 或 CheckRegisteredStatusAPI 的错误
      console.error("验证码发送前置检查错误:", error);
      setErrors((prev) => ({ ...prev, phoneNumber: "验证过程出错，请重试" }));
      setLastVerifiedPhone(null);
      // 不清除 lastGeetestResult
    } finally {
      setIsCheckingPhone(false);
    }
  }, [phoneNumber, lastVerifiedPhone, isCaptchaReady, triggerCaptcha, sendCodeInternal, lastGeetestResult]); // 添加依赖

  // 内部函数：实际执行登录 API 调用
  const performLogin = useCallback(async (loginGeetestResult: GeetestResult) => {
    message.loading({ content: "登录中...", key: "login" });
    const apiCall = loginMethod === "password"
      ? PasswordLoginAPI(phoneNumber, password, loginGeetestResult)
      : SmsLoginAPI(phoneNumber, verificationCode, loginGeetestResult);

    try {
      const res = await apiCall;
      console.log(`${loginMethod === "password" ? "Password" : "SMS"} LoginAPI 响应:`, res);
      // ... (处理登录成功和失败的逻辑，与原来类似) ...
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
              username = decodedPayload['phone-number'] || username; // 使用正确的键名 'phone-number' 访问 payload
              role = decodedPayload.role || role;
              expiryTimestamp = decodedPayload.exp * 1000; // JWT exp 是秒，转为毫秒

              // 将解码后的用户信息存储到 localStorage
              localStorage.setItem('userInfo', JSON.stringify({
                id: decodedPayload.id,
                phone_number: decodedPayload['phone-number'], // 存储时仍可使用 phone_number
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
            let shouldResetGeetest = false; // 标记是否需要重置 Geetest

            if (res.code === "invalidCredentials") {
              errorMsg = "手机号或密码错误";
              setErrors(prev => ({ ...prev, password: "手机号或密码错误" }));
              shouldResetGeetest = true; // 凭证错误，强制下次重新验证
            } else if (res.code === "invalidSmsCode") {
              errorMsg = "验证码错误或已过期";
              setErrors(prev => ({ ...prev, verificationCode: "验证码错误或已过期" }));
              shouldResetGeetest = true; // 验证码错误，强制下次重新验证
            } else if (res.code === "phoneNotRegistered") {
              errorMsg = "该手机号未注册";
              setErrors(prev => ({ ...prev, phoneNumber: "该手机号未注册" }));
              setLastVerifiedPhone(null); // 清除状态验证
              shouldResetGeetest = true; // 手机号无效，重置 Geetest
            } else if (res.code === "captchaFailed") {
                errorMsg = "人机验证失败，请重试";
                shouldResetGeetest = true; // Geetest 失败，强制下次重新验证
            }
            // 可以根据后端返回的其他 code 添加更多错误处理

            message.error({ content: errorMsg, key: "login" });
            console.log("登录失败:", errorMsg);
            // 清理 localStorage
            localStorage.removeItem('userInfo');
            localStorage.removeItem('jwtToken');

            // !! 根据标记重置 Geetest 结果 !!
            if (shouldResetGeetest) {
                console.log("登录失败，重置 Geetest 状态");
                setLastGeetestResult(null);
            }
          }
    } catch (err: any) {
      message.error({ content: err.message || "登录请求失败", key: "login" });
      console.error("登录错误:", err);
      // 清理 localStorage
      localStorage.removeItem('userInfo');
      localStorage.removeItem('jwtToken');
      // 网络或其他请求错误，也重置 Geetest
      console.log("登录请求错误，重置 Geetest 状态");
      setLastGeetestResult(null);
    }
  }, [loginMethod, phoneNumber, password, verificationCode, authLogin, navigator]); // 添加依赖

  // 内部函数：触发登录前的人机验证(如果需要)并执行登录
  // !! 恢复 preCheckGeetestResult 参数 !!
  const loginInternal = useCallback(async (preCheckGeetestResult?: GeetestResult | null) => {
    setIsLoginLoading(true); // 开始整个登录流程的加载状态

    try {
      let finalGeetestResult: GeetestResult;

      if (preCheckGeetestResult) {
        // 优先使用直接传递过来的结果 (来自同一 handleLogin 调用的状态检查)
        console.log("[loginInternal] Using preCheckGeetestResult passed directly:", preCheckGeetestResult);
        finalGeetestResult = preCheckGeetestResult;
        // 也更新状态，以防万一
        if (preCheckGeetestResult !== lastGeetestResult) {
            setLastGeetestResult(preCheckGeetestResult);
        }
      } else if (lastGeetestResult) {
        // 其次，使用状态中存储的结果 (来自之前的操作或失败后未清除的情况)
        console.log("[loginInternal] Reusing lastGeetestResult from state:", lastGeetestResult);
        finalGeetestResult = lastGeetestResult;
      } else {
        // 最后，如果都没有，触发新的人机验证
        if (!isCaptchaReady) {
          message.error("人机验证组件未就绪，请稍候...");
          setIsLoginLoading(false);
          return;
        }
        console.log("[loginInternal] No valid Geetest result found. Triggering new captcha.");
        finalGeetestResult = await triggerCaptcha();
        console.log("[loginInternal] New captcha successful:", finalGeetestResult);
        setLastGeetestResult(finalGeetestResult); // !! 存储新的验证结果 !!
      }

      // 使用最终的 geetest 结果执行登录
      await performLogin(finalGeetestResult);

    } catch (error: any) {
      // 处理 triggerCaptcha 的错误 (如果被调用)
      console.error("登录人机验证错误:", error);
      setErrors(prev => ({ ...prev, password: "安全验证失败，请重试" })); // 或通用错误
      setLastGeetestResult(null); // 验证出错，清除结果
    } finally {
      setIsLoginLoading(false); // 结束整个登录流程的加载状态
    }
    // !! 更新依赖 !!
  }, [isCaptchaReady, triggerCaptcha, performLogin, lastGeetestResult]);

  // 处理登录逻辑 (包含前置检查和人机验证)
  const handleLogin = useCallback(async () => {
    // 1. 本地表单验证和协议检查
    if (!validateForm() || !isPolicyChecked) {
      if (!isPolicyChecked) {
        message.warning("请先阅读并同意用户协议和隐私政策");
      }
      return;
    }

    // 2. 检查手机号 *状态* 是否已通过验证
    if (phoneNumber === lastVerifiedPhone) {
      console.log("手机号状态已验证，直接进行登录流程");
      // 直接调用 loginInternal，不传递参数，让它检查 lastGeetestResult 状态
      await loginInternal();
      return;
    }

    // 3. 需要先验证手机号状态，启动人机验证
    if (!isCaptchaReady) {
        message.error("人机验证组件未就绪，请稍候..."); // 保留
        return;
    }
    setIsCheckingPhone(true); // 使用检查手机号的加载状态

    try {
      const geetestResult = await triggerCaptcha();
      console.log("人机验证成功 (for status check before login):", geetestResult);
      // 存储验证结果，即使 loginInternal 也接收它，以备后续操作复用
      setLastGeetestResult(geetestResult);

      // 4. 人机验证成功，检查手机号注册状态
      const statusRes = await CheckRegisteredStatusAPI(phoneNumber, geetestResult);
      console.log("CheckRegisteredStatusAPI 响应 (before login):", statusRes);

      if (statusRes.status === 0 && statusRes.code === "phoneRegistered") {
        // 5. 手机号已注册，更新状态并继续进行登录
        setLastVerifiedPhone(phoneNumber); // 记录已验证 *状态* 的手机号
        // !! 关键改动：将本次获得的 geetestResult 直接传递给 loginInternal !!
        await loginInternal(geetestResult);
      } else if (statusRes.code === "phoneNotRegistered") {
        setErrors((prev) => ({ ...prev, phoneNumber: "该手机号未注册" })); // 保留
        setLastVerifiedPhone(null); // 清除状态验证
        setLastGeetestResult(null); // 手机号无效，清除 geetest
      } else {
        // 处理其他检查错误
        console.error("手机号状态检查失败 (before login):", statusRes.message || statusRes.code);
        setErrors((prev) => ({ ...prev, phoneNumber: statusRes.message || "手机号状态检查失败" })); // 可选
        setLastVerifiedPhone(null);
        // 不清除 lastGeetestResult，因为验证本身可能没错
      }
    } catch (error: any) {
      // 处理 triggerCaptcha 或 CheckRegisteredStatusAPI 的网络错误等
      console.error("登录前置检查错误:", error);
      setErrors((prev) => ({ ...prev, phoneNumber: "验证过程出错，请重试" })); // 可选
      setLastVerifiedPhone(null);
      // 不清除 lastGeetestResult
    } finally {
      setIsCheckingPhone(false); // 结束检查手机号的加载状态
    }
    // !! 更新依赖 !!
  }, [validateForm, isPolicyChecked, phoneNumber, lastVerifiedPhone, isCaptchaReady, triggerCaptcha, loginInternal]);

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

  // 计算按钮的禁用状态
  const isSendCodeDisabled = isCheckingPhone || isSendingCode || isCodeSent || !!errors.phoneNumber;
  const isLoginButtonDisabled = !isPolicyChecked || isLoginLoading || isCheckingPhone;


  return (
    <AuthContainer>
      <AuthCard>
        <AuthHeader />
        <PhoneInput
          id="login-phone"
          label="手机号"
          value={phoneNumber}
          onChange={(e) => {
              const newPhone = e.target.value.replace(/[^0-9]/g, ""); // 只允许数字
              if (newPhone.length <= 11) {
                  setPhoneNumber(newPhone);
                  // 手机号变化时，立即清除相关错误，验证状态会在 useEffect 中清除
                  if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: "" }));
              }
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
            onSendCode={handleSendCode} // 使用新的 handleSendCode
            isCodeSent={isCodeSent}
            codeTimer={codeTimer}
            error={!!errors.verificationCode}
            helperText={errors.verificationCode}
            phoneError={errors.phoneNumber} // 传递手机错误
            disabled={isCheckingPhone || isSendingCode} // 根据状态禁用
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
          onClick={handleLogin} // 调用新的 handleLogin
          variant="contained"
          size="large"
          disabled={isLoginButtonDisabled} // 使用计算出的禁用状态
          fullWidth // 使按钮宽度占满
        >
          {isCheckingPhone ? "验证手机号..." : (isLoginLoading ? "登录中..." : "登录")}
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
