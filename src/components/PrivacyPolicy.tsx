import AppBar from "@mui/material/AppBar";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Toolbar from "@mui/material/Toolbar";

import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import { TransitionProps } from "@mui/material/transitions";
import Typography from "@mui/material/Typography";
import React from "react";

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<
      unknown,
      string | React.JSXElementConstructor<React.ComponentType>
    >;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PrivacyPolicyProps {
  open: boolean;
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ open, onClose }) => {
  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "sticky", top: 0 }} color="inherit">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
            隐私政策
          </Typography>
        </Toolbar>
      </AppBar>
      <div className="px-4">
        <p>
          欢迎使用聪言APP（以下简称“本应用”）。我们深知隐私对你的重要性，因此致力于保护你的个人隐私信息。本隐私政策旨在向你清晰说明我们如何收集、使用、存储、共享和保护你的个人信息，以及你如何控制和管理这些信息。通过使用本应用，你同意本隐私政策的条款，并同意我们按照本政策处理你的个人信息。
        </p>

        <h2>一、信息收集</h2>
        <h3>（一）个人信息的收集</h3>
        <ol>
          <li>
            <strong>注册与登录信息：</strong>
            当你注册或登录本应用时，我们可能会收集你的用户名、密码、邮箱地址、手机号码等信息，以便为你创建账户并提供服务。
          </li>
          <li>
            <strong>用户资料信息：</strong>
            你可以在本应用中填写个人资料，如姓名、性别、年龄、健康状况等。这些信息有助于我们为你提供更个性化的服务，但你有权选择是否提供这些信息。
          </li>
          <li>
            <strong>语音数据：</strong>
            为了实现发音评估、诊断和训练等功能，我们会收集你在使用本应用时产生的语音数据。这些数据将用于分析你的发音特点、生成评估报告以及提供个性化训练建议。
          </li>
        </ol>

        <h3>（二）非个人信息的收集</h3>
        <ol>
          <li>
            <strong>设备信息：</strong>
            我们可能会收集你的设备型号、操作系统版本、设备标识符等信息，以便优化本应用的性能和用户体验。
          </li>
          <li>
            <strong>使用信息：</strong>
            我们会收集你使用本应用的时间、频率、功能使用情况等信息，以了解用户需求，改进我们的服务。
          </li>
        </ol>

        <h2>二、信息使用</h2>
        <h3>（一）提供服务</h3>
        <p>
          我们收集的信息将用于为你提供本应用的各项功能和服务，包括发音评估、个性化训练、语音合成与辅助交流等。
        </p>

        <h3>（二）改进服务</h3>
        <p>
          我们可能会使用收集的信息来分析用户行为，优化应用性能，提升用户体验，并开发新的功能和服务。
        </p>

        <h2>三、信息存储</h2>
        <p>
          我们会在服务器上安全存储你的个人信息和语音数据，并采取加密等技术措施保护数据安全。我们不会将你的数据存储超过必要的期限。
        </p>

        <h2>四、信息共享</h2>
        <p>我们不会将你的个人信息共享给第三方，除非：</p>
        <ul>
          <li>获得你的明确同意；</li>
          <li>根据法律法规要求或为保护用户权益；</li>
          <li>与服务提供商合作，但仅限于其为提供服务所必需的信息。</li>
        </ul>

        <h2>五、隐私保护</h2>
        <p>
          我们高度重视你的隐私保护，采取严格的安全措施防止数据泄露、篡改或丢失。我们不会在未经授权的情况下访问或使用你的个人信息。
        </p>

        <h2>六、用户权利</h2>
        <p>
          你有权访问、更正或删除你的个人信息。如需行使这些权利，请通过本应用内的联系方式与我们联系。
        </p>

        <h2>七、其他</h2>
        <p>
          本隐私政策可能会根据法律法规变化或业务调整进行更新。我们建议你定期查看本隐私政策的最新版本。
        </p>

        <h2>八、联系我们</h2>
        <p>如果你对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
        <ul>
          <li>邮箱：support@mimeng.top</li>
        </ul>
      </div>
    </Dialog>
  );
};

export default PrivacyPolicy;
