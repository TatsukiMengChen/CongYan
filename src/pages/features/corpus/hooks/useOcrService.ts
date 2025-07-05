import { useState, useCallback } from "react";
import { message } from "antd";
import { vivoAigcSDK } from "../../../../api/vivoAigc";

// OCR识别结果类型
export interface OcrResult {
  text: string;
  confidence: number;
  segments: Array<{
    text: string;
    location?: {
      topLeft: { x: number; y: number };
      topRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
      bottomRight: { x: number; y: number };
    };
  }>;
  metadata: {
    imageSize?: { width: number; height: number };
    processingTime?: number;
    recognizedAt: string;
  };
}

// OCR选项
export interface OcrOptions {
  autoFormat?: boolean; // 是否自动格式化为儿童友好格式
  mergeLines?: boolean; // 是否合并文本行
  removeNoise?: boolean; // 是否移除噪声字符
}

export const useOcrService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  /**
   * 验证图片文件
   */
  const validateImageFile = useCallback((file: File): boolean => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/bmp"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      message.error("只支持 JPG、PNG、BMP 格式的图片");
      return false;
    }

    if (file.size > maxSize) {
      message.error("图片大小不能超过 10MB");
      return false;
    }

    return true;
  }, []);

  /**
   * 处理图片上传
   */
  const handleImageUpload = useCallback(
    (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!validateImageFile(file)) {
          reject(new Error("图片验证失败"));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setImagePreview(result);
          resolve(result);
        };
        reader.onerror = () => {
          reject(new Error("图片读取失败"));
        };
        reader.readAsDataURL(file);
      });
    },
    [validateImageFile],
  );

  /**
   * 执行OCR识别
   */
  const recognizeText = useCallback(
    async (
      imageBase64: string,
      options: OcrOptions = {},
    ): Promise<OcrResult> => {
      if (!imageBase64) {
        throw new Error("请先上传图片");
      }

      setLoading(true);
      setError(null);

      try {
        const startTime = Date.now();

        // 提取base64数据（移除data:image/xxx;base64,前缀）
        const base64Data = imageBase64.includes(",")
          ? imageBase64.split(",")[1]
          : imageBase64;

        const response = await vivoAigcSDK.ocr.recognizeText(base64Data, {
          pos: 2, // 返回文字和相对坐标
        });

        if (response.error_code !== 0) {
          throw new Error(response.error_msg || "OCR识别失败");
        }

        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // 提取识别结果
        const segments = vivoAigcSDK.ocr.extractTextWithLocation(response);
        const allText = segments.map((seg) => seg.text).join("\n");

        let processedText = allText;

        // 后处理选项
        if (options.removeNoise) {
          processedText = processedText
            .replace(
              /[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef\s\n\r\t\w.,!?;:'"()（）【】《》""''—…]/g,
              "",
            )
            .replace(/\s+/g, " ")
            .trim();
        }

        if (options.mergeLines) {
          processedText = processedText.replace(/\n+/g, "\n");
        }

        // 计算置信度（简化版）
        const confidence = Math.min(0.95, 0.7 + segments.length * 0.05);

        const result: OcrResult = {
          text: processedText,
          confidence,
          segments,
          metadata: {
            processingTime,
            recognizedAt: new Date().toISOString(),
          },
        };

        message.success(`识别成功，共识别到 ${segments.length} 段文字`);
        return result;
      } catch (err: any) {
        const errorMessage = `OCR识别失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  /**
   * 从文件识别文字
   */
  const recognizeFromFile = useCallback(
    async (file: File, options: OcrOptions = {}): Promise<OcrResult> => {
      try {
        const imageBase64 = await handleImageUpload(file);
        return await recognizeText(imageBase64, options);
      } catch (err: any) {
        const errorMessage = `文件识别失败: ${err.message}`;
        setError(errorMessage);
        message.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    [handleImageUpload, recognizeText],
  );

  /**
   * 清空结果
   */
  const clearResults = useCallback(() => {
    setImagePreview("");
    setError(null);
  }, []);

  /**
   * 获取图片尺寸
   */
  const getImageSize = useCallback(
    (imageBase64: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.src = imageBase64;
      });
    },
    [],
  );

  /**
   * 预处理图片（可选功能）
   */
  const preprocessImage = useCallback(
    (imageBase64: string): Promise<string> => {
      return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;

          if (ctx) {
            // 简单的对比度增强
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height,
            );
            const data = imageData.data;

            // 增强对比度
            const factor = 1.2;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] * factor); // Red
              data[i + 1] = Math.min(255, data[i + 1] * factor); // Green
              data[i + 2] = Math.min(255, data[i + 2] * factor); // Blue
            }

            ctx.putImageData(imageData, 0, 0);
            resolve(canvas.toDataURL("image/jpeg", 0.9));
          } else {
            resolve(imageBase64);
          }
        };

        img.src = imageBase64;
      });
    },
    [],
  );

  return {
    loading,
    error,
    imagePreview,
    recognizeText,
    recognizeFromFile,
    handleImageUpload,
    clearResults,
    getImageSize,
    preprocessImage,
  };
};
