import { VivoAigcClient } from "./client";
import { TTSRequest, TTSResponse } from "./types";

export class VivoAigcTtsService {
  private client: VivoAigcClient;
  private ws: WebSocket | null = null;

  constructor(client: VivoAigcClient) {
    this.client = client;
  }

  /**
   * 建立WebSocket连接
   * @param options 连接选项
   * @returns Promise<WebSocket>
   */
  private async connectWebSocket(options: {
    engineId: string;
    userId: string;
    model?: string;
    product?: string;
    package?: string;
    clientVersion?: string;
    systemVersion?: string;
    sdkVersion?: string;
    androidVersion?: string;
  }): Promise<WebSocket> {
    const config = this.client.getConfig();
    const wsUrl =
      config.baseURL
        ?.replace("https://", "wss://")
        .replace("http://", "ws://") || "wss://api-ai.vivo.com.cn";

    // 构建WebSocket URL参数
    const params = {
      engineid: options.engineId,
      system_time: Math.floor(Date.now() / 1000).toString(),
      user_id: options.userId,
      model: options.model || "unknown",
      product: options.product || "unknown",
      package: options.package || "unknown",
      client_version: options.clientVersion || "unknown",
      system_version: options.systemVersion || "unknown",
      sdk_version: options.sdkVersion || "unknown",
      android_version: options.androidVersion || "unknown",
    };

    // 生成鉴权参数并添加到URL
    const authParams = this.generateWSAuthParams("/tts", params);

    // 构建WebSocket URL
    const url = new URL(`${wsUrl}/tts`);
    Object.entries({ ...params, ...authParams }).forEach(([key, value]) => {
      url.searchParams.set(key, String(value));
    });

    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(url.toString());

        ws.onopen = () => {
          resolve(ws);
        };

        ws.onerror = (error) => {
          reject(error);
        };

        ws.onmessage = (event) => {
          try {
            const response = JSON.parse(event.data);
            if (response.error_code === 0) {
              // 连接成功
              resolve(ws);
            } else {
              reject(
                new Error(response.error_msg || "WebSocket connection failed"),
              );
            }
          } catch (e) {
            // 忽略非JSON消息
          }
        };

        // 超时处理
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            ws.close();
            reject(new Error("WebSocket connection timeout"));
          }
        }, 10000);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 生成WebSocket鉴权参数
   * @param uri WebSocket URI
   * @param params URL参数
   * @returns 鉴权参数对象
   */
  private generateWSAuthParams(
    uri: string,
    params: Record<string, string>,
  ): Record<string, string> {
    // 这里需要根据官方文档实现WebSocket的鉴权逻辑
    // 由于官方文档中没有明确说明WebSocket的鉴权方式，这里使用HTTP鉴权的方式
    const config = this.client.getConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = this.generateNonce();

    return {
      "X-AI-GATEWAY-APP-ID": config.appId,
      "X-AI-GATEWAY-TIMESTAMP": timestamp,
      "X-AI-GATEWAY-NONCE": nonce,
      "X-AI-GATEWAY-SIGNED-HEADERS":
        "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
      "X-AI-GATEWAY-SIGNATURE": this.generateSignature(
        config.appKey,
        "GET",
        uri,
        params,
        config.appId,
        timestamp,
        nonce,
      ),
    };
  }

  /**
   * 生成随机字符串
   * @param length 长度
   * @returns 随机字符串
   */
  private generateNonce(length: number = 8): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * 生成签名（简化版）
   * @param appKey 应用密钥
   * @param method 请求方法
   * @param uri 请求URI
   * @param params 参数
   * @param appId 应用ID
   * @param timestamp 时间戳
   * @param nonce 随机字符串
   * @returns 签名
   */
  private generateSignature(
    appKey: string,
    method: string,
    uri: string,
    params: Record<string, string>,
    appId: string,
    timestamp: string,
    nonce: string,
  ): string {
    // 简化的签名实现，实际应该使用与HTTP客户端相同的逻辑
    return "placeholder_signature";
  }

  /**
   * 文字转语音
   * @param text 要转换的文本
   * @param options TTS选项
   * @returns Promise<ArrayBuffer> 音频数据
   */
  async synthesize(
    text: string,
    options: {
      vcn?: string;
      speed?: number;
      volume?: number;
      engineId?: string;
      userId?: string;
      aue?: number;
      auf?: string;
    } = {},
  ): Promise<ArrayBuffer> {
    const engineId = options.engineId || "short_audio_synthesis_jovi";
    const userId =
      options.userId || this.client.generateUUID().replace(/-/g, "");

    // 建立WebSocket连接
    const ws = await this.connectWebSocket({
      engineId,
      userId,
    });

    return new Promise((resolve, reject) => {
      const audioChunks: ArrayBuffer[] = [];
      let isCompleted = false;

      ws.onmessage = (event) => {
        try {
          const response: TTSResponse = JSON.parse(event.data);

          if (response.error_code !== 0) {
            reject(new Error(response.error_msg || "TTS synthesis failed"));
            return;
          }

          if (response.data?.audio) {
            // 解码base64音频数据
            const audioData = this.base64ToArrayBuffer(response.data.audio);
            audioChunks.push(audioData);
          }

          if (response.data?.status === 2) {
            // 合成完成
            isCompleted = true;
            ws.close();

            // 合并所有音频片段
            const totalLength = audioChunks.reduce(
              (sum, chunk) => sum + chunk.byteLength,
              0,
            );
            const result = new ArrayBuffer(totalLength);
            const view = new Uint8Array(result);
            let offset = 0;

            for (const chunk of audioChunks) {
              view.set(new Uint8Array(chunk), offset);
              offset += chunk.byteLength;
            }

            resolve(result);
          }
        } catch (error) {
          reject(error);
        }
      };

      ws.onerror = (error) => {
        reject(error);
      };

      ws.onclose = () => {
        if (!isCompleted) {
          reject(new Error("WebSocket connection closed unexpectedly"));
        }
      };

      // 发送TTS请求
      const request: TTSRequest = {
        aue: options.aue || 0, // PCM格式
        auf: options.auf || "audio/L16;rate=24000",
        vcn: options.vcn || "vivoHelper",
        speed: options.speed || 50,
        volume: options.volume || 50,
        text: this.textToBase64(text),
        encoding: "utf8",
        reqId: Date.now(),
      };

      ws.send(JSON.stringify(request));
    });
  }

  /**
   * 将文本转换为base64
   * @param text 文本
   * @returns base64字符串
   */
  private textToBase64(text: string): string {
    return btoa(unescape(encodeURIComponent(text)));
  }

  /**
   * 将base64转换为ArrayBuffer
   * @param base64 base64字符串
   * @returns ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * 关闭WebSocket连接
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// 支持的语音合成引擎
export const TTS_ENGINES = {
  SHORT_AUDIO: "short_audio_synthesis_jovi", // 短音频合成
  LONG_AUDIO: "long_audio_synthesis_screen", // 长音频合成
  HUMANOID: "tts_humanoid_lam", // 超拟人音色
} as const;

// 支持的音色
export const TTS_VOICES = {
  // 短音频合成音色
  VIVO_HELPER: "vivoHelper", // 奕雯
  YUN_YE: "yunye", // 云野-温柔
  WAN_QING: "wanqing", // 婉清-御姐
  XIAO_FU: "xiaofu", // 晓芙-少女
  XIAO_MENG: "yige_child", // 小萌-女童
  YI_GE: "yige", // 依格
  YI_YI: "yiyi", // 依依
  XIAO_MING: "xiaoming", // 小茗

  // 长音频合成音色
  X2_VIVO_HELPER: "x2_vivoHelper", // 奕雯
  X2_YI_GE: "x2_yige", // 依格-甜美
  X2_YI_GE_NEWS: "x2_yige_news", // 依格-稳重
  X2_YUN_YE: "x2_yunye", // 云野-温柔
  X2_YUN_YE_NEWS: "x2_yunye_news", // 云野-稳重
  X2_M02: "x2_M02", // 怀斌-浑厚
  X2_M05: "x2_M05", // 兆坤-成熟
  X2_M10: "x2_M10", // 亚恒-磁性
  X2_F163: "x2_F163", // 晓云-稳重
  X2_F25: "x2_F25", // 倩倩-清甜
  X2_F22: "x2_F22", // 海蔚-大气
  X2_F82: "x2_F82", // 英文女声

  // 超拟人音色
  F245_NATURAL: "F245_natural", // 知性柔美
  M24: "M24", // 俊朗男声
  M193: "M193", // 理性男声
  GAME_GIRL_YG: "GAME_GIR_YG", // 游戏少女
  GAME_GIRL_MB: "GAME_GIR_MB", // 游戏萌宝
  GAME_GIRL_YJ: "GAME_GIR_YJ", // 游戏御姐
  GAME_GIRL_LTY: "GAME_GIR_LTY", // 电台主播
  YIGE_XIAOV: "YIGEXIAOV", // 依格
  FY_CANTONESE: "FY_CANTONESE", // 粤语
  FY_SICHUANHUA: "FY_SICHUANHUA", // 四川话
  FY_MIAOYU: "FY_MIAOYU", // 苗语
} as const;

// 音频格式
export const AUDIO_FORMATS = {
  PCM: 0,
  OPUS: 1,
} as const;

// 采样率
export const SAMPLE_RATES = {
  RATE_24K: "audio/L16;rate=24000",
} as const;
