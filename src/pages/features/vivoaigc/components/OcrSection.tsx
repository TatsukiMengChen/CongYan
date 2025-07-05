import React, { useState } from "react";
import { Card, Upload, Button, Typography, message, Spin, Tag } from "antd";
import { UploadOutlined, ScanOutlined } from "@ant-design/icons";
import { createVivoAigcSDK } from "../../../../api/vivoAigc";

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

const OcrSection: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [ocrResult, setOcrResult] = useState<any>(null);

  /**
   * 创建 SDK 实例
   */
  const createSDK = () => {
    return createVivoAigcSDK({
      appId: import.meta.env.VITE_VIVO_AIGC_APP_ID || "",
      appKey: import.meta.env.VITE_VIVO_AIGC_APP_KEY || "",
      baseURL:
        import.meta.env.VITE_VIVO_AIGC_BASE_URL || "https://api-ai.vivo.com.cn",
    });
  };

  /**
   * 处理图片上传
   */
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    return false; // 阻止自动上传
  };

  /**
   * 执行OCR识别
   */
  const performOCR = async () => {
    if (!imagePreview) {
      message.error("请先上传图片");
      return;
    }

    setLoading(true);
    setOcrResult(null);

    try {
      const sdk = createSDK();

      // 提取base64数据
      const base64Data = imagePreview.split(",")[1];

      const response = await sdk.ocr.recognizeText(base64Data, {
        pos: 2, // 返回文字和相对坐标
      });

      if (response.error_code === 0) {
        setOcrResult(response);
        const texts = sdk.ocr.extractTextFromResponse(response);
        message.success(`识别成功，共识别到 ${texts.length} 段文字`);
      } else {
        message.error(`OCR识别失败: ${response.error_msg}`);
      }
    } catch (error: any) {
      message.error(`OCR识别失败: ${error.message}`);
      console.error("OCR error:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 清空结果
   */
  const clearResults = () => {
    setImagePreview("");
    setOcrResult(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <Title level={3} className="!mb-2">
          OCR文字识别
        </Title>
        <Paragraph className="text-gray-600">
          上传图片进行文字识别，支持多种语言和复杂场景
        </Paragraph>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 上传区域 */}
        <Card title="图片上传" className="h-fit">
          <Dragger
            accept="image/*"
            beforeUpload={handleImageUpload}
            showUploadList={false}
            className="mb-4"
          >
            <p className="ant-upload-drag-icon">
              <UploadOutlined />
            </p>
            <p className="ant-upload-text">点击或拖拽图片到此区域上传</p>
            <p className="ant-upload-hint">支持 JPG、PNG、BMP 格式</p>
          </Dragger>

          {imagePreview && (
            <div className="space-y-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full rounded-lg border"
                style={{ maxHeight: "300px", objectFit: "contain" }}
              />

              <div className="flex gap-2">
                <Button
                  type="primary"
                  icon={<ScanOutlined />}
                  onClick={performOCR}
                  loading={loading}
                  className="flex-1"
                >
                  开始识别
                </Button>
                <Button onClick={clearResults}>清空</Button>
              </div>
            </div>
          )}
        </Card>

        {/* 识别结果 */}
        <Card title="识别结果" className="h-fit">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spin tip="正在识别文字..." />
            </div>
          ) : ocrResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Tag color="green">识别成功</Tag>
                <span className="text-sm text-gray-500">
                  版本: {ocrResult.version}
                </span>
              </div>

              {/* 识别的文字 */}
              <div className="space-y-3">
                <div className="font-medium text-gray-700">识别文字：</div>
                {ocrResult.result?.words?.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 rounded border-l-4 border-blue-400"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Tag>#{index + 1}</Tag>
                    </div>
                    <div className="text-gray-800">{item.words}</div>
                  </div>
                )) ||
                  ocrResult.result?.OCR?.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-50 rounded border-l-4 border-blue-400"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Tag>#{index + 1}</Tag>
                      </div>
                      <div className="text-gray-800">{item.words}</div>
                    </div>
                  ))}
              </div>

              {/* 原始响应 */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-gray-600">
                  查看原始响应
                </summary>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(ocrResult, null, 2)}
                </pre>
              </details>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📄</div>
              <div>上传图片开始文字识别</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default OcrSection;
