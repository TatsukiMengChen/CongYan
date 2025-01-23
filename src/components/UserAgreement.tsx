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

interface UserAgreementProps {
  open: boolean;
  onClose: () => void;
}

const UserAgreement: React.FC<UserAgreementProps> = ({ open, onClose }) => {
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
            用户协议
          </Typography>
        </Toolbar>
      </AppBar>
      <div className="px-4">
        <p>
          <i>聪言APP开发团队</i>
          （以下简称“我们”）依据本协议为用户（以下简称“你”）提供<i>聪言</i>
          服务。本协议对你和我们均具有法律约束力。
        </p>

        <section>
          <h4>一、本服务的功能</h4>
          <p>
            <b>产品定位：</b>
            “聪言”是一款专为发音障碍用户（如脑瘫患者、声带受损患者、听力障碍康复者等）设计的医学AI辅助应用，旨在通过智能技术帮助用户改善发音能力，提升交流效率，并为康复训练提供科学指导。
          </p>
          <p>
            <b>核心功能：</b>
          </p>
          <ul>
            <li>
              <b>发音评估与诊断</b>
              <ul>
                <li>
                  智能语音分析：通过先进的AI语音识别技术，实时分析用户的发音特点，精准识别发音问题（如音调异常、音素缺失、发音不清晰等）。
                </li>
                <li>
                  多维度评估报告：生成详细的发音评估报告，包括发音准确性、流畅性、语调等方面的数据分析，帮助用户和康复师了解发音障碍的具体情况。
                </li>
                <li>
                  医学诊断辅助：结合医学知识库，为用户提供发音障碍的初步诊断建议，并推荐相应的康复方向。
                </li>
              </ul>
            </li>
            <li>
              <b>个性化发音训练</b>
              <ul>
                <li>
                  定制训练计划：根据用户的发音评估结果，AI智能生成个性化的发音训练计划，包括训练目标、训练内容和训练周期。
                </li>
                <li>
                  多样化训练模块：提供丰富的发音练习材料，涵盖基础音素练习、词汇发音练习、日常对话模拟等，满足不同用户的需求。
                </li>
                <li>
                  实时反馈与指导：在用户练习过程中，AI实时提供发音反馈，指出问题并给出纠正建议，帮助用户逐步改善发音。
                </li>
              </ul>
            </li>
            <li>
              <b>语音合成与辅助交流</b>
              <ul>
                <li>
                  文字转语音功能：用户可通过文字输入，由AI生成清晰、自然的语音输出，帮助发音障碍用户更轻松地与他人交流。
                </li>
                <li>
                  语音语调调整：支持用户根据自身需求调整语音的语速、语调和音量，使交流更加自然流畅。
                </li>
                <li>
                  交流辅助工具：提供语音消息录制、发送功能，方便用户在社交软件中使用，减少沟通障碍。
                </li>
              </ul>
            </li>
            <li>
              <b>医学康复指导</b>
              <ul>
                <li>
                  康复知识库：内置丰富的发音障碍康复知识，包括病因分析、康复方法、日常护理建议等，帮助用户和家属更好地了解病情。
                </li>
                <li>
                  康复进度跟踪：记录用户的训练数据和发音改善情况，生成康复进度曲线，让用户清晰看到自己的进步。
                </li>
                <li>
                  专业咨询入口：用户可通过APP直接联系专业康复师或语音治疗师，获取更详细的康复建议和远程指导。
                </li>
              </ul>
            </li>
            <li>
              <b>数据管理与隐私保护</b>
              <ul>
                <li>
                  训练数据存储：自动保存用户的发音练习数据、评估报告和康复进度，方便用户随时查看历史记录。
                </li>
                <li>
                  隐私保护：严格遵守隐私政策，确保用户的个人信息和语音数据安全，不泄露用户隐私。
                </li>
              </ul>
            </li>
            <li>
              <b>产品优势</b>
              <ul>
                <li>
                  专业性：结合医学知识与AI技术，为发音障碍用户提供科学、精准的康复支持。
                </li>
                <li>
                  个性化：根据用户的具体情况生成定制化训练方案，满足不同用户的康复需求。
                </li>
                <li>
                  便捷性：随时随地通过手机进行发音练习和交流辅助，无需专业设备。
                </li>
                <li>
                  互动性：通过社区交流和家庭互动功能，增加用户粘性，提升康复积极性。
                </li>
              </ul>
            </li>
            <li>
              <b>目标用户</b>
              <ul>
                <li>脑瘫患者</li>
                <li>声带受损患者</li>
                <li>听力障碍康复者</li>
                <li>语言发育迟缓儿童</li>
                <li>其他发音障碍人群</li>
              </ul>
            </li>
          </ul>
        </section>

        <section>
          <h4>二、责任范围及限制</h4>
          <p>你使用本服务得到的结果仅供参考，实际情况以官方为准。</p>
        </section>

        <section>
          <h4>三、隐私保护</h4>
          <p>
            我们重视对你隐私的保护，你的个人隐私信息将根据《隐私政策》受到保护与规范，详情请参阅《隐私政策》。
          </p>
        </section>

        <section>
          <h4>四、其他条款</h4>
          <p>
            4.1
            本协议所有条款的标题仅为阅读方便，本身并无实际涵义，不能作为本协议涵义解释的依据。
          </p>
          <p>
            4.2
            本协议条款无论因何种原因部分无效或不可执行，其余条款仍有效，对双方具有约束力。
          </p>
        </section>
      </div>
    </Dialog>
  );
};

export default UserAgreement;
