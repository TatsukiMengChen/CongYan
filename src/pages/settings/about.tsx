import { NavBar } from "antd-mobile";
import { useNavigate } from "react-router";
import { OptionButton } from "../../components/OptionButton";
import { ScrollView } from "../../components/ScrollView";
import UserAgreement from "../../components/UserAgreement";
import PrivacyPolicy from "../../components/PrivacyPolicy"; // Import PrivacyPolicy component
import { useState } from "react";
import Link from "@mui/material/Link";

export const AboutSettingsPage = () => {
  const navigator = useNavigate();
  const [isUserAgreementOpen, setIsUserAgreementOpen] = useState(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false); // Add state for PrivacyPolicy

  return (
    <div className="h-full flex flex-col">
      <NavBar onBack={() => navigator(-1)}>关于</NavBar>
      <ScrollView>
        <div className="mt-8 flex-center">
          <img className="w-20" src="/logo.png" alt="logo" />
        </div>
        <div className="mb-8 text-center">
          <h2 className="mb-0">聪言</h2>
          版本：V 0.1.0
        </div>
        <OptionButton title="检查更新" />
        <OptionButton
          title="用户协议"
          onClick={() => setIsUserAgreementOpen(true)}
        />
        <OptionButton
          title="隐私政策"
          onClick={() => setIsPrivacyPolicyOpen(true)}
        />
        <div className="absolute bottom-0 w-full flex-center flex-col py-2 text-3">
          <Link
            href="https://beian.miit.gov.cn"
            color="textSecondary"
            underline="none"
            target="_blank"
          >
            ICP备案号： XXX-XXX-XXX
          </Link>
          <div>Copyright © 2025 南昌大学聪言项目组</div>
        </div>
      </ScrollView>
      <div className="h-60px w-full"></div>
      <UserAgreement
        open={isUserAgreementOpen}
        onClose={() => setIsUserAgreementOpen(false)}
      />
      <PrivacyPolicy
        open={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />
    </div>
  );
};
