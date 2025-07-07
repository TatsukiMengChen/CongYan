import React, { useState } from "react";
import {
  Card,
  Button,
  Typography,
  message,
  Spin,
  Tag,
  Space,
  Alert,
} from "antd";
import Icon from "../../../../components/Icon";
import {
  useAiServices,
  AiGenerationOptions,
  AiGenerationResult,
} from "../hooks/useAiServices";
import TopicPresets from "./TopicPresets";
import GenerationForm from "./GenerationForm";

const { Title, Text, Paragraph } = Typography;

interface AiCorpusGeneratorProps {
  onComplete: (text: string) => void;
  loading?: boolean;
}

const AiCorpusGenerator: React.FC<AiCorpusGeneratorProps> = ({
  onComplete,
  loading = false,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [aiResult, setAiResult] = useState<AiGenerationResult | null>(null);

  const { generateCorpusWithAI, loading: aiLoading } = useAiServices();

  // 选择预设主题
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  // 生成语料
  const handleGenerate = async (options: AiGenerationOptions) => {
    try {
      const result = await generateCorpusWithAI(options);

      setAiResult(result);

      if (result.content.trim()) {
        message.success("AI语料生成成功！");
      } else {
        message.warning("生成的内容为空，请重试");
      }
    } catch (error: any) {
      message.error(`生成失败: ${error.message}`);
      console.error("AI generation error:", error);
    }
  };

  // 确认使用生成结果
  const handleConfirm = () => {
    if (aiResult?.content.trim()) {
      if (typeof onComplete === "function") {
        onComplete(aiResult.content);
      } else {
        console.error("onComplete is not a function:", onComplete);
        message.error("回调函数错误，请刷新页面重试");
      }
    } else {
      message.warning("请先生成内容");
    }
  };

  // 清空结果
  const handleClear = () => {
    setAiResult(null);
  };

  return (
    <div className="space-y-4">
      <Title level={4}>
        <Icon name="ai" size={20} className="mr-2" />
        AI智能语料生成
      </Title>

      <Alert
        message="使用说明"
        description="选择主题和参数，AI将自动生成适合康复训练的语料内容，并智能分类和生成标题。"
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：生成配置 */}
        <Card title="生成配置" size="small">
          <div className="space-y-4">
            {/* 主题预设 */}
            <TopicPresets onTopicSelect={handleTopicSelect} />

            {/* 生成配置 */}
            <GenerationForm
              selectedTopic={selectedTopic}
              onTopicChange={setSelectedTopic}
              onGenerate={handleGenerate}
              loading={aiLoading || loading}
            />
          </div>
        </Card>

        {/* 右侧：生成结果 */}
        <Card title="生成结果" size="small">
          {aiLoading || loading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="large">
                <div className="p-4">
                  <div className="text-center">AI正在生成语料...</div>
                </div>
              </Spin>
            </div>
          ) : aiResult ? (
            <div className="space-y-4">
              {/* 生成信息 */}
              <Space wrap>
                <Tag color="green">生成成功</Tag>
                {aiResult.title && <Tag>{aiResult.title}</Tag>}
                {aiResult.category && (
                  <Tag color="blue">{aiResult.category}</Tag>
                )}
                <Tag>{aiResult.content.length} 个字符</Tag>
              </Space>

              {/* 生成的内容 */}
              <div>
                <Text strong className="block mb-2">
                  生成内容：
                </Text>
                <div className="max-h-64 overflow-y-auto">
                  <Paragraph
                    className="p-3 bg-gray-50 rounded border"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {aiResult.content}
                  </Paragraph>
                </div>
              </div>

              {/* 操作按钮 */}
              <Space>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  disabled={!aiResult.content.trim()}
                >
                  使用此内容
                </Button>
                <Button onClick={handleClear}>重新生成</Button>
              </Space>

              {/* 使用建议 */}
              {aiResult.suggestions && aiResult.suggestions.length > 0 && (
                <div className="mt-4">
                  <Text strong className="block mb-2">
                    使用建议：
                  </Text>
                  <ul className="text-sm space-y-1">
                    {aiResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Icon name="check" size={12} color="#52c41a" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon name="ai" size={48} className="mb-2 block" />
              <Text>配置参数开始生成语料</Text>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AiCorpusGenerator;
