import http from '../utils/http';
import { UserInfo } from './user'; // 复用 UserInfo 类型，因为结构相似

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
