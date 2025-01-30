import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { Checkbox, FormControl, FormControlLabel } from "@mui/material";
import Button from "@mui/material/Button";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import TextField from "@mui/material/TextField";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AskCodeAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import UserAgreement from "../../components/UserAgreement";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";

export const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    verificationCode: "",
  });
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [codeTimer, setCodeTimer] = useState(60);
  const navigator = useNavigate();

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

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      verificationCode: "",
    };

    if (!email) {
      newErrors.email = "邮箱是必填项";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "邮箱格式不正确";
      valid = false;
    }

    if (!username) {
      newErrors.username = "用户名是必填项";
      valid = false;
    }

    if (!password) {
      newErrors.password = "密码是必填项";
      valid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "密码不匹配";
      valid = false;
    }
    if (username.length < 1 || username.length > 10) {
      newErrors.username = "用户名长度应在1到10个字符之间";
      valid = false;
    } else if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(username)) {
      newErrors.username = "用户名只能包含字母、数字和汉字";
      valid = false;
    }

    if (password.length < 6 || password.length > 20) {
      newErrors.password = "密码长度应在6到20个字符之间";
      valid = false;
    } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/.test(password)) {
      newErrors.password = "密码必须包含字母和数字";
      valid = false;
    }

    if (!verificationCode) {
      newErrors.verificationCode = "验证码是必填项";
      valid = false;
    } else if (verificationCode.length !== 6) {
      newErrors.verificationCode = "验证码必须是6位";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      console.log({ email, username, password, verificationCode });
      setIsRegisterLoading(true);
      message.loading({ content: "正在注册", key: "register" });
    }
  };

  const handleUserAgreementOpen = () => {
    setIsUserAgreementOpen(true);
  };

  const handleUserAgreementClose = () => {
    setIsUserAgreementOpen(false);
  };

  const handlePrivacyPolicyOpen = () => {
    setIsPrivacyPolicyOpen(true);
  };

  const handlePrivacyPolicyClose = () => {
    setIsPrivacyPolicyOpen(false);
  };

  const handleSendCode = () => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: "邮箱是必填项" }));
      return;
    }
    message.loading({ content: "发送中...", key: "send-code" });
    setIsCodeSent(true);
    AskCodeAPI(email, "register")
      .then((res) => {
        if (res.code === 200) {
          message.success({ content: "验证码发送成功", key: "send-code" });
          console.log("验证码发送成功");
        } else {
          message.error({ content: "验证码发送失败", key: "send-code" });
          console.log("验证码发送失败");
        }
      })
      .catch((error) => {
        message.error({ content: "验证码发送失败", key: "send-code" });
        console.log(error);
      });
  };

  return (
    <AuthContainer>
      <IconButton
        style={{
          position: "fixed",
          bottom: 16,
          left: "50%",
          transform: "translateX(-50%)",
        }}
        size="large"
        color="primary"
        onClick={() => navigator(-1)}
      >
        <ArrowBackIosNewIcon />
      </IconButton>
      <AuthCard>
        <div className="flex-center gap-2">
          <img className="w-20" src="/logo.png" alt="logo" />
          <h1>聪言</h1>
        </div>
        <FormControl error={!!errors.email}>
          <TextField
            id="email"
            label="邮箱"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
          />
        </FormControl>
        <FormControl error={!!errors.username}>
          <TextField
            id="username"
            label="用户名"
            variant="outlined"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={!!errors.username}
            helperText={errors.username}
          />
        </FormControl>
        <FormControl error={!!errors.password}>
          <InputLabel htmlFor="outlined-adornment-password">密码</InputLabel>
          <OutlinedInput
            id="password"
            label="密码"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!errors.password}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? (
                    <VisibilityOutlinedIcon />
                  ) : (
                    <VisibilityOffOutlinedIcon />
                  )}
                </IconButton>
              </InputAdornment>
            }
          />
          {errors.password && (
            <FormHelperText error>{errors.password}</FormHelperText>
          )}
        </FormControl>
        <FormControl error={!!errors.confirmPassword}>
          <InputLabel htmlFor="outlined-adornment-confirm-password">
            确认密码
          </InputLabel>
          <OutlinedInput
            id="confirm-password"
            label="确认密码"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={!!errors.confirmPassword}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  edge="end"
                >
                  {showConfirmPassword ? (
                    <VisibilityOutlinedIcon />
                  ) : (
                    <VisibilityOffOutlinedIcon />
                  )}
                </IconButton>
              </InputAdornment>
            }
          />
          {errors.confirmPassword && (
            <FormHelperText error>{errors.confirmPassword}</FormHelperText>
          )}
        </FormControl>

        <FormControl error={!!errors.verificationCode}>
          <InputLabel htmlFor="outlined-adornment-verification-code">
            验证码
          </InputLabel>
          <OutlinedInput
            id="verification-code"
            label="验证码"
            type="text"
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d*$/.test(value) && value.length <= 6) {
                setVerificationCode(value);
              }
            }}
            error={!!errors.verificationCode}
            endAdornment={
              <InputAdornment position="end">
                <Button
                  onClick={handleSendCode}
                  variant="contained"
                  size="small"
                  disabled={isCodeSent}
                >
                  {isCodeSent ? `${codeTimer}s` : "获取验证码"}
                </Button>
              </InputAdornment>
            }
            inputProps={{ maxLength: 6 }}
          />
          {errors.verificationCode && (
            <FormHelperText error>{errors.verificationCode}</FormHelperText>
          )}
        </FormControl>
        <FormControl>
          <FormControlLabel
            control={
              <Checkbox
                checked={isPolicyChecked}
                onChange={() => setIsPolicyChecked(!isPolicyChecked)}
              />
            }
            label={
              <span className="text-sm">
                我已阅读并同意
                <Link
                  href="/terms-of-service"
                  underline="hover"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    handleUserAgreementOpen();
                  }}
                >
                  《用户协议》
                </Link>
                和
                <Link
                  href="/privacy-policy"
                  underline="hover"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePrivacyPolicyOpen();
                  }}
                >
                  《隐私政策》
                </Link>
              </span>
            }
            style={{ justifyContent: "center" }}
          />
        </FormControl>
        <Button
          onClick={onSubmit}
          variant="contained"
          size="large"
          disabled={!isPolicyChecked}
          loading={isRegisterLoading}
        >
          注册
        </Button>
        <div className="flex-center">
          已有账号？
          <Link
            href="/login"
            underline="hover"
            onClick={(e) => {
              e.preventDefault();
              navigator(-1);
            }}
          >
            点我登录
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
