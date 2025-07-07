// 导出类型定义
export * from "./types";

// 导出基础客户端
export { VivoAigcClient, createVivoAigcClient } from "./client";

// 导出各个服务
export { VivoAigcChatService, VIVO_MODELS, SYSTEM_PROMPTS } from "./chat";
export { VivoAigcDrawService, DRAW_STYLES, IMAGE_SIZES } from "./draw";
export {
  VivoAigcOcrService,
  SUPPORTED_IMAGE_FORMATS,
  BUSINESS_IDS,
  POS_OPTIONS,
} from "./ocr";
export {
  VivoAigcTtsService,
  TTS_ENGINES,
  TTS_VOICES,
  AUDIO_FORMATS,
  SAMPLE_RATES,
} from "./tts";

// 导入必要的类型
import { VivoAigcConfig } from "./types";
import { VivoAigcClient } from "./client";
import { VivoAigcChatService } from "./chat";
import { VivoAigcDrawService } from "./draw";
import { VivoAigcOcrService } from "./ocr";
import { VivoAigcTtsService } from "./tts";

// 主要的SDK类
export class VivoAigcSDK {
  private client: VivoAigcClient;
  public chat: VivoAigcChatService;
  public draw: VivoAigcDrawService;
  public ocr: VivoAigcOcrService;
  public tts: VivoAigcTtsService;

  constructor(config: VivoAigcConfig) {
    this.client = new VivoAigcClient(config);
    this.chat = new VivoAigcChatService(this.client);
    this.draw = new VivoAigcDrawService(this.client);
    this.ocr = new VivoAigcOcrService(this.client);
    this.tts = new VivoAigcTtsService(this.client);
  }

  /**
   * 获取客户端实例
   */
  getClient(): VivoAigcClient {
    return this.client;
  }

  /**
   * 生成UUID
   */
  generateUUID(): string {
    return this.client.generateUUID();
  }

  /**
   * 生成数据ID
   */
  generateDataId(): string {
    return this.client.generateDataId();
  }
}

// 创建SDK实例的便捷函数
export const createVivoAigcSDK = (config: VivoAigcConfig): VivoAigcSDK => {
  return new VivoAigcSDK(config);
};

// 默认配置
export const DEFAULT_CONFIG: Partial<VivoAigcConfig> = {
  baseURL: "https://api-ai.vivo.com.cn",
};

// 创建带默认配置的SDK实例
export const createVivoAigcSDKWithDefaults = (
  config: Omit<VivoAigcConfig, "baseURL"> & { baseURL?: string },
): VivoAigcSDK => {
  return new VivoAigcSDK({
    ...DEFAULT_CONFIG,
    ...config,
  } as VivoAigcConfig);
};

// 创建全局SDK实例
const createGlobalSDK = (): VivoAigcSDK => {
  const config: VivoAigcConfig = {
    appId: import.meta.env.VITE_VIVO_AIGC_APP_ID || "",
    appKey: import.meta.env.VITE_VIVO_AIGC_APP_KEY || "",
    baseURL:
      import.meta.env.VITE_VIVO_AIGC_BASE_URL || "https://api-ai.vivo.com.cn",
  };

  return new VivoAigcSDK(config);
};

// 导出全局SDK实例
export const vivoAigcSDK = createGlobalSDK();

// 便捷的服务创建函数
export const createChatService = (config: VivoAigcConfig) => {
  const client = new VivoAigcClient(config);
  return new VivoAigcChatService(client);
};

export const createDrawService = (config: VivoAigcConfig) => {
  const client = new VivoAigcClient(config);
  return new VivoAigcDrawService(client);
};

export const createOcrService = (config: VivoAigcConfig) => {
  const client = new VivoAigcClient(config);
  return new VivoAigcOcrService(client);
};

export const createTtsService = (config: VivoAigcConfig) => {
  const client = new VivoAigcClient(config);
  return new VivoAigcTtsService(client);
};

// 版本信息
export const VERSION = "1.0.0";

// 默认导出SDK类
export default VivoAigcSDK;
