import React, { useState } from "react";
import {
  Card,
  Upload,
  Button,
  Typography,
  message,
  Spin,
  Tag,
  Space,
  Image,
  Alert,
} from "antd";
import Icon from "../../../../components/Icon";
import { useOcrService, OcrResult } from "../hooks/useOcrService";

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

interface OcrInputSectionProps {
  onComplete: (text: string) => void;
  loading?: boolean;
}

const OcrInputSection: React.FC<OcrInputSectionProps> = ({
  onComplete,
  loading = false,
}) => {
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const {
    recognizeFromFile,
    loading: ocrLoading,
    error: ocrError,
  } = useOcrService();

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    try {
      // 预览图片
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // 执行OCR识别
      const result = await recognizeFromFile(file, {
        removeNoise: true,
        mergeLines: true,
      });

      setOcrResult(result);

      if (result.text.trim()) {
        message.success(`识别成功，共识别到 ${result.segments.length} 段文字`);
      } else {
        message.warning("未识别到有效文字，请检查图片是否清晰");
      }
    } catch (error: any) {
      message.error(`识别失败: ${error.message}`);
      console.error("OCR error:", error);
    }

    return false; // 阻止自动上传
  };

  // 确认使用识别结果
  const handleConfirm = () => {
    if (ocrResult?.text.trim()) {
      onComplete(ocrResult.text);
    } else {
      message.warning("请先上传图片并完成识别");
    }
  };

  // 清空结果
  const handleClear = () => {
    setOcrResult(null);
    setImagePreview("");
  };

  return (
    <div className="space-y-4">
      <Title level={4}>
        <Icon name="scan" size={20} className="mr-2" />
        OCR图片文字识别
      </Title>

      <Alert
        message="使用说明"
        description="请上传清晰的图片，支持JPG、PNG、BMP格式，文字将自动识别并转换为适合康复训练的格式。"
        type="info"
        showIcon
        className="mb-4"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 左侧：上传区域 */}
        <Card title="图片上传" size="small">
          <Dragger
            accept="image/*"
            beforeUpload={handleFileUpload}
            showUploadList={false}
            disabled={ocrLoading || loading}
            className="mb-4"
          >
            <p className="ant-upload-drag-icon">
              <Icon name="upload" size={48} />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p className="ant-upload-hint">
              支持 JPG、PNG、BMP 格式，建议图片清晰度高
            </p>
          </Dragger>

          {imagePreview && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text strong>图片预览</Text>
                <Button
                  size="small"
                  icon={<Icon name="eye" size={16} />}
                  onClick={() => {
                    // 可以实现图片放大查看
                  }}
                >
                  查看
                </Button>
              </div>
              <Image
                src={imagePreview}
                alt="上传的图片"
                width="100%"
                style={{ maxHeight: 200, objectFit: "contain" }}
              />
            </div>
          )}
        </Card>

        {/* 右侧：识别结果 */}
        <Card title="识别结果" size="small">
          {ocrLoading || loading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="large" tip="正在识别文字..." />
            </div>
          ) : ocrResult ? (
            <div className="space-y-4">
              {/* 识别信息 */}
              <Space wrap>
                <Tag color="green">识别成功</Tag>
                <Tag>{ocrResult.segments.length} 段文字</Tag>
                <Tag>{ocrResult.text.length} 个字符</Tag>
                <Tag>置信度: {Math.round(ocrResult.confidence * 100)}%</Tag>
              </Space>

              {/* 识别的文字内容 */}
              <div>
                <Text strong className="block mb-2">
                  识别内容：
                </Text>
                <div className="max-h-64 overflow-y-auto">
                  <Paragraph
                    className="p-3 bg-gray-50 rounded border"
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {ocrResult.text}
                  </Paragraph>
                </div>
              </div>

              {/* 操作按钮 */}
              <Space>
                <Button
                  type="primary"
                  onClick={handleConfirm}
                  disabled={!ocrResult.text.trim()}
                >
                  使用此文本
                </Button>
                <Button onClick={handleClear}>重新识别</Button>
              </Space>

              {/* 处理时间 */}
              {ocrResult.metadata.processingTime && (
                <Text className="text-gray-500 text-sm">
                  识别耗时: {ocrResult.metadata.processingTime}ms
                </Text>
              )}
            </div>
          ) : ocrError ? (
            <div className="text-center py-8">
              <Text type="danger">{ocrError}</Text>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Icon name="scan" size={48} className="mb-2 block" />
              <Text>上传图片开始文字识别</Text>
            </div>
          )}
        </Card>
      </div>

      {/* 识别结果详情 */}
      {ocrResult && (
        <Card title="识别详情" size="small" className="mt-4">
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Text strong>识别时间：</Text>
                <br />
                <Text className="text-gray-600">
                  {new Date(ocrResult.metadata.recognizedAt).toLocaleString()}
                </Text>
              </div>
              <div>
                <Text strong>文字段数：</Text>
                <br />
                <Text className="text-gray-600">
                  {ocrResult.segments.length} 段
                </Text>
              </div>
              <div>
                <Text strong>总字符数：</Text>
                <br />
                <Text className="text-gray-600">
                  {ocrResult.text.length} 字符
                </Text>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default OcrInputSection;
