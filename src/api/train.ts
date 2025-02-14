/* eslint-disable @typescript-eslint/no-explicit-any */
import http from '../utils/http';

/**
 * 此文本标签下的所有文章
 *
 * RestBeanListTrainText
 */
export type GetTrainTextByCategoryResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: TrainText[];
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* com.example.entity.vo.response.TrainText
*
* TrainText
*/
export type TrainText = {
  applicablePeople?: string;
  author?: string;
  category?: string;
  grade?: string;
  suggestedDuration?: string;
  text?: string;
  title?: string;
  [property: string]: any;
}

export const GetTrainTextByCategoryAPI = async (category: string) => {
  try {
    const response = await http<GetTrainTextByCategoryResType>({
      url: '/trainText/getTrainTextByCategory',
      method: 'GET',
      params: {
        category,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 音频文件base64编码，byte[]，mp3格式
 *
 * RestBeanTtsVO
 */
export type GetTTSAPIResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: TtsVO;
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* 响应数据
*
* TtsVO
*/
export type TtsVO = {
  audioBase64?: string;
  [property: string]: any;
}

export const GetTTSAPI = async (text: string) => {
  try {
    const response = await http<GetTTSAPIResType>({
      url: '/dysarthria/getTTS',
      method: 'POST',
      data: {
        text,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const GetMicrosoftTTSAPI = async (text: string, language: string, voice: string) => {
  try {
    const response = await http({
      url: `https://eastasia.tts.speech.microsoft.com/cognitiveservices/v1`,
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
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
      responseType: 'arraybuffer',
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const DysarthriaAPI = async (text: string, audioFile: File) => {
  try {
    const formData = new FormData();
    formData.append('audioFile', audioFile);
    const response = await http<DysarthriaResType>({
      url: '/dysarthria/getResult',
      method: 'POST',
      params: {
        text
      },
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}




export const DysarthriaByBase64API = async (text: string, audioBase64: string) => {
  try {
    const response = await http({
      url: '/dysarthria/getResultByBase64',
      method: 'POST',
      data: {
        audioBase64,
        text
      },
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}



/**
 * 返回每个汉字的详细发音信息
 *
 * RestBeanDysarthriaResultVO
 */
export type DysarthriaResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: DysarthriaResultVO;
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* 响应数据
*
* DysarthriaResultVO
*/
export type DysarthriaResultVO = {
  sd?: Sd[];
  single_score?: number[];
  sm?: Sm[];
  total_score?: number;
  ym?: Ym[];
  [property: string]: any;
}

export enum Sd {
  SDDifferent = "SD_DIFFERENT",
  SDSame = "SD_SAME",
}

export enum Sm {
  SmDiffMethod = "SM_DIFF_METHOD",
  SmDiffPart = "SM_DIFF_PART",
  SmDifferent = "SM_DIFFERENT",
  SmSame = "SM_SAME",
}

export enum Ym {
  YmDiffShape = "YM_DIFF_SHAPE",
  YmDiffShapeAndSmooth = "YM_DIFF_SHAPE_AND_SMOOTH",
  YmDiffSmooth = "YM_DIFF_SMOOTH",
  YmDiffStruct = "YM_DIFF_STRUCT",
  YmDifferent = "YM_DIFFERENT",
  YmSame = "YM_SAME",
  YmSameLike = "YM_SAME_LIKE",
}

/**
 * 每个汉字的拼音，不包括声母韵母列表
 *
 * RestBeanPinyinVO
 */
export type GetPinYinResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: PinyinVO;
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* 响应数据
*
* PinyinVO
*/
export type PinyinVO = {
  pinyin?: string[];
  text?: string;
  [property: string]: any;
}

export const GetPinyinAPI = async (text: string) => {
  try {
    const response = await http<GetPinYinResType>({
      url: '/dysarthria/getPinyin',
      method: 'GET',
      params: {
        text,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 每个汉字的拼音声母韵母列表
 *
 * RestBeanPinyinDetailVO
 */
export type GetPinyinDetailResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: PinyinDetailVO;
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* 响应数据
*
* PinyinDetailVO
*/
export type PinyinDetailVO = {
  sm_detail?: Initial[];
  textPinyin?: TextPinyin;
  ym_detail?: Vowel[];
  [property: string]: any;
}

/**
* com.congyan.entity.dto.Initial
*
* Initial
*/
export type Initial = {
  articulationPoint?: string;
  id?: number;
  letter?: string;
  pronunciationMethod?: string;
  [property: string]: any;
}

/**
* TextPinyin
*/
export type TextPinyin = {
  sd?: string[];
  sm?: string[];
  text?: string;
  ym?: string[];
  [property: string]: any;
}

/**
* com.congyan.entity.dto.Vowel
*
* Vowel
*/
export type Vowel = {
  id?: number;
  letter?: string;
  pronunciationType?: string;
  roughStructure?: string;
  smoothStructure?: string;
  [property: string]: any;
}

export const GetPinyinDetailAPI = async (text: string) => {
  try {
    const response = await http<GetPinyinDetailResType>({
      url: '/dysarthria/getPinyinDetail',
      method: 'GET',
      params: {
        text,
      },
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}