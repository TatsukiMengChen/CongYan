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
  Form,
  Input,
  Select,
} from "antd";
import Icon from "../../../../components/Icon";
import { CorpusInfo, EditCorpusAPI } from "../../../../api/text";
import { formatDate } from "../../../../utils/formatters";
import { useAiServices } from "../hooks/useAiServices";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

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
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const {
    formatTextWithAI,
    generateTitleWithAI,
    loading: aiLoading,
  } = useAiServices();

  // 重置编辑状态
  useEffect(() => {
    if (visible && corpus) {
      form.setFieldsValue({
        title: corpus.title,
        text: corpus.text,
        category: corpus.category,
      });
      setEditing(false);
    }
  }, [visible, corpus, form]);

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

  // 开始编辑
  const handleEdit = () => {
    setEditing(true);
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditing(false);
    // 重置表单
    if (corpus) {
      form.setFieldsValue({
        title: corpus.title,
        text: corpus.text,
        category: corpus.category,
      });
    }
  };

  // AI生成标题
  const handleGenerateTitle = async () => {
    const text = form.getFieldValue("text");
    if (!text?.trim()) {
      message.warning("请先输入文本内容");
      return;
    }

    try {
      const titles = await generateTitleWithAI(text);
      if (titles.length > 0) {
        form.setFieldsValue({ title: titles[0] });
        message.success("标题生成完成");
      }
    } catch (error) {
      console.error("标题生成失败:", error);
      message.error("标题生成失败，请稍后重试");
    }
  };

  // AI智能格式化
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
      form.setFieldsValue({ text: formatted.content });
      message.success("文本格式化完成");
    } catch (error) {
      console.error("格式化失败:", error);
      message.error("格式化失败，请稍后重试");
    }
  };

  // 保存编辑
  const handleSave = async () => {
    if (!corpus) return;

    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await EditCorpusAPI({
        uuid: corpus.uuid,
        title: values.title,
        text: values.text,
        category: values.category,
      });

      if (res.status === 0) {
        message.success("语料更新成功");
        setEditing(false);
        onUpdate(); // 刷新父组件数据
      } else {
        message.error(res.message || "更新失败");
      }
    } catch (error: any) {
      if (error.errorFields) {
        message.error("请检查表单填写");
      } else {
        message.error("保存时发生错误");
        console.error("Save error:", error);
      }
    } finally {
      setSaving(false);
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
          <span>
            {editing ? "编辑康复训练语料" : corpus.title || "康复训练语料详情"}
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={
        <Space>
          <Button onClick={onCancel}>关闭</Button>
          {!editing ? (
            <>
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
                onClick={handleEdit}
              >
                编辑训练语料
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleCancelEdit}>取消</Button>
              <Button
                type="primary"
                icon={<Icon name="save" size={16} />}
                onClick={handleSave}
                loading={saving}
              >
                保存
              </Button>
            </>
          )}
        </Space>
      }
      destroyOnClose
    >
      {editing ? (
        // 编辑模式
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: corpus.title,
            text: corpus.text,
            category: corpus.category,
          }}
        >
          <Form.Item
            label="标题"
            name="title"
            rules={[
              { required: true, message: "请输入标题" },
              { max: 100, message: "标题不能超过100个字符" },
            ]}
          >
            <Input
              placeholder="请输入康复训练语料标题"
              suffix={
                <Button
                  type="link"
                  size="small"
                  onClick={handleGenerateTitle}
                  loading={aiLoading}
                  icon={<Icon name="robot" size={12} />}
                >
                  AI生成
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: "请选择分类" }]}
          >
            <Select placeholder="请选择语料分类">
              <Option value="prose">散文</Option>
              <Option value="ancient-poem">古代诗词</Option>
              <Option value="modern-poetry">现代诗词</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="内容"
            name="text"
            rules={[
              { required: true, message: "请输入内容" },
              { min: 10, message: "内容不能少于10个字符" },
              { max: 5000, message: "内容不能超过5000个字符" },
            ]}
          >
            <TextArea
              placeholder="请输入康复训练语料内容"
              rows={12}
              showCount
              maxLength={5000}
            />
          </Form.Item>

          <div className="flex justify-start mb-4">
            <Button
              onClick={handleFormatText}
              loading={aiLoading}
              icon={<Icon name="robot" size={16} />}
            >
              AI智能格式化
            </Button>
          </div>
        </Form>
      ) : (
        // 查看模式
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
                  <Icon
                    name="check"
                    size={14}
                    className="text-green-500 mr-2"
                  />
                  <span>建议分段练习，每次训练 3-5 行内容</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon
                    name="check"
                    size={14}
                    className="text-green-500 mr-2"
                  />
                  <span>可配合语音识别功能进行发音评估</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Icon
                    name="check"
                    size={14}
                    className="text-green-500 mr-2"
                  />
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
      )}
    </Modal>
  );
};

export default CorpusDetailModal;
