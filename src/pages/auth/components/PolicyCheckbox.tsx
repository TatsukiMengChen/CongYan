import React from "react";
import {
  FormControl,
  FormControlLabel,
  Checkbox,
  Link,
} from "@mui/material";

interface PolicyCheckboxProps {
  checked: boolean;
  onChange: () => void;
  onUserAgreementOpen: () => void;
  onPrivacyPolicyOpen: () => void;
}

export const PolicyCheckbox: React.FC<PolicyCheckboxProps> = ({
  checked,
  onChange,
  onUserAgreementOpen,
  onPrivacyPolicyOpen,
}) => {
  return (
    <FormControl>
      <FormControlLabel
        control={<Checkbox checked={checked} onChange={onChange} />}
        label={
          <span className="text-sm">
            我已阅读并同意
            <Link
              href="#"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                onUserAgreementOpen();
              }}
            >
              《用户协议》
            </Link>
            和
            <Link
              href="#"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                onPrivacyPolicyOpen();
              }}
            >
              《隐私政策》
            </Link>
          </span>
        }
        style={{ justifyContent: "center" }}
      />
    </FormControl>
  );
};
