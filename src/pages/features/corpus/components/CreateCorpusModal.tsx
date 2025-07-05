import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  Steps,
  message,
  Typography,
  Space,
  Divider,
  Card,
} from "antd";
import Icon from "../../../../components/Icon";
import { CreateCorpusAPI } from "../../../../api/text";
import { useAiServices } from "../hooks/useAiServices";
import { useOcrService } from "../hooks/useOcrService";
import OcrInputSection from "./OcrInputSection";
import AiCorpusGenerator from "./AiCorpusGenerator";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { Step } = Steps;

interface CreateCorpusModalProps {
  visible: boolean;
  mode: "manual" | "ocr" | "ai";
  onCancel: () => void;
  onSuccess: () => void;
}

// 康复训练语料分类选项
const corpusCategories = [
  { value: "prose", label: "散文" },
  { value: "ancient-poem", label: "古代诗词" },
  { value: "modern-poetry", label: "现代诗词" },
  { value: "other", label: "其他" },
];

const CreateCorpusModal: React.FC<CreateCorpusModalProps> = ({
  visible,
  mode,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [contentSource, setContentSource] = useState(""); // 原始内容
  const [formattedContent, setFormattedContent] = useState(""); // 格式化后的内容
  const [generatedTitle, setGeneratedTitle] = useState(""); // AI生成的标题

  const {
    formatTextWithAI,
    generateTitleWithAI,
    loading: aiLoading,
  } = useAiServices();

  const { recognizeFromFile, loading: ocrLoading } = useOcrService();

  // 重置表单状态
  const resetForm = () => {
    form.resetFields();
    setCurrentStep(0);
    setContentSource("");
    setFormattedContent("");
    setGeneratedTitle("");
  };

  useEffect(() => {
    if (visible) {
      resetForm();
      // 根据模式设置初始分类
      form.setFieldsValue({
        category: corpusCategories[0].value,
      });
    }
  }, [visible, mode, form]);

  // 获取模式信息
  const getModeInfo = () => {
    const modeMap = {
      manual: {
        title: "手动输入训练语料",
        icon: <Icon name="edit" size={20} />,
        description: "手动输入文本内容创建康复训练语料",
        color: "#1890ff",
      },
      ocr: {
        title: "OCR图片识别",
        icon: <Icon name="scan" size={20} />,
        description: "上传图片自动识别文字创建训练语料",
        color: "#52c41a",
      },
      ai: {
        title: "AI智能生成",
        icon: <Icon name="robot" size={20} />,
        description: "使用AI根据主题自动生成康复训练语料",
        color: "#722ed1",
      },
    };
    return modeMap[mode];
  };

  // 处理OCR识别完成
  const handleOcrComplete = async (ocrText: string) => {
    setContentSource(ocrText);
    form.setFieldsValue({ text: ocrText });

    // 自动进入下一步
    setCurrentStep(1);

    try {
      // 自动格式化文本
      const formatted = await formatTextWithAI(ocrText, {
        maxLineLength: 15,
        addPunctuation: true,
      });
      setFormattedContent(formatted.content);

      // 生成标题建议
      const titles = await generateTitleWithAI(ocrText);
      if (titles.length > 0) {
        setGeneratedTitle(titles[0]);
        form.setFieldsValue({ title: titles[0] });
      }
    } catch (error) {
      console.error("AI处理失败:", error);
    }
  };

  // 处理AI生成完成
  const handleAiGenerate = async (
    generatedText: string,
    title?: string,
    category?: string,
  ) => {
    setContentSource(generatedText);
    setFormattedContent(generatedText); // AI生成的内容已经是格式化的
    form.setFieldsValue({
      text: generatedText,
      title: title || generatedTitle, // 使用AI生成的标题
      category: category || form.getFieldValue("category"), // 使用AI生成的分类
    });

    // 自动进入下一步
    setCurrentStep(1);

    // 如果AI已经生成了标题，直接使用，否则尝试生成
    if (title) {
      setGeneratedTitle(title);
    } else {
      try {
        const titles = await generateTitleWithAI(generatedText);
        if (titles.length > 0) {
          setGeneratedTitle(titles[0]);
          form.setFieldsValue({ title: titles[0] });
        }
      } catch (error) {
        console.error("标题生成失败:", error);
      }
    }
  };

  // 处理手动文本输入
  const handleManualInput = (text: string) => {
    setContentSource(text);
    form.setFieldsValue({ text });
  };

  // 格式化文本
  const handleFormatText = async () => {
    const text = form.getFieldValue("text");
    if (!text?.trim()) {
      message.warning("请先输入文本内容");
      return;
    }

    try {
      const formatted = await formatTextWithAI(text, {
        maxLineLength: 15,
        addPunctuation: true,
      });
      setFormattedContent(formatted.content);
      form.setFieldsValue({ text: formatted.content });
      message.success("文本格式化完成");
    } catch (error) {
      console.error("格式化失败:", error);
    }
  };

  // 生成标题
  const handleGenerateTitle = async () => {
    const text = form.getFieldValue("text");
    if (!text?.trim()) {
      message.warning("请先输入文本内容");
      return;
    }

    try {
      const titles = await generateTitleWithAI(text);
      if (titles.length > 0) {
        setGeneratedTitle(titles[0]);
        form.setFieldsValue({ title: titles[0] });
        message.success("标题生成完成");
      }
    } catch (error) {
      console.error("标题生成失败:", error);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);

      const res = await CreateCorpusAPI({
        title: values.title.trim(),
        text: values.text.trim(),
        category: values.category,
      });

      if (res.status === 0) {
        message.success("创建成功");
        onSuccess();
      } else {
        message.error(res.message || "创建失败");
      }
    } catch (error) {
      console.error("创建失败:", error);
      message.error("创建失败，请检查网络连接");
    } finally {
      setCreating(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        // 内容输入步骤
        if (mode === "manual") {
          return (
            <div className="space-y-4">
              <Title level={4}>输入训练语料内容</Title>
              <Form.Item
                name="text"
                rules={[{ required: true, message: "请输入训练语料内容" }]}
              >
                <TextArea
                  rows={8}
                  placeholder="请输入康复训练语料内容..."
                  onChange={(e) => handleManualInput(e.target.value)}
                />
              </Form.Item>
              <Button
                type="primary"
                onClick={() => setCurrentStep(1)}
                disabled={!form.getFieldValue("text")?.trim()}
              >
                下一步
              </Button>
            </div>
          );
        } else if (mode === "ocr") {
          return (
            <OcrInputSection
              onComplete={handleOcrComplete}
              loading={ocrLoading}
            />
          );
        } else if (mode === "ai") {
          return (
            <AiCorpusGenerator
              onGenerate={handleAiGenerate}
              loading={aiLoading}
            />
          );
        }
        break;

      case 1:
        // 编辑和格式化步骤
        return (
          <div className="space-y-4">
            <Title level={4}>编辑和优化</Title>

            <Form.Item
              name="title"
              label="训练语料标题"
              rules={[{ required: true, message: "请输入训练语料标题" }]}
            >
              <Input
                placeholder="请输入训练语料标题"
                suffix={
                  <Button
                    type="link"
                    size="small"
                    onClick={handleGenerateTitle}
                    loading={aiLoading}
                  >
                    AI生成
                  </Button>
                }
              />
            </Form.Item>

            <Form.Item
              name="category"
              label="训练分类"
              rules={[{ required: true, message: "请选择训练分类" }]}
            >
              <Select placeholder="请选择训练分类">
                {corpusCategories.map((category) => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="text"
              label="训练语料内容"
              rules={[{ required: true, message: "请输入训练语料内容" }]}
            >
              <TextArea rows={10} placeholder="请输入康复训练语料内容" />
            </Form.Item>

            <Space>
              <Button
                onClick={handleFormatText}
                loading={aiLoading}
                icon={<Icon name="robot" size={16} />}
              >
                AI智能格式化
              </Button>
              <Button onClick={() => setCurrentStep(0)}>上一步</Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={creating}
                icon={<Icon name="check" size={16} />}
              >
                创建训练语料
              </Button>
            </Space>
          </div>
        );

      default:
        return null;
    }
  };

  const modeInfo = getModeInfo();

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <span style={{ color: modeInfo.color }}>{modeInfo.icon}</span>
          <span>{modeInfo.title}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <div className="space-y-6">
        {/* 模式说明 */}
        <Card size="small" className="bg-gray-50">
          <Text className="text-gray-600">{modeInfo.description}</Text>
        </Card>

        {/* 步骤指示器 */}
        <Steps current={currentStep} size="small">
          <Step
            title="输入内容"
            description={
              mode === "manual"
                ? "手动输入"
                : mode === "ocr"
                  ? "图片识别"
                  : "AI生成"
            }
          />
          <Step title="编辑优化" description="完善信息" />
        </Steps>

        <Divider />

        {/* 表单内容 */}
        <Form form={form} layout="vertical">
          {renderStepContent()}
        </Form>
      </div>
    </Modal>
  );
};

export default CreateCorpusModal;
