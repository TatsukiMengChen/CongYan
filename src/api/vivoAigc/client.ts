import CryptoJS from "crypto-js";
import { v4 as uuidv4 } from "uuid";
import { VivoAigcConfig, RequestOptions, VivoAigcError } from "./types";

// 生成8位随机字符串
function generateNonce(length: number = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 生成canonical_query_string
function generateCanonicalQueryString(
  params: Record<string, string> = {},
): string {
  if (!params || Object.keys(params).length === 0) {
    return "";
  }

  const sortedKeys = Object.keys(params).sort();
  const encoded = sortedKeys.map((key) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(params[key]);
    return `${encodedKey}=${encodedValue}`;
  });

  return encoded.join("&");
}

// 生成签名
function generateSignature(
  appKey: string,
  method: string,
  uri: string,
  canonicalQueryString: string,
  appId: string,
  timestamp: string,
  nonce: string,
): string {
  const signedHeadersString = `x-ai-gateway-app-id:${appId}\nx-ai-gateway-timestamp:${timestamp}\nx-ai-gateway-nonce:${nonce}`;

  const signingString = `${method}\n${uri}\n${canonicalQueryString}\n${appId}\n${timestamp}\n${signedHeadersString}`;

  const hash = CryptoJS.HmacSHA256(signingString, appKey);
  return CryptoJS.enc.Base64.stringify(hash);
}

// 生成鉴权头
function generateAuthHeaders(
  appId: string,
  appKey: string,
  method: string,
  uri: string,
  params: Record<string, string> = {},
): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const nonce = generateNonce();
  const canonicalQueryString = generateCanonicalQueryString(params);

  const signature = generateSignature(
    appKey,
    method.toUpperCase(),
    uri,
    canonicalQueryString,
    appId,
    timestamp,
    nonce,
  );

  return {
    "X-AI-GATEWAY-APP-ID": appId,
    "X-AI-GATEWAY-TIMESTAMP": timestamp,
    "X-AI-GATEWAY-NONCE": nonce,
    "X-AI-GATEWAY-SIGNED-HEADERS":
      "x-ai-gateway-app-id;x-ai-gateway-timestamp;x-ai-gateway-nonce",
    "X-AI-GATEWAY-SIGNATURE": signature,
  };
}

// HTTP请求工具类
export class VivoAigcClient {
  private config: VivoAigcConfig;

  constructor(config: VivoAigcConfig) {
    this.config = {
      ...config,
      baseURL: config.baseURL || "https://api-ai.vivo.com.cn",
    };
  }

  async request<T>(options: RequestOptions): Promise<T> {
    const { method, url, data, params = {} } = options;

    // 解析URI
    const fullUrl = `${this.config.baseURL}${url}`;
    const urlObj = new URL(fullUrl);
    const uri = urlObj.pathname;

    // 合并URL参数和传入的params
    const allParams: Record<string, string> = { ...params };
    urlObj.searchParams.forEach((value, key) => {
      allParams[key] = value;
    });

    // 生成鉴权头
    const authHeaders = generateAuthHeaders(
      this.config.appId,
      this.config.appKey,
      method,
      uri,
      allParams,
    );

    // 构建请求头
    const headers: Record<string, string> = {
      ...authHeaders,
    };

    // 添加Authorization头部（token认证）
    const token = localStorage.getItem("token");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // 构建请求URL
    const requestUrl = new URL(fullUrl);
    Object.keys(allParams).forEach((key) => {
      requestUrl.searchParams.set(key, allParams[key]);
    });

    // 根据请求方法和URL设置Content-Type
    if (method.toUpperCase() === "POST") {
      if (url.includes("/ocr/")) {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      } else {
        headers["Content-Type"] = "application/json";
      }
    }

    // 发送请求
    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers,
    };

    if (data) {
      if (headers["Content-Type"] === "application/x-www-form-urlencoded") {
        // 对于OCR接口，使用form-data格式
        const formData = new URLSearchParams();
        Object.keys(data).forEach((key) => {
          formData.append(key, data[key]);
        });
        fetchOptions.body = formData;
      } else {
        // 对于其他接口，使用JSON格式
        fetchOptions.body = JSON.stringify(data);
      }
    }

    try {
      const response = await fetch(requestUrl.toString(), fetchOptions);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // 检查业务错误
      if (
        result.code !== undefined &&
        result.code !== 0 &&
        result.code !== 200
      ) {
        const error: VivoAigcError = {
          code: result.code,
          message: result.msg || result.error_msg || "Unknown error",
          details: result,
        };
        throw error;
      }

      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Request failed");
    }
  }

  // 生成UUID
  generateUUID(): string {
    return uuidv4();
  }

  // 生成32位随机字符串（用于dataId）
  generateDataId(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // 获取配置
  getConfig(): VivoAigcConfig {
    return { ...this.config };
  }
}

// 创建默认实例
export const createVivoAigcClient = (
  config: VivoAigcConfig,
): VivoAigcClient => {
  return new VivoAigcClient(config);
};
