import http from "../utils/http"; // 更改导入为 http

// --- 语料接口 ---

// 创建语料请求体类型
export interface CreateCorpusPayload {
  title: string;
  text: string;
}

// 创建语料响应类型
export interface CreateCorpusResponse {
  status: number;
  code?: string; // 成功时可能返回 code
  message?: string; // 失败时返回 message
}

/**
 * 创建新的练习语料
 * @param payload 包含标题和文本内容
 * @returns
 */
export const CreateCorpusAPI = async (
  payload: CreateCorpusPayload
): Promise<CreateCorpusResponse> => {
  console.log("调用创建语料接口, payload:", payload);
  try {
    const res = await http.post<CreateCorpusResponse>("/practice-text", payload);
    console.log("创建语料接口响应:", res.data);
    // 检查返回的数据结构是否符合预期
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("创建语料接口返回数据格式错误:", res.data);
      return {
        status: 1, // 或者其他错误码
        code: "invalidResponseFormat",
        message: "创建语料接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("创建语料接口错误:", error);
    if (error.response && error.response.data) {
      // 尝试返回后端提供的错误信息
      return error.response.data as CreateCorpusResponse;
    }
    // 返回通用错误结构
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "创建语料失败"
    };
  }
};

// 单个语料信息类型
export interface CorpusInfo {
  uuid: string;
  title: string;
  text: string;
  add_by: string; // 'doctor' or 'patient' etc.
  add_by_id: number;
  createdAt: string;
  updatedAt: string;
}

// 获取语料列表响应类型
export interface GetCorpusResponse {
  status: number;
  texts?: CorpusInfo[];
  message?: string; // 失败时返回 message
}

/**
 * 获取练习语料列表
 * @param text_uuid 可选参数，用于获取特定语料
 * @returns
 */
export const GetCorpusAPI = async (
  text_uuid?: string
): Promise<GetCorpusResponse> => {
  const params = text_uuid ? { text_uuid } : {};
  console.log("调用获取语料列表接口, params:", params);
  try {
    const res = await http.get<GetCorpusResponse>("/practice-texts", { params });
    console.log("获取语料列表接口响应:", res.data);
    // 检查返回的数据结构是否符合预期
    if (res.data && typeof res.data.status === 'number') {
      // 确保 texts 字段存在或是 null/undefined，符合接口定义
      if (res.data.status === 0 && !Array.isArray(res.data.texts)) {
         // 如果成功但 texts 不是数组，可能需要修正或记录警告
         console.warn("获取语料列表成功，但 texts 字段不是数组:", res.data.texts);
         // 可以选择返回空数组或保持原样，取决于业务逻辑
         // res.data.texts = [];
      }
      return res.data;
    } else {
      console.error("获取语料列表接口返回数据格式错误:", res.data);
      return {
        status: 1, // 或者其他错误码
        message: "获取语料列表接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("获取语料列表接口错误:", error);
    if (error.response && error.response.data) {
      // 尝试返回后端提供的错误信息
      return error.response.data as GetCorpusResponse;
    }
    // 返回通用错误结构
    return {
      status: 1,
      message: error.message || "获取语料列表失败"
    };
  }
};

// 删除语料响应类型
export interface DeleteCorpusResponse {
  status: number;
  code?: string; // 可能包含特定错误代码，例如 'CORPUS_HAS_TASKS'
  message?: string;
}

/**
 * 删除指定的练习语料
 * @param text_uuid 要删除的语料的 UUID
 * @returns
 */
export const DeleteCorpusAPI = async (
  text_uuid: string
): Promise<DeleteCorpusResponse> => {
  console.log("调用删除语料接口, text_uuid:", text_uuid);
  try {
    const res = await http.delete<DeleteCorpusResponse>("/practice-text", {
      params: { text_uuid },
    });
    console.log("删除语料接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("删除语料接口返回数据格式错误:", res.data);
      return {
        status: 1,
        code: "invalidResponseFormat",
        message: "删除语料接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("删除语料接口错误:", error);
    if (error.response && error.response.data) {
      // 后端可能在 data 中返回 status 和 message/code
      return error.response.data as DeleteCorpusResponse;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "删除语料失败"
    };
  }
};
