import http from '../utils/http';

// 用户角色类型
export type UserRole = "doctor" | "patient" | "relative"; // 添加 'relative'

// 用户信息结构
export interface UserInfo {
  id: number;
  phone_number: string;
  username: string;
  created_at: string; // ISO 8601 format string
  avatar_url: string; // URL or path to avatar
  user_role: UserRole; // 使用 UserRole 类型
  gender: 'male' | 'female' | string; // Allow 'other' or null/undefined initially
  birth_date: string | null; // ISO 8601 format string (YYYY-MM-DD) or null
  disease?: string | null; // Optional, can be string or null
  bind_doctor_id?: number; // Optional
  practice_duration_minutes?: number; // Optional
  bind_patient_id?: number; // 添加新字段：家属绑定的病人 ID
  updated_at: string; // ISO 8601 格式的时间字符串
}

// 获取用户信息接口返回类型
export type UserInfoAPIRes = {
  status: number;
  code: "userInfoGetSuccessful" | string; // 包含成功和其他可能的代码
  data?: UserInfo; // data 只在成功时存在
  message?: string;
}

// 获取用户信息接口
export const GetUserInfoAPI = async (): Promise<UserInfoAPIRes> => {
  console.log("调用获取用户信息接口");
  try {
    const res = await http.get<UserInfoAPIRes>('/user-info');
    console.log("获取用户信息接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("获取用户信息接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as UserInfoAPIRes;
    }
    // 返回一个标准的错误结构
    return {
        status: 1, // 或者更具体的错误状态码
        code: "requestFailed",
        message: error.message || "获取用户信息失败"
    };
    // 或者 re-throw error if you want the caller to handle it more directly
    // throw new Error(error.message || "获取用户信息失败");
  }
};

// 修改用户信息接口请求体类型
export type UpdateUserInfoPayload = {
  birth_date?: string | null; // YYYY-MM-DDTHH:mm:ssZ format or null
  disease?: string | null;
  gender?: "male" | "female"; // 移除 'other' 和 null
}

// 修改用户信息接口返回类型
export type UpdateUserInfoAPIRes = {
  status: number;
  code: "userInfoUpdateSuccessful" | string;
  message?: string;
  data?: UserInfo; // 可能返回更新后的用户信息
}

// 修改用户信息接口
export const UpdateUserInfoAPI = async (payload: UpdateUserInfoPayload): Promise<UpdateUserInfoAPIRes> => {
  console.log("调用修改用户信息接口，参数:", payload);
  try {
    const res = await http.put<UpdateUserInfoAPIRes>('/user-info', payload);
    console.log("修改用户信息接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("修改用户信息接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as UpdateUserInfoAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "修改用户信息失败"
    };
  }
};

// 修改用户名接口返回类型
export type UpdateUsernameAPIRes = {
  status: number;
  code: "usernameUpdateSuccessful" | string;
  message?: string;
}

// 修改用户名接口
export const UpdateUsernameAPI = async (newUsername: string): Promise<UpdateUsernameAPIRes> => {
  console.log("调用修改用户名接口");
  try {
    const res = await http.put<UpdateUsernameAPIRes>('/username', {}, {
      params: {
        'new-username': newUsername
      }
    });
    console.log("修改用户名接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("修改用户名接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as UpdateUsernameAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "修改用户名失败"
    };
  }
};
