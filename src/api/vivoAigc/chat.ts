import { VivoAigcClient } from "./client";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  BaseResponse,
  ChatMessage,
} from "./types";

export class VivoAigcChatService {
  private client: VivoAigcClient;

  constructor(client: VivoAigcClient) {
    this.client = client;
  }

  /**
   * 大模型对话完成
   * @param request 请求参数
   * @returns 对话响应
   */
  async completions(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    const requestId = this.client.generateUUID();

    const response = await this.client.request<
      BaseResponse<ChatCompletionResponse>
    >({
      method: "POST",
      url: "/vivogpt/completions",
      params: {
        requestId,
      },
      data: request,
    });

    return response.data!;
  }

  /**
   * 简单文本对话
   * @param prompt 用户输入
   * @param options 可选参数
   * @returns 对话响应
   */
  async chat(
    prompt: string,
    options: {
      model?: string;
      sessionId?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Promise<string> {
    const request: ChatCompletionRequest = {
      prompt,
      model: options.model || "vivo-BlueLM-TB-Pro",
      sessionId: options.sessionId || this.client.generateUUID(),
      systemPrompt: options.systemPrompt,
      extra: {
        temperature: options.temperature || 0.9,
        max_new_tokens: options.maxTokens || 2048,
      },
    };

    const response = await this.completions(request);
    return response.content;
  }

  /**
   * 多轮对话
   * @param messages 对话消息列表
   * @param options 可选参数
   * @returns 对话响应
   */
  async chatWithMessages(
    messages: ChatMessage[],
    options: {
      model?: string;
      sessionId?: string;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    } = {},
  ): Promise<string> {
    const request: ChatCompletionRequest = {
      messages,
      model: options.model || "vivo-BlueLM-TB-Pro",
      sessionId: options.sessionId || this.client.generateUUID(),
      systemPrompt: options.systemPrompt,
      extra: {
        temperature: options.temperature || 0.9,
        max_new_tokens: options.maxTokens || 2048,
      },
    };

    const response = await this.completions(request);
    return response.content;
  }

  /**
   * 流式对话 - 暂不支持，官方文档中没有流式接口
   */
  async streamChat(
    prompt: string,
    onMessage: (content: string) => void,
    options: any = {},
  ): Promise<void> {
    throw new Error("Stream chat is not supported by Vivo AIGC API");
  }
}

// 常用的模型配置
export const VIVO_MODELS = {
  BLUELM_TB_PRO: "vivo-BlueLM-TB-Pro",
} as const;

// 预设的系统提示词
export const SYSTEM_PROMPTS = {
  ASSISTANT: "你是一个有用的AI助手，请用中文回答用户的问题。",
  CREATIVE: "你是一个富有创造力的AI助手，擅长创意写作和头脑风暴。",
  PROFESSIONAL: "你是一个专业的AI助手，请提供准确、详细的专业回答。",
  FRIENDLY: "你是一个友好的AI助手，请用温暖、亲切的语气与用户交流。",
} as const;
