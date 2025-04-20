import http from '../utils/http';

// --- TTS 接口 ---

/**
 * TTS 响应类型 (根据用户反馈更新)
 */
export type GetTTSResponse = {
  /**
   * 状态码 (0 表示成功)
   */
  status: number;
  /**
   * 音频文件 URL 或 Base64 字符串 (根据实际情况确定)
   */
  audio?: string;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
 * TTS 请求体类型 (自定义后端)
 */
export type GetTTSRequest = {
  text: string;
  voice: string;
}

/**
 * 调用自定义 TTS 接口
 * @param text 要转换的文本
 * @param voice 发音人，默认为 "longxiaochun"
 * @returns 返回 API 的原始响应或错误对象
 */
export const GetTTSAPI = async (text: string, voice: string = "longxiaochun"): Promise<GetTTSResponse> => {
  try {
    const requestData: GetTTSRequest = {
      text: text,
      voice: voice,
    };
    const response = await http<GetTTSResponse>({
      url: '/tts',
      method: 'GET', // 确认方法是否正确
      params: requestData, // 如果是 GET，使用 params；如果是 POST，使用 data
    });
    // 直接返回后端响应数据
    if (response.data && typeof response.data.status === 'number') {
        return response.data;
    } else {
        // 如果响应格式不符合预期，返回错误结构
        console.error("GetTTSAPI invalid response format:", response.data);
        return { status: 1, message: "TTS 接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling GetTTSAPI:", error);
    // 返回统一的错误结构
    if (error.response && error.response.data) {
        // 尝试使用后端返回的错误信息
        return {
            status: error.response.data.status ?? 1,
            message: error.response.data.message ?? "TTS 请求失败",
        };
    }
    return {
        status: 1, // 通用错误状态码
        message: error.message ?? "TTS 请求失败",
    };
  }
}

/**
 * 调用 Microsoft TTS 接口
 * @param text 要转换的文本
 * @param language 语言代码，例如 'zh-CN'
 * @param voice 发音人名称，例如 'zh-CN-XiaoxiaoNeural'
 * @returns 返回 ArrayBuffer 格式的音频数据
 */
export const GetMicrosoftTTSAPI = async (text: string, language: string, voice: string) => {
  try {
    const response = await http({
      url: `https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1`,
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': "YOUR_MICROSOFT_SPEECH_API_KEY", // 请替换为你的 API Key
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      data: `
        <speak version='1.0' xml:lang='${language}'>
          <voice xml:lang='${language}' xml:gender='Female' name='${voice}'>
            ${text}
          </voice>
        </speak>
      `,
      responseType: 'arraybuffer', // 获取二进制数据
    });
    return response.data; // 返回 ArrayBuffer
  } catch (error) {
    console.error("Error calling Microsoft TTS API:", error);
    throw error; // 重新抛出错误，让调用者处理
  }
}
