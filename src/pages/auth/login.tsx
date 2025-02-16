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
import { message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router";
import { LoginAPI } from "../../api/auth";
import PrivacyPolicy from "../../components/PrivacyPolicy";
import TextField from "../../components/TextField";
import UserAgreement from "../../components/UserAgreement";
import useAuthStore from "../../store/auth";
import { AuthCard } from "./components/AuthCard";
import { AuthContainer } from "./components/AuthContainer";

export const LoginPage = () => {
  const { login: authLogin } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isPolicyChecked, setIsPolicyChecked] = useState(false);
  const [errors, setErrors] = useState({ account: "", password: "" });
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const navigator = useNavigate();

  const validateForm = () => {
    let valid = true;
    const newErrors = { account: "", password: "" };

    if (!account) {
      newErrors.account = "邮箱/用户名是必填项";
      valid = false;
    }

    if (!password) {
      newErrors.password = "密码是必填项";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (validateForm()) {
      console.log({ account, password });
      setIsLoginLoading(true);
      message.loading({ content: "登录中...", key: "login" });
      LoginAPI(account, password)
        .then((res) => {
          console.log(res);
          if (res.code === 200) {
            message.success({ content: "登录成功", key: "login" });
            const timestamp = new Date(res.data.expire).getTime();
            authLogin(
              res.data.username,
              res.data.token,
              res.data.role,
              timestamp,
            );
            console.log("登录成功");
            navigator("/home", { replace: true });
          } else {
            message.error({ content: res.message, key: "login" });
            console.log(res.message);
          }
        })
        .finally(() => {
          setIsLoginLoading(false);
        });
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

  return (
    <AuthContainer>
      <AuthCard>
        <div className="flex-center gap-2">
          <img className="w-20" src="/logo.png" alt="logo" />
          <h1>聪言</h1>
        </div>
        <FormControl error={!!errors.account}>
          <TextField
            id="account"
            label="邮箱/用户名"
            variant="outlined"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            error={!!errors.account}
            helperText={errors.account}
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
          loading={isLoginLoading}
        >
          登录
        </Button>
        <div className="flex-center">
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
