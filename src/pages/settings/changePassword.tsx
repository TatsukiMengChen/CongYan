import Button from "@mui/material/Button";
import { message } from "antd";
import { NavBar } from "antd-mobile"; // 重新导入 NavBar
import { useState } from "react";
import { useNavigate } from "react-router";
import { ChangePasswordAPI } from "../../api/auth"; // 确认 API 路径
import { AuthCard } from "../auth/components/AuthCard";
import { AuthContainer } from "../auth/components/AuthContainer";
import { PasswordInput } from "../auth/components/PasswordInput"; // 复用密码输入组件
import { AuthHeader } from "../auth/components/AuthHeader";
import useAuthStore from "../../store/auth";

export const ChangePasswordPage = () => {
  const navigator = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ newPassword: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    let valid = true;
    const newErrors = { newPassword: "", confirmPassword: "" };

    // 密码复杂度校验 (示例：至少6位)
    if (!newPassword) {
      newErrors.newPassword = "新密码是必填项";
      valid = false;
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "密码长度至少为6位";
      valid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "确认密码是必填项";
      valid = false;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "两次输入的密码不一致";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleChangePassword = () => {
    if (validateForm()) {
      setIsLoading(true);
      message.loading({ content: "正在修改密码...", key: "change-password" });

      ChangePasswordAPI(newPassword)
        .then((res) => {
          if (res.status === 0) {
            message.success({ content: res.message || "密码修改成功", key: "change-password" });
            // 提示用户需要重新登录
            message.info("密码已修改，请重新登录", 3, () => {
              // 这里可以添加登出逻辑
              useAuthStore.getState().logout(); // 如果需要强制登出
              navigator("/login", { replace: true }); // 跳转到登录页
            });
          } else {
            message.error({ content: res.message || "密码修改失败", key: "change-password" });
          }
        })
        .catch((err) => {
          message.error({ content: err.message || "修改密码请求失败", key: "change-password" });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    // 使用 div 包裹 NavBar 和 AuthContainer
    <div className="h-full flex flex-col">
      {/* 添加 NavBar */}
      <NavBar onBack={() => navigator(-1)}>修改密码</NavBar>
      {/* AuthContainer 现在填充剩余空间 */}
      <AuthContainer>
        {/* 使用 AuthCard 包裹内容 */}
        <AuthCard>
          <AuthHeader />
          <PasswordInput
            id="new-password"
            label="新密码"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (errors.newPassword) setErrors(prev => ({ ...prev, newPassword: "" }));
            }}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
          />
          <PasswordInput
            id="confirm-password"
            label="确认新密码"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: "" }));
            }}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
          />
          <Button
            onClick={handleChangePassword}
            variant="contained"
            size="large"
            disabled={isLoading}
            fullWidth
          >
            {isLoading ? "正在提交..." : "确认修改"}
          </Button>
        </AuthCard>
      </AuthContainer>
    </div>
  );
};
