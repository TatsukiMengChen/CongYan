import { VivoAigcClient } from "./client";
import { OCRRequest, OCRResponse } from "./types";

export class VivoAigcOcrService {
  private client: VivoAigcClient;

  constructor(client: VivoAigcClient) {
    this.client = client;
  }

  /**
   * 通用OCR识别
   * @param request OCR请求参数
   * @returns OCR响应
   */
  async generalRecognition(request: OCRRequest): Promise<OCRResponse> {
    const response = await this.client.request<OCRResponse>({
      method: "POST",
      url: "/ocr/general_recognition",
      data: request,
    });

    return response;
  }

  /**
   * 图片文字识别（简化版）
   * @param imageBase64 图片base64编码
   * @param options 识别选项
   * @returns 识别结果
   */
  async recognizeText(
    imageBase64: string,
    options: {
      pos?: number;
      businessId?: string;
      sessionId?: string;
      appId?: string;
    } = {},
  ): Promise<OCRResponse> {
    const appId = this.client.getConfig().appId;

    const request: OCRRequest = {
      image: imageBase64,
      pos: options.pos || 2, // 默认返回文字和坐标信息
      businessid: options.businessId || `aigc${appId}`,
      sessid: options.sessionId || this.client.generateUUID(),
    };

    return await this.generalRecognition(request);
  }

  /**
   * 从文件识别文字
   * @param file 图片文件
   * @param options 识别选项
   * @returns 识别结果
   */
  async recognizeFromFile(file: File, options: any = {}): Promise<OCRResponse> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          // 移除data:image/xxx;base64,前缀
          const imageBase64 = base64.split(",")[1];
          const result = await this.recognizeText(imageBase64, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 从URL识别文字
   * @param imageUrl 图片URL
   * @param options 识别选项
   * @returns 识别结果
   */
  async recognizeFromUrl(
    imageUrl: string,
    options: any = {},
  ): Promise<OCRResponse> {
    // 下载图片并转换为base64
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          // 移除data:image/xxx;base64,前缀
          const imageBase64 = base64.split(",")[1];
          const result = await this.recognizeText(imageBase64, options);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * 提取识别结果中的文字
   * @param ocrResponse OCR响应
   * @returns 文字数组
   */
  extractTextFromResponse(ocrResponse: OCRResponse): string[] {
    if (ocrResponse.error_code !== 0) {
      throw new Error(`OCR failed: ${ocrResponse.error_msg}`);
    }

    const result = ocrResponse.result;
    if (!result) {
      return [];
    }

    // 尝试从不同的字段提取文字
    if (result.words) {
      return result.words.map((item) => item.words);
    }

    if (result.OCR) {
      return result.OCR.map((item) => item.words);
    }

    return [];
  }

  /**
   * 提取识别结果中的文字和位置信息
   * @param ocrResponse OCR响应
   * @returns 文字和位置信息数组
   */
  extractTextWithLocation(ocrResponse: OCRResponse): Array<{
    text: string;
    location?: {
      topLeft: { x: number; y: number };
      topRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
      bottomRight: { x: number; y: number };
    };
  }> {
    if (ocrResponse.error_code !== 0) {
      throw new Error(`OCR failed: ${ocrResponse.error_msg}`);
    }

    const result = ocrResponse.result;
    if (!result) {
      return [];
    }

    // 如果有位置信息
    if (result.OCR) {
      return result.OCR.map((item) => ({
        text: item.words,
        location: {
          topLeft: item.location.top_left,
          topRight: item.location.top_right,
          bottomLeft: item.location.down_left,
          bottomRight: item.location.down_right,
        },
      }));
    }

    // 如果只有文字信息
    if (result.words) {
      return result.words.map((item) => ({
        text: item.words,
      }));
    }

    return [];
  }
}

// 支持的图片格式
export const SUPPORTED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "bmp"] as const;

// 预设的businessId配置
export const BUSINESS_IDS = {
  // 支持旋转图像、非正向文字识别
  ADVANCED: "1990173156ceb8a09eee80c293135279",
  // 只支持正向文字识别，耗时较短
  BASIC: "8bf312e702043779ad0f2760b37a0806",
} as const;

// pos参数说明
export const POS_OPTIONS = {
  TEXT_ONLY: 0, // 只返回文字信息
  TEXT_WITH_ABS_POS: 1, // 返回文字和绝对坐标
  TEXT_WITH_REL_POS: 2, // 返回文字和相对坐标（推荐）
} as const;
