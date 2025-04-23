import Button from "@mui/material/Button";
import { useEffect, useState, useCallback } from "react"; // 导入 useCallback
// ... 其他导入 ...
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import { message } from "antd";
import { jwtDecode } from "jwt-decode"; // 导入 jwt-decode
import { useNavigate } from "react-router";
// 导入更新后的 API 函数 和 GeetestResult 类型
import { AskCodeAPI, RegisterAPI, GeetestResult, CheckRegisteredStatusAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import UserAgreement from "../../components/UserAgreement";
import useAuthStore from "../../store/auth"; // 导入 useAuthStore
import useInputStore from "../../store/input";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";
// 导入新的和更新的组件
import dayjs, { Dayjs } from "dayjs";
import { AuthHeader } from "./components/AuthHeader";
import { BirthDatePicker } from "./components/BirthDatePicker";
import { GenderSelect } from "./components/GenderSelect";
// 移除 PasswordInput 导入，如果不再需要
// import { PasswordInput } from "./components/PasswordInput";
import { PhoneInput } from "./components/PhoneInput";
import { PolicyCheckbox } from "./components/PolicyCheckbox";
import { RoleSelect } from "./components/RoleSelect";
import { VerificationCodeInput } from "./components/VerificationCodeInput";
// 如果步骤之间不再使用，则移除 Divider 和 Typography
// import Divider from "@mui/material/Divider";
// import Typography from "@mui/material/Typography";
import { useCaptcha } from "../../hooks/useCaptcha"; // 导入 useCaptcha

// 定义解码后的 Payload 类型 (与 login.tsx 保持一致)
interface DecodedToken {
  id: number;
  'phone-number': string;
  role: string;
  exp: number;
}

export const RegisterPage = () => {
  const { login: authLogin } = useAuthStore(); // 获取 Zustand 的 login 函数
  // ... existing state variables ...
  const { input: isTyping } = useInputStore();
  const [step, setStep] = useState(1); // 添加步骤状态，默认为 1
  const [phoneNumber, setPhoneNumber] = useState("");
  // const [password, setPassword] = useState(""); // 移除密码状态
  // const [confirmPassword, setConfirmPassword] = useState(""); // 移除确认密码状态
  const [verificationCode, setVerificationCode] = useState("");
  const [userRole, setUserRole] = useState("");
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);
  const [gender, setGender] = useState("");
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  // 确保 errors 状态覆盖所有字段，移除密码相关
  const [errors, setErrors] = useState({
    phoneNumber: "",
    // password: "", // 移除
    // confirmPassword: "", // 移除
    verificationCode: "",
    userRole: "",
    birthDate: "",
    gender: "",
  });
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeTimer, setCodeTimer] = useState(60);
  const [isCheckingCaptcha, setIsCheckingCaptcha] = useState(false); // 人机验证加载状态
  const [lastGeetestResult, setLastGeetestResult] = useState<GeetestResult | null>(null); // 存储人机验证结果
  const navigator = useNavigate();
  const { triggerCaptcha, isCaptchaReady } = useCaptcha({ // 初始化 useCaptcha
    onError: (error) => {
      console.error("Captcha Hook Error:", error);
      setIsCheckingCaptcha(false); // 清理加载状态
      // 可以选择性地显示错误消息
      // message.error("人机验证失败，请重试");
    }
  });

  // ... 现有的验证码计时器 useEffect ...
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

  // 步骤 2 的验证（以及组合验证）
  const validateForm = useCallback(() => {
    // 首先，确保步骤 1 的字段有效（如果 handleNext 已经验证过，可能冗余）
    // 注意：注册时不再需要验证步骤1的验证码，因为验证码用于注册本身
    let step1Valid = true;
    const step1Errors = { ...errors };
    // 仅验证步骤1的手机号
    if (!phoneNumber) { step1Errors.phoneNumber = "手机号是必填项"; step1Valid = false; }
    else if (!/^1\d{10}$/.test(phoneNumber)) { step1Errors.phoneNumber = "手机号格式不正确"; step1Valid = false; }
    else { step1Errors.phoneNumber = ""; }
    // 移除密码验证
    // if (!password) { ... }
    // if (!confirmPassword) { ... }
    // 验证码在提交时验证，不在这一步
    step1Errors.verificationCode = "";

    if (!step1Valid) {
      setErrors(step1Errors);
      return false;
    }

    let valid = true;
    const newErrors = { ...step1Errors }; // 保留步骤1的错误（如果有）

    // 角色验证
    if (!userRole) {
      newErrors.userRole = "请选择角色";
      valid = false;
    } else {
      newErrors.userRole = "";
    }

    // 出生日期验证
    if (!birthDate) {
      newErrors.birthDate = "请选择出生日期";
      valid = false;
    } else if (birthDate.isAfter(new Date())) {
      newErrors.birthDate = "出生日期不能是未来";
      valid = false;
    } else {
      newErrors.birthDate = "";
    }

    // 性别验证
    if (!gender) {
      newErrors.gender = "请选择性别";
      valid = false;
    } else {
      newErrors.gender = "";
    }

    // 验证码验证（在提交时进行）
    if (!verificationCode) {
      newErrors.verificationCode = "验证码是必填项";
      valid = false;
    } else if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      newErrors.verificationCode = "验证码必须是6位数字";
      valid = false;
    } else {
      newErrors.verificationCode = ""; // 如果有效则清除错误
    }

    setErrors(newErrors);
    return valid;
    // 移除 password, confirmPassword 依赖
  }, [phoneNumber, userRole, birthDate, gender, verificationCode]);

  // 处理“下一步”按钮点击 - 只验证步骤1的非验证码字段
  const handleNext = useCallback(() => {
    let valid = true;
    const newErrors = { ...errors };

    // 只验证手机号
    if (!phoneNumber) { newErrors.phoneNumber = "手机号是必填项"; valid = false; }
    else if (!/^1\d{10}$/.test(phoneNumber)) { newErrors.phoneNumber = "手机号格式不正确"; valid = false; }
    else { newErrors.phoneNumber = ""; }
    // 移除密码验证
    // if (!password) { ... }
    // if (!confirmPassword) { ... }
    // 清除验证码错误，因为此时不验证
    newErrors.verificationCode = "";

    setErrors(newErrors);
    if (valid) {
      setStep(2); // 如果步骤 1 有效，则移动到步骤 2
    }
    // 移除 password, confirmPassword 依赖
  }, [phoneNumber, errors]);

  // 处理“上一步”按钮点击
  const handleBack = () => {
    setStep(1); // 返回步骤 1
  };

  // 内部函数：实际执行注册 API 调用
  const performRegister = useCallback(async (registerGeetestResult: GeetestResult) => {
    // ... (格式化 birthDateString) ...
    const birthDateString = dayjs(birthDate).hour(12).minute(0).second(0).millisecond(0).utc().format('YYYY-MM-DDT12:00:00Z');

    console.log("准备注册:", { /* ... */ registerGeetestResult });
    setIsRegisterLoading(true);
    message.loading({ content: "正在注册", key: "register" });
    try {
      // 移除 password 参数
      const res = await RegisterAPI(
        phoneNumber,
        verificationCode,
        userRole,
        birthDateString,
        gender,
        // password, // 移除密码
        registerGeetestResult // 传递人机验证结果
      );
      console.log("RegisterAPI 响应:", res);
      if (res.status === 0 && res.code === "registrationSuccessful" && res.data?.jwt_token) {
        message.success({ content: res.message || "注册成功", key: "register" });
        console.log("注册成功，JWT Token:", res.data.jwt_token);

        // --- 开始处理登录逻辑 ---
        const token = res.data.jwt_token;
        let decodedPayload: DecodedToken | null = null;
        let username = "User"; // 默认值
        let role = "unknown"; // 默认值
        let expiryTimestamp = Date.now() + 3600 * 1000; // 默认1小时后过期

        try {
          // 解码 JWT Token
          decodedPayload = jwtDecode<DecodedToken>(token);
          console.log("Decoded Token (Register):", decodedPayload);

          // 从解码后的 payload 中获取信息
          username = decodedPayload['phone-number'] || username;
          role = decodedPayload.role || role;
          expiryTimestamp = decodedPayload.exp * 1000; // JWT exp 是秒，转为毫秒

          // 将解码后的用户信息存储到 localStorage
          localStorage.setItem('userInfo', JSON.stringify({
            id: decodedPayload.id,
            phone_number: decodedPayload['phone-number'],
            role: decodedPayload.role,
          }));
          localStorage.setItem('jwtToken', token);

        } catch (error) {
          console.error("解码 JWT Token 失败 (Register):", error);
          // 如果解码失败，可以考虑不自动登录或使用默认值
          // 清理可能存在的旧 localStorage 数据
          localStorage.removeItem('userInfo');
          localStorage.removeItem('jwtToken');
          // 可以选择显示错误消息或回退到登录页
          message.error({ content: "注册成功，但自动登录失败，请手动登录", key: "register", duration: 5 });
          navigator("/login"); // 回退到登录页
          return; // 提前退出函数
        }

        // 更新 Zustand store
        authLogin(
          username,
          token,
          role,
          expiryTimestamp,
        );

        console.log("注册成功并自动登录");
        navigator("/home", { replace: true }); // 跳转到主页
        // --- 结束处理登录逻辑 ---

      } else {
        // ... (处理注册失败的逻辑，与原来类似) ...
        let errorMsg = res.message || "注册失败";
        let shouldResetGeetest = false;
        if (res.code === "registrationFailedExpired" || res.code === "invalidSmsCode") {
          errorMsg = res.message || "验证码无效或已过期";
          setErrors(prev => ({ ...prev, verificationCode: "验证码无效或已过期" }));
          shouldResetGeetest = true; // 验证码相关错误，重置 Geetest
        } else if (res.code === "captchaFailed") {
          errorMsg = res.message || "人机验证失败";
          shouldResetGeetest = true; // Geetest 失败，重置
        }
        // 可以根据后端返回的其他 code 添加更多错误处理
        message.error({ content: errorMsg, key: "register" });
        if (shouldResetGeetest) {
          console.log("注册失败，重置 Geetest 状态");
          setLastGeetestResult(null);
        }
      }
    } catch (error: any) {
      message.error({ content: error.message || "注册请求失败", key: "register" });
      console.error("注册错误:", error);
      console.log("注册请求错误，重置 Geetest 状态");
      setLastGeetestResult(null); // 请求错误也重置
    } finally {
      setIsRegisterLoading(false);
    }
    // 添加 authLogin 依赖
  }, [phoneNumber, verificationCode, userRole, birthDate, gender, navigator, authLogin]);

  // 更新的 onSubmit 函数（仅在步骤 2 中调用）
  const onSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    // 验证所有字段（包括步骤1和步骤2）并确保已勾选政策
    if (!validateForm() || !isPolicyChecked) {
      if (!isPolicyChecked) {
        message.warning("请先阅读并同意用户协议和隐私政策");
      }
      return;
    }
    // 确保 birthDate 不为 null
    if (!birthDate) {
      setErrors(prev => ({ ...prev, birthDate: "请选择出生日期" }));
      return;
    }

    // 检查是否存在有效的 Geetest 结果
    if (lastGeetestResult) {
      console.log("复用上次的人机验证结果进行注册");
      await performRegister(lastGeetestResult);
    } else {
      // 如果没有，触发新的人机验证
      if (!isCaptchaReady) {
        message.error("人机验证组件未就绪，请稍候...");
        return;
      }
      console.log("为注册操作触发新的人机验证");
      setIsCheckingCaptcha(true); // 开始验证加载状态
      try {
        const geetestResult = await triggerCaptcha();
        console.log("新的人机验证成功 (for register):", geetestResult);
        setLastGeetestResult(geetestResult); // 存储新的结果
        await performRegister(geetestResult); // 使用新结果注册
      } catch (error: any) {
        console.error("注册人机验证错误:", error);
        message.error(error.message || "安全验证失败，请重试");
        setLastGeetestResult(null); // 验证出错，清除结果
      } finally {
        setIsCheckingCaptcha(false); // 结束验证加载状态
      }
    }
  }, [validateForm, isPolicyChecked, birthDate, lastGeetestResult, isCaptchaReady, triggerCaptcha, performRegister]); // 添加依赖

  // ... 现有的 handleUserAgreementOpen/Close 函数 ...
  const handleUserAgreementOpen = () => setIsUserAgreementOpen(true);
  const handleUserAgreementClose = () => setIsUserAgreementOpen(false);
  const handlePrivacyPolicyOpen = () => setIsPrivacyPolicyOpen(true);
  const handlePrivacyPolicyClose = () => setIsPrivacyPolicyOpen(false);

  // 更新的 handleSendCode 函数
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

    // 2. 触发人机验证 (用于状态检查)
    if (!isCaptchaReady) {
      message.error("人机验证组件未就绪，请稍候...");
      return;
    }
    setIsCheckingCaptcha(true); // 开始验证加载状态

    try {
      const geetestResult = await triggerCaptcha();
      console.log("人机验证成功 (for status check before send code):", geetestResult);

      // 3. 使用 geetestResult 调用 CheckRegisteredStatusAPI
      console.log("检查手机号注册状态...");
      const statusRes = await CheckRegisteredStatusAPI(phoneNumber, geetestResult);
      console.log("CheckRegisteredStatusAPI 响应 (Register):", statusRes);

      // 4. 根据状态检查结果决定是否发送验证码
      if (statusRes.status === 0 && statusRes.code === "phoneNotRegistered") {
        // 手机号未注册，可以发送验证码
        console.log("手机号未注册，准备发送验证码...");
        message.loading({ content: "正在发送验证码...", key: "send-code" });

        const smsRes = await AskCodeAPI(phoneNumber, geetestResult); // 使用相同的 geetestResult
        console.log("AskCodeAPI 响应 (Register):", smsRes);

        if (smsRes.status === 0) {
          message.success({ content: smsRes.message || "验证码发送成功", key: "send-code" });
          setIsCodeSent(true);
          setCodeTimer(60);
          setLastGeetestResult(geetestResult); // !! 存储成功的验证结果 !!
          console.log("验证码发送成功");
        } else {
          // AskCodeAPI 失败处理
          let errorMsg = smsRes.message || "验证码发送失败";
          let shouldResetGeetest = false;
          if (smsRes.code === "captchaFailed") { // AskCodeAPI 也可能返回 captchaFailed
            errorMsg = smsRes.message || "人机验证失败";
            shouldResetGeetest = true;
          }
          // ... 其他 AskCodeAPI 错误处理 ...
          message.error({ content: errorMsg, key: "send-code" });
          console.log("验证码发送失败:", errorMsg);
          setIsCodeSent(false);
          setCodeTimer(60);
          if (shouldResetGeetest) {
            setLastGeetestResult(null);
          }
        }
      } else if (statusRes.status === 0 && statusRes.code === "phoneRegistered") {
        // 手机号已注册
        message.error({ content: "该手机号已被注册", key: "send-code" });
        setErrors((prev) => ({ ...prev, phoneNumber: "该手机号已被注册" }));
        setLastGeetestResult(null); // 手机号无效，清除 geetest
      } else {
        // CheckRegisteredStatusAPI 失败处理 (例如 captchaFailed 或其他错误)
        let errorMsg = statusRes.message || "检查手机号状态失败";
        if (statusRes.code === "captchaFailed") {
          errorMsg = statusRes.message || "人机验证失败";
          setLastGeetestResult(null); // Geetest 失败，清除
        }
        message.error({ content: errorMsg, key: "send-code" });
        console.error("检查手机号状态失败:", errorMsg);
        // 根据情况决定是否清除 lastGeetestResult
      }

    } catch (error: any) {
      // 处理 triggerCaptcha, CheckRegisteredStatusAPI, AskCodeAPI 的网络错误等
      message.error({ content: error.message || "请求处理失败，请重试", key: "send-code" });
      console.error("发送验证码流程错误:", error);
      setIsCodeSent(false);
      setCodeTimer(60);
      // 网络错误等不一定意味着 Geetest 结果无效，暂时不清除
      // setLastGeetestResult(null);
    } finally {
      setIsCheckingCaptcha(false); // 结束验证加载状态
    }
  }, [phoneNumber, isCaptchaReady, triggerCaptcha]); // 依赖不变

  // ... 现有的 handleVerificationCodeChange 函数 ...
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

  // 计算按钮禁用状态
  const isSendCodeButtonDisabled = isCheckingCaptcha || isCodeSent || !!errors.phoneNumber;
  const isNextButtonDisabled = isCheckingCaptcha; // 下一步按钮在验证时禁用
  const isRegisterButtonDisabled = !isPolicyChecked || isRegisterLoading || isCheckingCaptcha; // 注册按钮在验证或注册时禁用

  return (
    <AuthContainer sx={{ position: 'relative' }}> {/* 确保 AuthContainer 是相对定位，以便绝对定位子元素 */}
      {/* 将返回按钮移到此处，定位在左上角 */}
      {!isTyping && (
        <IconButton
          aria-label="返回"
          onClick={() => (step === 1 ? navigator(-1) : handleBack())}
          sx={{
            position: 'absolute',
            top: 16, // 调整与顶部的间距
            left: 16, // 调整与左侧的间距
            zIndex: 10, // 如果需要，确保它在其他内容之上
            // color: 'primary.main', // 可选：设置颜色
          }}
        >
          <ArrowBackIosNewIcon />
        </IconButton>
      )}
      <AuthCard>
        {/* 从此处移除返回按钮 */}
        {/* <Box sx={{ position: 'relative', width: '100%' }}> ... </Box> */}
        <AuthHeader />

        {/* 步骤 1: 账号信息 */}
        {step === 1 && (
          <>
            <PhoneInput
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                // 当用户修改手机号时，清除手机号相关的错误提示
                if (errors.phoneNumber) {
                  setErrors(prev => ({ ...prev, phoneNumber: "" }));
                }
              }}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
            />
            {/* 移除密码输入框 */}
            {/* <PasswordInput id="password" ... /> */}
            {/* 移除确认密码输入框 */}
            {/* <PasswordInput id="confirm-password" ... /> */}
            {/* 验证码输入移到步骤 2 或保持在步骤 1，取决于 UI 设计 */}
            {/* 如果验证码在步骤 1，则保留 */}
            <VerificationCodeInput
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              onSendCode={handleSendCode}
              isCodeSent={isCodeSent}
              codeTimer={codeTimer}
              error={!!errors.verificationCode}
              helperText={errors.verificationCode}
              phoneError={errors.phoneNumber} // 传递手机错误以便禁用发送按钮（如果需要）
            // disabled={isCheckingCaptcha || isCodeSent} // 发送按钮在验证或已发送时禁用
            />
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              fullWidth // 使按钮宽度占满
              sx={{ mt: 2 }} // 添加上边距
              disabled={isNextButtonDisabled} // 应用禁用状态
            >
              {isCheckingCaptcha ? "验证中..." : "下一步"}
            </Button>
          </>
        )}

        {/* 步骤 2: 用户信息 */}
        {step === 2 && (
          <>
            {/* 如果验证码输入移到步骤 2，则放在这里 */}
            {/* 
            <VerificationCodeInput
              value={verificationCode}
              onChange={handleVerificationCodeChange}
              onSendCode={handleSendCode} // 可能需要调整逻辑或禁用此按钮
              isCodeSent={isCodeSent}
              codeTimer={codeTimer}
              error={!!errors.verificationCode}
              helperText={errors.verificationCode}
              phoneError={errors.phoneNumber}
            />
            */}
            <RoleSelect
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value as string);
                if (errors.userRole) setErrors(prev => ({ ...prev, userRole: "" }));
              }}
              error={!!errors.userRole}
              helperText={errors.userRole}
            />
            <BirthDatePicker
              value={birthDate}
              onChange={(date) => {
                setBirthDate(date);
                if (errors.birthDate) setErrors(prev => ({ ...prev, birthDate: "" }));
              }}
              error={!!errors.birthDate}
              helperText={errors.birthDate}
            />
            <GenderSelect
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                if (errors.gender) setErrors(prev => ({ ...prev, gender: "" }));
              }}
              error={!!errors.gender}
              helperText={errors.gender}
            />
            <PolicyCheckbox
              checked={isPolicyChecked}
              onChange={() => setIsPolicyChecked(!isPolicyChecked)}
              onUserAgreementOpen={handleUserAgreementOpen}
              onPrivacyPolicyOpen={handlePrivacyPolicyOpen}
            />
            {/* 保留注册按钮 */}
            <Button
              onClick={onSubmit} // 触发包含所有验证的 onSubmit
              variant="contained"
              size="large"
              disabled={isRegisterButtonDisabled} // 应用禁用状态
              fullWidth // 使按钮宽度占满
              sx={{ mt: 2 }} // 添加上边距
            >
              {isCheckingCaptcha ? "验证中..." : (isRegisterLoading ? "注册中..." : "注册")}
            </Button>
            {/* 返回按钮现在由外部的 IconButton 处理 */}
          </>
        )}

        {/* 登录链接 - 在两个步骤中都可见 */}
        {/* ... 现有的登录链接 ... */}
        <div className="flex-center" style={{ marginTop: '16px' }}> {/* 添加上边距 */}
          已有账号？
          <Link
            href="/login"
            underline="hover"
            onClick={(e) => {
              e.preventDefault();
              navigator("/login");
            }}
          >
            点我登录
          </Link>
        </div>
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
