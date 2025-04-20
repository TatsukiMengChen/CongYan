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

// --- TTS API and types moved to tts.ts ---

// --- Dysarthria API ---
// Old DysarthriaAPI might be deprecated or used differently now
// export const DysarthriaAPI = async (text: string, audioFile: File) => { ... }
// export const DysarthriaByBase64API = async (text: string, audioBase64: string) => { ... }

/**
 * 使用录音 UUID 获取评分结果
 * @param recordingUuid ASR 服务返回的录音 UUID
 * @param text 原始训练文本
 * @returns 返回评分结果，结构同 DysarthriaResType
 */
export const ScoreRecordingAPI = async (recordingUuid: string, text: string): Promise<DysarthriaResType> => {
  try {
    // TODO: 确认评分接口的实际 URL 和参数名
    const response = await http<DysarthriaResType>({
      url: '/score/getResultByUuid', // 假设的评分接口 URL
      method: 'GET', // 或 'POST'，根据后端接口定义
      params: {
        recordingUuid, // 假设参数名为 recordingUuid
        text,          // 假设需要传递原始文本
      },
    });
    // 检查返回的数据结构
    if (response.data && typeof response.data.code === 'number') {
        return response.data;
    } else {
        console.error("ScoreRecordingAPI invalid response format:", response.data);
        return { code: 1, message: "评分接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling ScoreRecordingAPI:", error);
    if (error.response && error.response.data) {
      return error.response.data as DysarthriaResType;
    }
    return { code: 1, message: error.message || "获取评分失败" };
  }
}


/**
 * 返回每个汉字的详细发音信息
 *
 * RestBeanDysarthriaResult
 */
export type DysarthriaResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: DysarthriaResult;
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
* DysarthriaResult
*/
export type DysarthriaResult = {
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

// --- Pinyin API and types moved to hanzi.ts ---

// --- User Data API ---

/**
 * 成功保存
 *
 * RestBeanVoid
 */
export type SaveUserTrainDataResType = {
  /**
   * 错误码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: null;
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

export type SaveUserTrainDataReqType = {
  sd: Sd[];
  sm: Sm[];
  text: string;
  total_score: number;
  ym: Ym[];
  [property: string]: any;
}

export const SaveUserTrainDataAPI = async (data: SaveUserTrainDataReqType) => {
  try {
    const response = await http<SaveUserTrainDataResType>({
      url: '/userData/saveUserTrainDta',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 用户记录
 *
 * RestBeanUserTrainDataVO[]
 */
export type GetUserTrainHistoryResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: UserTrainData[];
  id?: number;
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* UserTrainData[]
*/
export type UserTrainData = {
  id?: number;
  time?: string;
  userId?: number;
  userInfoVO?: UserInfo;
  userTrainData?: UserTrainDataJson;
  [property: string]: any;
}

/**
* UserInfo
*/
export type UserInfo = {
  email?: string;
  username?: string;
  [property: string]: any;
}

/**
* UserTrainDataJson
*/
export type UserTrainDataJson = {
  sd?: string[];
  sd_enums?: Sd[];
  sm?: string[];
  sm_enums?: Sm[];
  total_score?: number;
  ym?: string[];
  ym_enums?: Ym[];
  [property: string]: any;
}

export const GetUserTrainHistoryAPI = async () => {
  try {
    const response = await http<GetUserTrainHistoryResType>({
      url: '/userData/getUserTrainHistory',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * 返回一个根据时间指数衰减得到的分析数据结构
 *
 * RestBeanUserTrainSummaryAnalysisVO
 */
export type GetSummaryAnalysisResType = {
  /**
   * 状态码
   */
  code?: number;
  /**
   * 响应数据
   */
  data?: UserTrainSummaryAnalysisVO;
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
* UserTrainSummaryAnalysisVO
*/
export type UserTrainSummaryAnalysisVO = {
  /**
   * 发音方法
   */
  method_score?: number;
  /**
   * 发音部位
   */
  part_score?: number;
  /**
   * 发音声调
   */
  sd_score?: number;
  /**
   * 发音口型
   */
  shape_score?: number;
  /**
   * 发音结构
   */
  struct_score?: number;
  /**
   * 总评分
   */
  total_score?: number;
  [property: string]: any;
}

export const GetSummaryAnalysisAPI = async () => {
  try {
    const response = await http<GetSummaryAnalysisResType>({
      url: '/userData/getSummaryAnalysis',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}