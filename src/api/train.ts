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

// --- Practice Detail API (新的评分 API) ---

/**
 * PracticeDetailAPI 的请求体
 */
export type PracticeDetailReqType = {
  text_uuid: string;
  user_text: string;
  recording_uuid: string;
}

/**
 * PracticeDetailAPI 的响应类型
 */
export type PracticeDetailResType = {
  status?: number; // 假设 0 表示成功
  uuid?: string; // 这似乎是结果 UUID，而不是录音 UUID
  score?: number; // 总分
  char_scores?: CharScore[];
  message?: string; // 可选的错误消息
  [property: string]: any;
}

/**
 * 单个字符的分数详情
 */
export type CharScore = {
  score?: number; // 字符分数 (0 到 1?)
  sim_sa?: number; // 声母相似度?
  sim_ya?: number; // 韵母相似度?
  sim_sd?: number; // 声调相似度?
  [property: string]: any;
}

/**
 * 调用新的练习详情/评分 API。
 * @param data 包含 text_uuid, user_text, recording_uuid 的请求体
 * @returns 评分结果。
 */
export const PracticeDetailAPI = async (data: PracticeDetailReqType): Promise<PracticeDetailResType> => {
  try {
    const response = await http<PracticeDetailResType>({
      url: '/practice-detail', // 新的 API 端点
      method: 'POST',
      data,
    });
    // 根据示例检查响应结构
    if (response.data && typeof response.data.status === 'number') {
      return response.data;
    } else {
      console.error("PracticeDetailAPI invalid response format:", response.data); // 保留错误日志
      // 返回表示错误的结构
      return { status: 1, message: "评分接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling PracticeDetailAPI:", error); // 保留错误日志
    if (error.response && error.response.data) {
      // 如果可用，尝试返回后端错误结构
      return error.response.data as PracticeDetailResType;
    }
    // 返回通用错误结构
    return { status: 1, message: error.message || "请求评分接口失败" };
  }
}

// --- Dysarthria API ---

/**
 * 返回每个汉字的详细发音信息 - 此结构可能需要根据新 API 更新
 *
 * RestBeanDysarthriaResult
 */
export type DysarthriaResType = {
  /**
   * 状态码
   */
  code?: number; // 对应 PracticeDetailResType 中的 'status'
  /**
   * 响应数据
   */
  data?: DysarthriaResult;
  id?: number; // 新 API 响应中不存在
  /**
   * 其他消息
   */
  message?: string;
  [property: string]: any;
}

/**
* 响应数据 - 已调整以匹配从 PracticeDetailResType 派生的数据
*
* DysarthriaResult
*/
export type DysarthriaResult = {
  single_score?: CharScore[]; // 更新：现在是 CharScore 对象数组
  total_score?: number; // 从 score 映射而来
  [property: string]: any;
}

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

// 更新的用于保存用户数据的请求类型
export type SaveUserTrainDataReqType = {
  // 与后端确认 sd, sm, ym 是否仍是必需的。暂时传递空数组。
  sd: any[];
  sm: any[];
  text: string; // 原始训练文本
  total_score: number; // 来自 PracticeDetailAPI 的总分
  ym: any[];
  // 如果后端需要其他字段，例如来自 PracticeDetailAPI 的结果 UUID？
  practice_detail_uuid?: string; // 示例：如果后端需要结果 UUID
  [property: string]: any;
}

export const SaveUserTrainDataAPI = async (data: SaveUserTrainDataReqType) => {
  try {
    const response = await http<SaveUserTrainDataResType>({
      url: '/userData/saveUserTrainDta', // 如果更改，请验证端点
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    console.error(error); // 保留错误日志
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
  total_score?: number;
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