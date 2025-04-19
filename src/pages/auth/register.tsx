import Button from "@mui/material/Button";
import { useEffect, useState } from "react";
// ... 其他导入 ...
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import { message } from "antd";
import { useNavigate } from "react-router";
// 导入更新后的 API 函数
import { AskCodeAPI, RegisterAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import UserAgreement from "../../components/UserAgreement";
import useInputStore from "../../store/input";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";
// 导入新的和更新的组件
import { Dayjs } from "dayjs";
import { AuthHeader } from "./components/AuthHeader";
import { BirthDatePicker } from "./components/BirthDatePicker";
import { GenderSelect } from "./components/GenderSelect";
import { PasswordInput } from "./components/PasswordInput";
import { PhoneInput } from "./components/PhoneInput";
import { PolicyCheckbox } from "./components/PolicyCheckbox";
import { RoleSelect } from "./components/RoleSelect";
import { VerificationCodeInput } from "./components/VerificationCodeInput";
// 如果步骤之间不再使用，则移除 Divider 和 Typography
// import Divider from "@mui/material/Divider";
// import Typography from "@mui/material/Typography";

export const RegisterPage = () => {
  // ... existing state variables ...
  const { input: isTyping } = useInputStore();
  const [step, setStep] = useState(1); // 添加步骤状态，默认为 1
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [userRole, setUserRole] = useState("");
  const [birthDate, setBirthDate] = useState<Dayjs | null>(null);
  const [gender, setGender] = useState("");
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  // 确保 errors 状态覆盖所有字段
  const [errors, setErrors] = useState({
    phoneNumber: "",
    password: "",
    confirmPassword: "",
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
  const navigator = useNavigate();


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
  const validateForm = () => {
    // 首先，确保步骤 1 的字段有效（如果 handleNext 已经验证过，可能冗余）
    // 注意：注册时不再需要验证步骤1的验证码，因为验证码用于注册本身
    let step1Valid = true;
    const step1Errors = { ...errors };
    // 仅验证步骤1的手机号、密码、确认密码
    if (!phoneNumber) { step1Errors.phoneNumber = "手机号是必填项"; step1Valid = false; }
    else if (!/^1\d{10}$/.test(phoneNumber)) { step1Errors.phoneNumber = "手机号格式不正确"; step1Valid = false; }
    else { step1Errors.phoneNumber = ""; }
    if (!password) { step1Errors.password = "密码是必填项"; step1Valid = false; }
    else if (password.length < 6 || password.length > 20) { step1Errors.password = "密码长度应在6到20个字符之间"; step1Valid = false; }
    else { step1Errors.password = ""; }
    if (!confirmPassword) { step1Errors.confirmPassword = "请确认密码"; step1Valid = false; }
    else if (password !== confirmPassword) { step1Errors.confirmPassword = "两次输入的密码不匹配"; step1Valid = false; }
    else { step1Errors.confirmPassword = ""; }
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
  };


  // 处理“下一步”按钮点击 - 只验证步骤1的非验证码字段
  const handleNext = () => {
    let valid = true;
    const newErrors = { ...errors };

    if (!phoneNumber) { newErrors.phoneNumber = "手机号是必填项"; valid = false; }
    else if (!/^1\d{10}$/.test(phoneNumber)) { newErrors.phoneNumber = "手机号格式不正确"; valid = false; }
    else { newErrors.phoneNumber = ""; }
    if (!password) { newErrors.password = "密码是必填项"; valid = false; }
    else if (password.length < 6 || password.length > 20) { newErrors.password = "密码长度应在6到20个字符之间"; valid = false; }
    else { newErrors.password = ""; }
    if (!confirmPassword) { newErrors.confirmPassword = "请确认密码"; valid = false; }
    else if (password !== confirmPassword) { newErrors.confirmPassword = "两次输入的密码不匹配"; valid = false; }
    else { newErrors.confirmPassword = ""; }
    // 清除验证码错误，因为此时不验证
    newErrors.verificationCode = "";

    setErrors(newErrors);
    if (valid) {
      setStep(2); // 如果步骤 1 有效，则移动到步骤 2
    }
  };

  // 处理“上一步”按钮点击
  const handleBack = () => {
    setStep(1); // 返回步骤 1
  };


  // 更新的 onSubmit 函数（仅在步骤 2 中调用）
  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // 验证所有字段（包括步骤1和步骤2）并确保已勾选政策
    if (validateForm() && isPolicyChecked) {
      // 确保 birthDate 不为 null
      if (!birthDate) {
        setErrors(prev => ({ ...prev, birthDate: "请选择出生日期" }));
        return;
      }
      const birthDateString = birthDate.toISOString(); // 直接使用 ISO 字符串

      console.log("准备注册:", {
        phone_number: phoneNumber,
        sms_code: verificationCode,
        user_role: userRole,
        birth_date: birthDateString,
        gender: gender,
        password: password, // 传递密码
      });
      setIsRegisterLoading(true);
      message.loading({ content: "正在注册", key: "register" });
      RegisterAPI(
        phoneNumber,
        verificationCode,
        userRole,
        birthDateString,
        gender,
        password, // 传递密码给 API
      )
        .then((res) => {
          console.log("RegisterAPI 响应:", res);
          // 使用后端返回的 code 进行判断
          if (res.status === 0 && res.code === "registrationSuccessful") {
            message.success({ content: res.message || "注册成功", key: "register" });
            // 可以在这里处理 JWT token，例如存储到 localStorage 或状态管理
            console.log("注册成功，JWT Token:", res.data?.jwt_token);
            navigator("/login"); // 跳转到登录页
          } else {
            // 处理不同的失败情况
            let errorMsg = res.message || "注册失败";
            if (res.code === "registrationFailedExpired") {
              errorMsg = "注册失败，验证码可能已过期或无效";
              setErrors(prev => ({ ...prev, verificationCode: "验证码无效或已过期" }));
            } else if (res.code === "invalidSmsCode") { // 假设后端有这个 code
              errorMsg = "验证码错误";
              setErrors(prev => ({ ...prev, verificationCode: "验证码错误" }));
            }
            // 可以根据后端返回的其他 code 添加更多错误处理
            message.error({ content: errorMsg, key: "register" });
          }
        })
        .catch((error) => {
          // 处理网络错误或其他未捕获的异常
          message.error({ content: error.message || "注册请求失败", key: "register" });
          console.error("注册错误:", error);
        })
        .finally(() => {
          setIsRegisterLoading(false);
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

  // 更新的 handleSendCode 函数
  const handleSendCode = () => {
    // 发送验证码前验证手机号
    if (!phoneNumber) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号是必填项" }));
      return;
    }
    if (!/^1\d{10}$/.test(phoneNumber)) {
      setErrors((prev) => ({ ...prev, phoneNumber: "手机号格式不正确" }));
      return;
    }
    // 如果验证通过，清除手机号错误
    setErrors((prev) => ({ ...prev, phoneNumber: "" }));

    message.loading({ content: "正在检查手机号并发送验证码...", key: "send-code" });
    // 注意：不在此时设置 setIsCodeSent(true)，等待 API 调用成功后再设置

    AskCodeAPI(phoneNumber, "register") // 调用更新后的 API
      .then((res) => {
        console.log("AskCodeAPI 响应:", res);
        // 检查 API 返回的状态和 code
        if (res.status === 0) { // 假设 status 0 且没有特定错误 code 表示成功发送
          message.success({ content: res.message || "验证码发送成功", key: "send-code" });
          setIsCodeSent(true); // 验证码发送成功，开始计时
          setCodeTimer(60); // 重置计时器为 60 秒
          console.log("验证码发送成功");
        } else {
          // 处理特定错误，例如手机号已注册
          let errorMsg = res.message || "验证码发送失败";
          if (res.code === "phoneRegistered") {
            errorMsg = "该手机号已被注册";
            setErrors((prev) => ({ ...prev, phoneNumber: errorMsg })); // 在手机号字段显示错误
          } else if (res.code === "statusCheckFailed") {
            errorMsg = "检查手机号状态失败，请稍后重试";
          }
          // 可以根据后端返回的其他 code 添加更多错误处理
          message.error({ content: errorMsg, key: "send-code" });
          console.log("验证码发送失败:", errorMsg);
          // 发送失败，不启动计时器，确保按钮可用
          setIsCodeSent(false);
          setCodeTimer(60);
        }
      })
      .catch((error) => {
        // 处理网络错误或其他未捕获的异常
        message.error({ content: error.message || "验证码发送请求失败", key: "send-code" });
        console.error("发送验证码错误:", error);
        // 网络错误时重置按钮和计时器
        setIsCodeSent(false);
        setCodeTimer(60);
      });
  };


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
            <PasswordInput
              id="password"
              label="密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: "" }));
                // 如果确认密码有错误（通常是因为不匹配），也清除它，让用户重新确认
                if (errors.confirmPassword === "两次输入的密码不匹配") setErrors(prev => ({ ...prev, confirmPassword: "" }));
              }}
              error={!!errors.password}
              helperText={errors.password}
            />
            <PasswordInput
              id="confirm-password"
              label="确认密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
              }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />
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
            />
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              fullWidth // 使按钮宽度占满
              sx={{ mt: 2 }} // 添加上边距
            >
              下一步
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
              disabled={!isPolicyChecked || isRegisterLoading}
              fullWidth // 使按钮宽度占满
              sx={{ mt: 2 }} // 添加上边距
            >
              {isRegisterLoading ? "注册中..." : "注册"}
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
