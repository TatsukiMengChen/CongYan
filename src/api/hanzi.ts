import http from '../utils/http';

// --- 新的汉字注音接口 ---

/**
 * 汉字注音信息
 */
export type HanziPhonetics = {
  hanzi: string;
  pinyin_with_tone_mark: string; // 带声调符号的拼音，例如 "hàn"
  pinyin_with_tone_num: string;  // 带声调数字的拼音，例如 "han4"
  shengmu: string;               // 声母，例如 "h"
  yunmu: string;                 // 韵母，例如 "an"
  yindiao: number;               // 音调，数字 1-4 或 0 (轻声)
  shengmu_fayin_buwei?: string;  // 声母发音部位，例如 "舌根" (可选)
  shengmu_fayin_fangshi?: string; // 声母发音方式，例如 "擦音" (可选)
  yunmu_jiegou?: string;         // 韵母结构，例如 "前鼻韵母" (可选)
  [property: string]: any;
};

/**
 * 获取汉字注音接口响应类型
 */
export type GetHanziPhoneticsResType = {
  status: number; // 0 表示成功
  phonetics?: HanziPhonetics;
  message?: string; // 失败时返回消息
  [property: string]: any;
};

/**
 * 获取单个汉字的注音信息
 * @param character 单个汉字
 * @returns
 */
export const GetHanziPhoneticsAPI = async (character: string): Promise<GetHanziPhoneticsResType> => {
  // 确保只传递单个字符
  if (character.length !== 1) {
    console.error("GetHanziPhoneticsAPI requires a single character.");
    return { status: 1, message: "参数错误：需要单个汉字" };
  }
  try {
    const response = await http.get<GetHanziPhoneticsResType>('/hanzi-phonetics', {
      params: {
        character,
      },
    });
    // 检查返回的数据结构
    if (response.data && typeof response.data.status === 'number') {
        if (response.data.status === 0 && !response.data.phonetics) {
            console.warn("GetHanziPhoneticsAPI success but phonetics is missing:", response.data);
            // 可以根据需要返回错误或默认值
            return { status: 1, message: "获取成功但未返回注音信息" };
        }
        return response.data;
    } else {
        console.error("GetHanziPhoneticsAPI invalid response format:", response.data);
        return { status: 1, message: "接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling GetHanziPhoneticsAPI:", error);
    if (error.response && error.response.data) {
      return error.response.data as GetHanziPhoneticsResType;
    }
    return { status: 1, message: error.message || "获取汉字注音失败" };
  }
};
