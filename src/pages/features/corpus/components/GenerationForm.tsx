import React, { useEffect } from "react";
import { Card, Form, Input, Select, Button, Typography } from "antd";
import Icon from "../../../../components/Icon";
import { AiGenerationOptions } from "../hooks/useAiServices";

const { Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface GenerationFormProps {
  selectedTopic: string;
  onTopicChange: (topic: string) => void;
  onGenerate: (options: AiGenerationOptions) => void;
  loading: boolean;
}

// 训练类型选项
const trainingTypeOptions = [
  { value: "pronunciation", label: "发音训练", description: "注重音素准确性" },
  { value: "rhythm", label: "语调节奏", description: "注重语音韵律" },
  { value: "articulation", label: "构音练习", description: "注重口型练习" },
  {
    value: "comprehensive",
    label: "综合训练",
    description: "全面提升发音能力",
  },
];

// 长度选项
const lengthOptions = [
  { value: "short", label: "短篇 (50-100字)", description: "简短易读" },
  { value: "medium", label: "中篇 (100-200字)", description: "内容适中" },
  { value: "long", label: "长篇 (200-300字)", description: "内容丰富" },
];

// 难度级别选项
const difficultyOptions = [
  { value: "basic", label: "基础", description: "简单易懂" },
  { value: "intermediate", label: "中级", description: "适中难度" },
  { value: "advanced", label: "高级", description: "复杂训练" },
];

const GenerationForm: React.FC<GenerationFormProps> = ({
  selectedTopic,
  onTopicChange,
  onGenerate,
  loading,
}) => {
  const [form] = Form.useForm();

  // 同步selectedTopic到表单
  useEffect(() => {
    form.setFieldsValue({ topic: selectedTopic });
  }, [selectedTopic, form]);

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      const options: AiGenerationOptions = {
        topic: values.topic,
        length: values.length || "medium",
        trainingType: values.trainingType || "comprehensive",
        difficultyLevel: values.difficultyLevel || "intermediate",
      };
      onGenerate(options);
    } catch (error) {
      console.error("表单验证失败:", error);
    }
  };

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="settings" size={16} />
          <span>生成配置</span>
        </div>
      }
      size="small"
    >
      <Form form={form} layout="vertical" size="large">
        <Form.Item
          name="topic"
          label="主题内容"
          rules={[{ required: true, message: "请输入生成主题" }]}
        >
          <TextArea
            rows={3}
            placeholder="请输入训练主题，例如：唇音练习、语调节奏等..."
            onChange={(e) => onTopicChange(e.target.value)}
            style={{ fontSize: "16px" }}
          />
        </Form.Item>

        <Form.Item
          name="trainingType"
          label="训练类型"
          initialValue="comprehensive"
        >
          <Select placeholder="选择训练类型" optionLabelProp="label">
            {trainingTypeOptions.map((type) => (
              <Option key={type.value} value={type.value} label={type.label}>
                <div>
                  <div className="font-medium">{type.label}</div>
                  <Text className="text-xs text-gray-500">
                    {type.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item name="length" label="内容长度" initialValue="medium">
          <Select placeholder="选择内容长度" optionLabelProp="label">
            {lengthOptions.map((length) => (
              <Option
                key={length.value}
                value={length.value}
                label={length.label}
              >
                <div>
                  <div className="font-medium">{length.label}</div>
                  <Text className="text-xs text-gray-500">
                    {length.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="difficultyLevel"
          label="难度级别"
          initialValue="intermediate"
        >
          <Select placeholder="选择难度级别" optionLabelProp="label">
            {difficultyOptions.map((difficulty) => (
              <Option
                key={difficulty.value}
                value={difficulty.value}
                label={difficulty.label}
              >
                <div>
                  <div className="font-medium">{difficulty.label}</div>
                  <Text className="text-xs text-gray-500">
                    {difficulty.description}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Button
          type="primary"
          onClick={handleGenerate}
          loading={loading}
          disabled={!selectedTopic.trim()}
          block
          size="large"
          className="h-12"
          style={{ fontSize: "16px" }}
        >
          <Icon name="ai" size={18} />
          <span className="ml-2">生成训练语料</span>
        </Button>
      </Form>
    </Card>
  );
};

export default GenerationForm;
