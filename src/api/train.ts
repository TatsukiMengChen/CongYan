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
  score?: number; // 字符分数 (0 到 1)
  sim_sa?: number; // 声母相似度 (0 到 1)
  sim_ya?: number; // 韵母相似度 (0 到 1)
  sim_sd?: number; // 声调相似度 (0 到 1)
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

// --- Practice Histories API (新的历史记录 API) ---

/**
 * GetPracticeHistoriesAPI 的请求参数类型
 */
export type GetPracticeHistoriesReqType = {
  text_uuid?: string;
  patient_id?: string; // 注意：API 文档是 string，但示例是 number，这里用 string
}

/**
 * GetPracticeHistoriesAPI 的响应类型
 */
export type GetPracticeHistoriesResType = {
  status?: number; // 假设 0 表示成功
  histories?: PracticeHistory[];
  message?: string; // 可选的错误消息
  [property: string]: any;
}

/**
 * 单条练习历史记录
 */
export type PracticeHistory = {
  uuid?: string;
  patient_id?: number;
  text_uuid?: string;
  patient_text?: string; // 用户读出的文本
  score?: number; // 总分 (0-100)
  char_scores?: CharScore[]; // 详细字符分数
  created_at?: string; // ISO 8601 格式时间戳
  updated_at?: string; // ISO 8601 格式时间戳
  [property: string]: any;
}

/**
 * 获取练习历史记录。
 * @param params 包含可选的 text_uuid 和 patient_id
 * @returns 历史记录列表。
 */
export const GetPracticeHistoriesAPI = async (params?: GetPracticeHistoriesReqType): Promise<GetPracticeHistoriesResType> => {
  try {
    const response = await http<GetPracticeHistoriesResType>({
      url: '/practice-histories', // 新的 API 端点
      method: 'GET',
      params, // 将参数传递给请求
    });
    // 根据示例检查响应结构
    if (response.data && typeof response.data.status === 'number') {
      return response.data;
    } else {
      console.error("GetPracticeHistoriesAPI invalid response format:", response.data); // 保留错误日志
      // 返回表示错误的结构
      return { status: 1, message: "获取历史记录接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling GetPracticeHistoriesAPI:", error); // 保留错误日志
    if (error.response && error.response.data) {
      // 如果可用，尝试返回后端错误结构
      return error.response.data as GetPracticeHistoriesResType;
    }
    // 返回通用错误结构
    return { status: 1, message: error.message || "请求历史记录接口失败" };
  }
}

// --- 旧的历史记录 API (GetUserTrainHistoryAPI) ---
// 可以注释掉或删除以下与旧 API 相关的类型和函数

/**
 * 用户记录
 *
 * RestBeanUserTrainDataVO[]
 */
// export type GetUserTrainHistoryResType = { ... }

/**
* UserTrainData[]
*/
// export type UserTrainData = { ... }

/**
* UserInfo
*/
// export type UserInfo = { ... }

/**
* UserTrainDataJson
*/
// export type UserTrainDataJson = { ... }

// export const GetUserTrainHistoryAPI = async () => { ... }

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
    // 假设此 API 也遵循 status: 0 的模式
    if (response.data && typeof response.data.status === 'number') {
        return response.data;
    } else if (response.data && typeof (response.data as any).code === 'number') {
        // 兼容旧的 code 模式 (如果需要)
        // 将 code 映射到 status
        return { ...response.data, status: (response.data as any).code === 200 ? 0 : (response.data as any).code };
    }
     else {
      console.error("GetSummaryAnalysisAPI invalid response format:", response.data);
      return { status: 1, message: "获取总结分析接口返回格式错误" };
    }
  } catch (error: any) {
    console.error("Error calling GetSummaryAnalysisAPI:", error);
     if (error.response && error.response.data) {
      return error.response.data as GetSummaryAnalysisResType;
    }
    return { status: 1, message: error.message || "请求总结分析接口失败" };
  }
}