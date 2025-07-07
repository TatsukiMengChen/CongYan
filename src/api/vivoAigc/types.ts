// 基础配置接口
export interface VivoAigcConfig {
  appId: string;
  appKey: string;
  baseURL?: string;
}

// 基础响应接口
export interface BaseResponse<T = any> {
  code: number;
  msg: string;
  data?: T;
}

// 绘画API专用响应接口
export interface DrawResponse<T = any> {
  code: number;
  msg: string;
  result?: T;
}

// 大模型相关类型
export interface ChatMessage {
  role: "user" | "assistant" | "system" | "function";
  content: string;
}

export interface ChatCompletionRequest {
  prompt?: string;
  messages?: ChatMessage[];
  model: string;
  sessionId: string;
  systemPrompt?: string;
  extra?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    max_new_tokens?: number;
    repetition_penalty?: number;
  };
}

export interface ChatCompletionResponse {
  content: string;
  sessionId: string;
  requestId: string;
  provider: string;
  model: string;
}

// AI绘画相关类型
export interface DrawTaskRequest {
  dataId: string;
  businessCode: string;
  userAccount: string;
  prompt?: string;
  initImages?: string;
  imageType?: number;
  styleConfig: string;
  height: number;
  width: number;
  seed?: number;
  cfgScale?: number;
  denoisingStrength?: number;
  ctrlNetStrength?: number;
  steps?: number;
  negativePrompt?: string;
}

export interface DrawTaskResponse {
  task_id: string;
  task_type: string;
  task_params: Record<string, any>;
  model: string;
}

export interface DrawTaskResult {
  task_id: string;
  task_type: string;
  status: number; // 0：队列中，1：正在处理，2：处理完成，3：处理失败，4：已取消
  model: string;
  finished: boolean;
  images_url?: string[];
  image_gaia_key?: string[];
  queue_ahead?: number;
  task_eta?: number;
  images_audit?: string[];
  images_audit_status?: number[];
}

// TTS相关类型
export interface TTSRequest {
  aue: number;
  auf: string;
  vcn: string;
  speed?: number;
  volume?: number;
  text: string;
  encoding: string;
  reqId: number;
}

export interface TTSResponse {
  error_code: number;
  error_msg: string;
  sid?: string;
  ver?: string;
  data?: {
    status: number;
    progress: string;
    audio: string;
    slice: number;
  };
}

// OCR相关类型
export interface OCRRequest {
  image: string;
  pos: string | number;
  businessid: string;
  sessid?: string;
}

export interface OCRResponse {
  error_code: number;
  error_msg: string;
  result?: {
    words?: Array<{ words: string }>;
    OCR?: Array<{
      words: string;
      location: {
        top_left: { x: number; y: number };
        top_right: { x: number; y: number };
        down_left: { x: number; y: number };
        down_right: { x: number; y: number };
      };
    }>;
    angle?: number;
  };
  version?: string;
  support?: string;
}

// 请求选项
export interface RequestOptions {
  method: string;
  url: string;
  data?: any;
  params?: Record<string, string>;
}

// 错误类型
export interface VivoAigcError {
  code: number;
  message: string;
  details?: any;
}
