import { VivoAigcClient } from "./client";
import {
  DrawTaskRequest,
  DrawTaskResponse,
  DrawTaskResult,
  DrawResponse,
} from "./types";

export class VivoAigcDrawService {
  private client: VivoAigcClient;

  constructor(client: VivoAigcClient) {
    this.client = client;
  }

  /**
   * 提交绘画任务
   * @param request 绘画任务请求
   * @returns 任务响应
   */
  async submitTask(request: DrawTaskRequest): Promise<DrawTaskResponse> {
    const response = await this.client.request<DrawResponse<DrawTaskResponse>>({
      method: "POST",
      url: "/api/v1/task_submit",
      data: request,
    });

    return response.result!;
  }

  /**
   * 查询绘画任务进度
   * @param taskId 任务ID
   * @returns 任务结果
   */
  async getTaskProgress(taskId: string): Promise<DrawTaskResult> {
    const response = await this.client.request<DrawResponse<DrawTaskResult>>({
      method: "GET",
      url: "/api/v1/task_progress",
      params: { task_id: taskId },
    });

    return response.result!;
  }

  /**
   * 文生图
   * @param prompt 描述文本
   * @param options 绘画选项
   * @returns 任务ID
   */
  async textToImage(
    prompt: string,
    options: {
      width?: number;
      height?: number;
      styleConfig?: string;
      userAccount?: string;
      businessCode?: string;
      steps?: number;
      cfgScale?: number;
      negativePrompt?: string;
      seed?: number;
    } = {},
  ): Promise<string> {
    const request: DrawTaskRequest = {
      dataId: this.client.generateDataId(),
      businessCode: options.businessCode || "pc",
      userAccount: options.userAccount || "default_user",
      prompt,
      styleConfig: options.styleConfig || "4cbc9165bc615ea0815301116e7925a3", // 通用v6.0
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 20,
      cfgScale: options.cfgScale || 7,
      negativePrompt: options.negativePrompt,
      seed: options.seed || -1,
      imageType: 1, // URL类型
    };

    const response = await this.submitTask(request);
    return response.task_id;
  }

  /**
   * 图生图
   * @param prompt 描述文本
   * @param initImage 初始图片（base64或URL）
   * @param options 绘画选项
   * @returns 任务ID
   */
  async imageToImage(
    prompt: string,
    initImage: string,
    options: {
      width?: number;
      height?: number;
      styleConfig?: string;
      userAccount?: string;
      businessCode?: string;
      steps?: number;
      cfgScale?: number;
      denoisingStrength?: number;
      negativePrompt?: string;
      seed?: number;
      imageType?: number;
    } = {},
  ): Promise<string> {
    const imageType =
      options.imageType || (initImage.startsWith("data:") ? 0 : 1);

    const request: DrawTaskRequest = {
      dataId: this.client.generateDataId(),
      businessCode: options.businessCode || "pc",
      userAccount: options.userAccount || "default_user",
      prompt,
      initImages: initImage,
      imageType,
      styleConfig: options.styleConfig || "4cbc9165bc615ea0815301116e7925a3", // 通用v6.0
      width: options.width || 1024,
      height: options.height || 1024,
      steps: options.steps || 20,
      cfgScale: options.cfgScale || 7,
      denoisingStrength: options.denoisingStrength || 0.1,
      negativePrompt: options.negativePrompt,
      seed: options.seed || -1,
    };

    const response = await this.submitTask(request);
    return response.task_id;
  }

  /**
   * 等待绘画任务完成
   * @param taskId 任务ID
   * @param maxRetries 最大重试次数
   * @param interval 重试间隔（毫秒）
   * @returns 任务结果
   */
  async waitForTask(
    taskId: string,
    maxRetries: number = 30,
    interval: number = 2000,
  ): Promise<DrawTaskResult> {
    for (let i = 0; i < maxRetries; i++) {
      const result = await this.getTaskProgress(taskId);

      // 根据文档：0队列中，1正在处理，2处理完成，3处理失败，4已取消
      if (result.status === 2) {
        return result;
      }

      if (result.status === 3 || result.status === 4) {
        throw new Error(`Drawing task failed with status: ${result.status}`);
      }

      // 等待一段时间再检查
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Drawing task timeout after ${maxRetries} retries`);
  }

  /**
   * 一键文生图（等待完成）
   * @param prompt 描述文本
   * @param options 绘画选项
   * @returns 生成的图片URLs
   */
  async generateImageFromText(
    prompt: string,
    options: any = {},
  ): Promise<string[]> {
    const taskId = await this.textToImage(prompt, options);
    const result = await this.waitForTask(taskId);
    return result.images_url || [];
  }

  /**
   * 一键图生图（等待完成）
   * @param prompt 描述文本
   * @param initImage 初始图片
   * @param options 绘画选项
   * @returns 生成的图片URLs
   */
  async generateImageFromImage(
    prompt: string,
    initImage: string,
    options: any = {},
  ): Promise<string[]> {
    const taskId = await this.imageToImage(prompt, initImage, options);
    const result = await this.waitForTask(taskId);
    return result.images_url || [];
  }
}

// 预设的风格配置
export const DRAW_STYLES = {
  GENERAL_V6: "4cbc9165bc615ea0815301116e7925a3", // 通用v6.0
  FANTASY_ANIME: "85ae2641576f5c409b273e0f490f15c0", // 梦幻动漫
  REALISTIC: "85062a504de85d719df43f268199c308", // 唯美写实
  FLAME: "b3aacd62d38c5dbfb3f3491c00ba62f0", // 绯红烈焰
  COLORFUL_ANIME: "897c280803be513fa947f914508f3134", // 彩绘日漫
} as const;

// 预设的图片尺寸
export const IMAGE_SIZES = {
  SQUARE_512: { width: 512, height: 512 },
  SQUARE_768: { width: 768, height: 768 },
  SQUARE_1024: { width: 1024, height: 1024 },
  PORTRAIT_768: { width: 768, height: 1024 },
  PORTRAIT_1024: { width: 768, height: 1200 },
  LANDSCAPE_768: { width: 1024, height: 768 },
  LANDSCAPE_1024: { width: 1200, height: 768 },
} as const;
