import React, { useState } from "react";
import { Typography, message, Alert } from "antd";
import Icon from "../../../../components/Icon";
import {
  useAiServices,
  AiGenerationOptions,
  AiGenerationResult,
} from "../hooks/useAiServices";
import TopicPresets from "./TopicPresets";
import GenerationForm from "./GenerationForm";
import GenerationResults from "./GenerationResults";

const { Title } = Typography;

interface AiCorpusGeneratorProps {
  onGenerate: (text: string, title?: string, category?: string) => void;
  loading?: boolean;
}

const AiCorpusGenerator: React.FC<AiCorpusGeneratorProps> = ({
  onGenerate,
  loading = false,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [generatedResults, setGeneratedResults] = useState<
    AiGenerationResult[]
  >([]);
  const [selectedResult, setSelectedResult] =
    useState<AiGenerationResult | null>(null);

  const { generateCorpusWithAI, loading: aiLoading } = useAiServices();

  // 选择预设主题
  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
  };

  // 生成语料
  const handleGenerate = async (options: AiGenerationOptions) => {
    try {
      const result = await generateCorpusWithAI(options);

      if (result.content.trim()) {
        // 保留最近3个结果
        setGeneratedResults((prev) => [result, ...prev.slice(0, 2)]);
        setSelectedResult(result);
        message.success("AI语料生成成功！");
      } else {
        message.warning("生成的内容为空，请重试");
      }
    } catch (error: any) {
      message.error(`生成失败: ${error.message}`);
      console.error("AI generation error:", error);
    }
  };

  // 选择历史结果
  const handleResultSelect = (result: AiGenerationResult) => {
    setSelectedResult(result);
  };

  // 确认使用生成结果
  const handleConfirm = () => {
    if (selectedResult && selectedResult.content.trim()) {
      onGenerate(
        selectedResult.content,
        selectedResult.title,
        selectedResult.category,
      );
      message.success("语料内容已应用！");
    } else {
      message.warning("请先生成内容");
    }
  };

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="text-center">
        <Title level={3} className="!mb-2">
          <Icon name="ai" size={24} className="mr-2" />
          AI智能语料生成
        </Title>
        <Alert
          message="AI生成助手"
          description="选择主题和参数，AI将自动生成适合康复训练的语料内容，并智能分类和生成标题"
          type="info"
          showIcon
          className="mb-4"
        />
      </div>

      {/* 主题预设 */}
      <TopicPresets onTopicSelect={handleTopicSelect} />

      {/* 移动端优化：垂直布局 */}
      <div className="space-y-4">
        {/* 生成配置 */}
        <GenerationForm
          selectedTopic={selectedTopic}
          onTopicChange={setSelectedTopic}
          onGenerate={handleGenerate}
          loading={aiLoading || loading}
        />

        {/* 生成结果 */}
        <GenerationResults
          loading={aiLoading || loading}
          results={generatedResults}
          selectedResult={selectedResult}
          onResultSelect={handleResultSelect}
          onConfirm={handleConfirm}
        />
      </div>
    </div>
  );
};

export default AiCorpusGenerator;
