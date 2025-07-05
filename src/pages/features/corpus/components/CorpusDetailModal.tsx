import React, { useState, useEffect } from "react";
import {
  Modal,
  Typography,
  Button,
  Space,
  Tag,
  Card,
  Descriptions,
  message,
} from "antd";
import Icon from "../../../../components/Icon";
import { CorpusInfo } from "../../../../api/text";
import { formatDate } from "../../../../utils/formatters";

const { Title, Text, Paragraph } = Typography;

interface CorpusDetailModalProps {
  visible: boolean;
  corpus: CorpusInfo | null;
  onCancel: () => void;
  onUpdate: () => void;
}

// 语料分类映射
const categoryMap: Record<string, { label: string; color: string }> = {
  prose: { label: "散文", color: "blue" },
  "ancient-poem": { label: "古代诗词", color: "purple" },
  "modern-poetry": { label: "现代诗词", color: "cyan" },
  other: { label: "其他", color: "default" },
};

const CorpusDetailModal: React.FC<CorpusDetailModalProps> = ({
  visible,
  corpus,
  onCancel,
  onUpdate,
}) => {
  const [copying, setCopying] = useState(false);

  // 复制文本内容
  const handleCopy = async () => {
    if (!corpus?.text) return;

    setCopying(true);
    try {
      await navigator.clipboard.writeText(corpus.text);
      message.success("内容已复制到剪贴板");
    } catch (error) {
      // 降级处理：使用传统方法
      const textArea = document.createElement("textarea");
      textArea.value = corpus.text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      message.success("内容已复制到剪贴板");
    } finally {
      setCopying(false);
    }
  };

  if (!corpus) return null;

  // 获取分类信息
  const categoryInfo =
    categoryMap[corpus.category || "other"] || categoryMap.other;

  // 计算文本统计
  const textStats = {
    chars: corpus.text.length,
    lines: corpus.text.split("\n").filter((line) => line.trim()).length,
    paragraphs: corpus.text.split("\n\n").filter((p) => p.trim()).length,
  };

  // 发音训练分析
  const pronunciationAnalysis = {
    avgLineLength:
      textStats.lines > 0 ? Math.round(textStats.chars / textStats.lines) : 0,
    complexity:
      textStats.chars < 100 ? "简单" : textStats.chars < 300 ? "适中" : "复杂",
    trainingLevel:
      textStats.chars < 100 ? "初级" : textStats.chars < 300 ? "中级" : "高级",
  };

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <Icon name="book" size={20} color="#3b82f6" />
          <span>{corpus.title || "康复训练语料详情"}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>关闭</Button>
          <Button
            icon={<Icon name="copy" size={16} />}
            onClick={handleCopy}
            loading={copying}
          >
            复制内容
          </Button>
          <Button
            type="primary"
            icon={<Icon name="edit" size={16} />}
            onClick={() => {
              // TODO: 实现编辑功能
              message.info("编辑功能即将上线");
            }}
          >
            编辑训练语料
          </Button>
        </Space>
      }
      destroyOnClose
    >
      <div className="space-y-6">
        {/* 基本信息 */}
        <Card title="基本信息" size="small">
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="标题" span={2}>
              <Text strong>{corpus.title || "无标题"}</Text>
            </Descriptions.Item>

            <Descriptions.Item label="分类">
              <Tag
                color={categoryInfo.color}
                icon={<Icon name="tag" size={12} />}
              >
                {categoryInfo.label}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="创建时间">
              <Space>
                <Icon name="calendar" size={16} />
                <Text>
                  {formatDate(corpus.createdAt, "YYYY-MM-DD HH:mm:ss")}
                </Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="字符数">
              <Text>{textStats.chars} 字符</Text>
            </Descriptions.Item>

            <Descriptions.Item label="行数">
              <Text>{textStats.lines} 行</Text>
            </Descriptions.Item>

            <Descriptions.Item label="段落数">
              <Text>{textStats.paragraphs} 段</Text>
            </Descriptions.Item>

            <Descriptions.Item label="训练难度">
              <Tag
                color={
                  pronunciationAnalysis.trainingLevel === "初级"
                    ? "green"
                    : pronunciationAnalysis.trainingLevel === "中级"
                      ? "orange"
                      : "red"
                }
              >
                {pronunciationAnalysis.trainingLevel}
              </Tag>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 内容展示 */}
        <Card
          title={
            <div className="flex items-center justify-between">
              <span>康复训练语料内容</span>
              <Space>
                <Tag>{textStats.chars} 字符</Tag>
                <Tag>{textStats.lines} 行</Tag>
              </Space>
            </div>
          }
          size="small"
        >
          <div
            className="p-4 bg-gray-50 rounded-lg border max-h-96 overflow-y-auto"
            style={{
              whiteSpace: "pre-wrap",
              lineHeight: "1.8",
              fontSize: "16px",
              color: "#262626",
            }}
          >
            {corpus.text}
          </div>
        </Card>

        {/* 发音训练分析 */}
        <Card title="发音训练分析" size="small">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {textStats.chars}
              </div>
              <div className="text-sm text-gray-600">总字符数</div>
            </div>

            <div className="text-center p-3 bg-purple-50 rounded">
              <div className="text-2xl font-bold text-purple-600">
                {textStats.lines}
              </div>
              <div className="text-sm text-gray-600">训练行数</div>
            </div>

            <div className="text-center p-3 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">
                {pronunciationAnalysis.avgLineLength}
              </div>
              <div className="text-sm text-gray-600">平均行长</div>
            </div>
          </div>

          {/* 康复训练适用性评估 */}
          <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between">
              <Text strong>康复训练适用性：</Text>
              <Tag
                color={
                  pronunciationAnalysis.trainingLevel === "初级"
                    ? "green"
                    : pronunciationAnalysis.trainingLevel === "中级"
                      ? "orange"
                      : "red"
                }
              >
                {pronunciationAnalysis.trainingLevel}训练
              </Tag>
            </div>
            <Text className="text-sm text-gray-600 mt-2">
              平均每行 {pronunciationAnalysis.avgLineLength} 字符，
              {pronunciationAnalysis.trainingLevel === "初级"
                ? "适合发音障碍康复初期训练，语句简短易读"
                : pronunciationAnalysis.trainingLevel === "中级"
                  ? "适合有一定基础的发音训练，提升语音连贯性"
                  : "适合高级发音训练，挑战复杂语音结构"}
            </Text>
          </div>

          {/* 发音训练建议 */}
          <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
            <Text strong className="text-blue-700">
              发音训练建议：
            </Text>
            <div className="mt-2 space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <Icon name="check" size={14} className="text-green-500 mr-2" />
                <span>建议分段练习，每次训练 3-5 行内容</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icon name="check" size={14} className="text-green-500 mr-2" />
                <span>可配合语音识别功能进行发音评估</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Icon name="check" size={14} className="text-green-500 mr-2" />
                <span>
                  {textStats.paragraphs > 1
                    ? "多段落结构有助于训练语音节奏和停顿"
                    : "单段落内容便于集中练习特定发音"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* 操作历史（预留） */}
        {/* 这里可以添加语料的编辑历史、使用记录等 */}
      </div>
    </Modal>
  );
};

export default CorpusDetailModal;
