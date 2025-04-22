import http from '../utils/http';
import { UserInfo } from './user'; // 复用 UserInfo 类型，因为结构相似
import { CorpusInfo } from './text'; // 引入 CorpusInfo 类型

// Patient 类型可以基于 UserInfo，但可能只需要部分字段或有细微差别
// 这里我们假设 Patient 列表返回的用户信息结构与 UserInfo 一致
export type PatientInfo = UserInfo;

// 获取病人列表接口返回类型
export type PatientsListAPIRes = {
  status: number;
  code?: string; // 可选的响应代码
  patients?: PatientInfo[]; // 病人列表，成功时存在
  message?: string;
}

// 获取病人列表接口
export const GetPatientsAPI = async (): Promise<PatientsListAPIRes> => {
  console.log("调用获取病人列表接口");
  try {
    const res = await http.get<PatientsListAPIRes>('/patients');
    console.log("获取病人列表接口响应:", res.data);
    // 检查返回的数据结构是否符合预期
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      // 如果数据结构不符合预期，返回错误结构
      console.error("获取病人列表接口返回数据格式错误:", res.data);
      return {
        status: 1, // 或者其他错误码
        code: "invalidResponseFormat",
        message: "获取病人列表接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("获取病人列表接口错误:", error);
    if (error.response && error.response.data) {
      // 尝试返回后端提供的错误信息
      return error.response.data as PatientsListAPIRes;
    }
    // 返回通用错误结构
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "获取病人列表失败"
    };
  }
};

// 绑定病人接口返回类型 (供医生和家属共用)
export type BindPatientAPIRes = {
  status: number;
  code?: string;
  message?: string;
  // 绑定成功时，后端可能会返回病人信息，尤其是对家属
  patient_info?: PatientInfo;
}

// 绑定病人接口 (供医生和家属共用)
// 医生: POST /bind-id?bind_id={patient_bind_id}
// 家属: POST /bind-id?bind_id={patient_bind_id} (假设后端能区分角色)
export const BindPatientAPI = async (bindId: string): Promise<BindPatientAPIRes> => {
  console.log("调用绑定病人接口 (通用), bind_id:", bindId);
  try {
    // 使用 POST 方法，并将 bind_id 作为 query 参数传递
    const res = await http.post<BindPatientAPIRes>('/bind-id', null, {
      params: {
        bind_id: bindId
      }
    });
    console.log("绑定病人接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("绑定病人接口返回数据格式错误:", res.data);
      return {
        status: 1,
        code: "invalidResponseFormat",
        message: "绑定病人接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("绑定病人接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as BindPatientAPIRes;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "绑定病人失败"
    };
  }
};

// 解绑病人接口返回类型 (供医生和家属共用)
export type UnbindPatientAPIRes = {
  status: number;
  code?: string;
  message?: string;
}

// 解绑病人接口 (供医生和家属共用)
// 医生: DELETE /patient-bind-id?unbind_id={patient_id}
// 家属: DELETE /patient-bind-id (假设后端知道要解绑哪个病人，或者家属只能解绑自己绑定的那个)
// 注意：如果家属解绑不需要传 ID，需要调整调用方式。这里暂时假设家属解绑也需要传病人 ID (虽然家属通常只绑定一个)
// 或者后端提供一个单独的无参数 DELETE /relative/unbind-patient 接口。
// --> 为了兼容医生，保留 unbind_id 参数。家属调用时，需要传入其绑定的病人的 ID。
export const UnbindPatientAPI = async (patientId: number): Promise<UnbindPatientAPIRes> => {
  console.log("调用解绑病人接口 (通用), unbind_id:", patientId);
  try {
    // 使用 DELETE 方法，并将 ID 作为 query 参数传递
    const res = await http.delete<UnbindPatientAPIRes>('/patient-bind-id', {
      params: {
        unbind_id: patientId
      }
    });
    console.log("解绑病人接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("解绑病人接口返回数据格式错误:", res.data);
      return {
        status: 1,
        code: "invalidResponseFormat",
        message: "解绑病人接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("解绑病人接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as UnbindPatientAPIRes;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "解绑病人失败"
    };
  }
};


// --- 训练任务接口 ---

// 分配训练任务请求体类型
export interface AssignTaskPayload {
  patient_id: number;
  text_uuid: string;
  title?: string; // 添加：任务标题（可选）
  remark?: string; // 添加：任务备注（可选）
}

// 分配训练任务响应类型 (假设返回简单状态和消息)
export interface AssignTaskResponse {
  status: number;
  code?: string;
  message?: string;
}

/**
 * 给病人分配新的练习任务
 * @param payload 包含 patient_id 和 text_uuid
 * @returns
 */
export const AssignPracticeTaskAPI = async (
  payload: AssignTaskPayload
): Promise<AssignTaskResponse> => {
  console.log("调用分配训练任务接口, payload:", payload);
  try {
    const res = await http.post<AssignTaskResponse>("/new-practice-task", payload);
    console.log("分配训练任务接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("分配训练任务接口返回数据格式错误:", res.data);
      return {
        status: 1,
        code: "invalidResponseFormat",
        message: "分配训练任务接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("分配训练任务接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as AssignTaskResponse;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "分配任务失败"
    };
  }
};

// 单个训练任务信息类型
export interface PracticeTaskInfo {
  uuid: string; // 任务的唯一标识符
  patient_id: number; // 病人 ID
  text_uuid: string; // 关联的语料 UUID
  title: string; // 添加：任务标题
  remark: string; // 添加：任务备注
  finished: boolean; // 任务是否完成
  created_at: string; // 创建时间
  updated_at: string; // 更新时间
  // 语料详细信息，如果需要前端组合 (现在可能不需要了，因为任务自带标题)
  practice_text?: CorpusInfo;
}

// 获取训练任务列表响应类型
export interface GetPracticeTasksResponse {
  status: number;
  tasks?: PracticeTaskInfo[]; // 使用更新后的任务信息类型
  message?: string;
}

/**
 * 获取指定病人的练习任务列表
 * @param patient_id 病人 ID
 * @returns 包含任务列表的响应
 */
export const GetPracticeTasksAPI = async (
  patient_id: number
): Promise<GetPracticeTasksResponse> => {
  console.log("调用获取病人训练任务列表接口, patient_id:", patient_id);
  try {
    const res = await http.get<GetPracticeTasksResponse>("/practice-tasks", {
      params: { patient_id },
    });
    console.log("获取病人训练任务列表接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
       // 确保 tasks 字段是数组
       if (res.data.status === 0 && !Array.isArray(res.data.tasks)) {
         console.warn("获取训练任务列表成功，但 tasks 字段不是数组:", res.data.tasks);
         res.data.tasks = []; // 返回空数组
      }
      return res.data;
    } else {
      console.error("获取病人训练任务列表接口返回数据格式错误:", res.data);
      return {
        status: 1,
        message: "获取病人训练任务列表接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("获取病人训练任务列表接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as GetPracticeTasksResponse;
    }
    return {
      status: 1,
      message: error.message || "获取训练任务列表失败"
    };
  }
};

// 删除训练任务响应类型 (假设返回简单状态和消息)
export interface DeleteTaskResponse {
  status: number;
  code?: string;
  message?: string;
}

/**
 * 删除指定的练习任务
 * @param task_uuid 要删除的任务的 UUID
 * @returns
 */
export const DeletePracticeTaskAPI = async (
  task_uuid: string
): Promise<DeleteTaskResponse> => {
  console.log("调用删除训练任务接口, task_uuid:", task_uuid);
  try {
    // 使用 DELETE 方法，并将 task_uuid 作为 query 参数传递
    const res = await http.delete<DeleteTaskResponse>("/practice-task", {
      params: { task_uuid },
    });
    console.log("删除训练任务接口响应:", res.data);
    if (res.data && typeof res.data.status === 'number') {
      return res.data;
    } else {
      console.error("删除训练任务接口返回数据格式错误:", res.data);
      return {
        status: 1,
        code: "invalidResponseFormat",
        message: "删除训练任务接口返回数据格式错误"
      };
    }
  } catch (error: any) {
    console.error("删除训练任务接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as DeleteTaskResponse;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "删除任务失败"
    };
  }
};
