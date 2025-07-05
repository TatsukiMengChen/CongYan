import React from "react";
import { Card, Tabs, Typography, Space } from "antd";
import {
  MessageOutlined,
  PictureOutlined,
  ScanOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import ChatSection from "./components/ChatSection";
import DrawSection from "./components/DrawSection";
import OcrSection from "./components/OcrSection";
import TtsSection from "./components/TtsSection";
import "./index.module.scss";

const { Title, Paragraph } = Typography;

/**
 * Vivo AIGC 功能展示页面
 * 包含大模型对话、AI绘画、OCR识别、TTS语音合成等功能
 */
const VivoAigcPage: React.FC = () => {
  const tabItems = [
    {
      key: "chat",
      label: (
        <span className="flex items-center gap-2">
          <MessageOutlined />
          大模型对话
        </span>
      ),
      children: <ChatSection />,
    },
    {
      key: "draw",
      label: (
        <span className="flex items-center gap-2">
          <PictureOutlined />
          AI绘画
        </span>
      ),
      children: <DrawSection />,
    },
    {
      key: "ocr",
      label: (
        <span className="flex items-center gap-2">
          <ScanOutlined />
          OCR识别
        </span>
      ),
      children: <OcrSection />,
    },
    {
      key: "tts",
      label: (
        <span className="flex items-center gap-2">
          <SoundOutlined />
          TTS语音合成
        </span>
      ),
      children: <TtsSection />,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 vivo-aigc-page">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8 p-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white page-header">
          <Space direction="vertical" size="small">
            <Title level={2} className="!text-white !mb-2">
              Vivo AIGC API 功能展示
            </Title>
            <Paragraph className="!text-blue-100 !mb-0">
              基于 Vivo AIGC 官方 API
              的完整功能演示，包含大模型对话、AI绘画、OCR识别和TTS语音合成等功能
            </Paragraph>
          </Space>
        </div>

        {/* 主要内容 */}
        <Card className="shadow-lg rounded-xl border-0 h-[calc(100vh-200px)] main-content">
          <Tabs
            defaultActiveKey="chat"
            items={tabItems.map((item) => ({
              ...item,
              children: (
                <div className="h-[calc(100vh-300px)] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                  <div className="pr-2">{item.children}</div>
                </div>
              ),
            }))}
            size="large"
            tabPosition="top"
            animated={{ inkBar: true, tabPane: true }}
            className="vivo-aigc-tabs h-full"
          />
        </Card>
      </div>
    </div>
  );
};

export default VivoAigcPage;
