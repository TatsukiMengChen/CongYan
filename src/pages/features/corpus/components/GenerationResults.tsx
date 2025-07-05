import React from "react";
import { Card, Button, Typography, Spin, Tag, Divider } from "antd";
import Icon from "../../../../components/Icon";
import { AiGenerationResult } from "../hooks/useAiServices";

const { Text, Paragraph } = Typography;

interface GenerationResultsProps {
  loading: boolean;
  results: AiGenerationResult[];
  selectedResult: AiGenerationResult | null;
  onResultSelect: (result: AiGenerationResult) => void;
  onConfirm: () => void;
}

const GenerationResults: React.FC<GenerationResultsProps> = ({
  loading,
  results,
  selectedResult,
  onResultSelect,
  onConfirm,
}) => {
  if (loading) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <Icon name="robot" size={16} />
            <span>生成结果</span>
          </div>
        }
        size="small"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <Spin size="large" />
          <div className="mt-4 text-base text-gray-600">AI正在生成语料...</div>
          <div className="mt-2 text-sm text-gray-400">请稍候片刻</div>
        </div>
      </Card>
    );
  }

  if (results.length === 0) {
    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <Icon name="robot" size={16} />
            <span>生成结果</span>
          </div>
        }
        size="small"
      >
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <Icon name="ai" size={64} color="#94a3b8" />
          <div className="mt-4 text-base">填写配置信息开始生成</div>
          <div className="mt-2 text-sm">AI将为您生成专业的康复训练语料</div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center gap-2">
          <Icon name="robot" size={16} />
          <span>生成结果</span>
        </div>
      }
      size="small"
    >
      <div className="space-y-4">
        {/* 当前选中的结果 */}
        {selectedResult && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Text strong className="text-base">
                生成的内容
              </Text>
              <Button
                type="primary"
                size="large"
                onClick={onConfirm}
                className="h-10"
                style={{ fontSize: "14px" }}
              >
                <Icon name="check" size={16} />
                <span className="ml-1">使用此内容</span>
              </Button>
            </div>

            {/* 内容标题 */}
            {selectedResult.title && (
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="text" size={16} />
                  <Text strong>标题：</Text>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <Text className="text-base font-medium">
                    {selectedResult.title}
                  </Text>
                </div>
              </div>
            )}

            {/* 内容分类和元数据 */}
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {selectedResult.category && (
                  <Tag color="blue">
                    <Icon name="tag" size={12} />
                    <span className="ml-1">{selectedResult.category}</span>
                  </Tag>
                )}
                {selectedResult.metadata?.difficultyLevel && (
                  <Tag color="green">
                    <Icon name="star" size={12} />
                    <span className="ml-1">
                      {selectedResult.metadata.difficultyLevel}
                    </span>
                  </Tag>
                )}
                {selectedResult.metadata?.trainingFocus && (
                  <Tag color="purple">
                    <Icon name="magic" size={12} />
                    <span className="ml-1">
                      {selectedResult.metadata.trainingFocus}
                    </span>
                  </Tag>
                )}
                {selectedResult.metadata?.wordCount && (
                  <Tag color="orange">
                    <Icon name="book" size={12} />
                    <span className="ml-1">
                      {selectedResult.metadata.wordCount}字
                    </span>
                  </Tag>
                )}
              </div>
            </div>

            {/* 主要内容 */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="document" size={16} />
                <Text strong>语料内容：</Text>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div className="p-4 bg-gray-50 rounded-lg border">
                  <Paragraph
                    className="!mb-0 text-base leading-relaxed"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {selectedResult.content}
                  </Paragraph>
                </div>
              </div>
            </div>

            {/* 使用建议 */}
            {selectedResult.suggestions &&
              selectedResult.suggestions.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="info" size={16} />
                    <Text strong>使用建议：</Text>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <ul className="!mb-0 text-sm space-y-1">
                      {selectedResult.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Icon name="check" size={12} color="#f59e0b" />
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* 历史生成结果 */}
        {results.length > 1 && (
          <>
            <Divider />
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Icon name="time" size={16} />
                <Text strong>历史生成结果</Text>
              </div>
              <div className="space-y-2">
                {results.slice(1).map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedResult === result
                        ? "bg-blue-50 border-blue-300"
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    }`}
                    onClick={() => onResultSelect(result)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Text className="text-sm font-medium">
                          {result.title || "无标题"}
                        </Text>
                        <div className="mt-1">
                          <Text className="text-xs text-gray-500">
                            {result.content.substring(0, 50)}...
                          </Text>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {result.category && (
                          <Tag size="small" color="blue">
                            {result.category}
                          </Tag>
                        )}
                        <Icon name="arrow-right" size={12} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default GenerationResults;
