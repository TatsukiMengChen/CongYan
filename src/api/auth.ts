import http from '../utils/http';

// --- Geetest Result Type (Shared) ---
export type GeetestResult = {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
  captcha_id?: string; // Optional but recommended
}

// --- Login Types ---
export type LoginAPIRes = {
  status: number; // 统一使用 status
  code: string; // 例如 "loginSuccessful", "invalidCredentials", "invalidSmsCode" 等
  data?: { // data 只在成功时存在
    jwt_token: string;
    username?: string; // 可选
    role?: string; // 可选
    expire?: string; // 可选
  };
  message?: string;
};

// 密码登录请求体类型 - 添加可选 Geetest 参数
export type PasswordLoginReqBody = {
  phone_number: string;
  password?: string; // 密码现在是必须的
  // Geetest params (optional)
  lot_number?: string;
  captcha_output?: string;
  pass_token?: string;
  gen_time?: string;
  captcha_id?: string;
}

// 验证码登录请求体类型 - 添加可选 Geetest 参数
export type SmsLoginReqBody = {
  phone_number: string;
  sms_code: string;
  // Geetest params (optional but likely required by backend)
  lot_number?: string;
  captcha_output?: string;
  pass_token?: string;
  gen_time?: string;
  captcha_id?: string;
}

// --- New: Check Registered Status API ---
// Function dedicated to checking phone registration status
export const CheckRegisteredStatusAPI = async (
  phone_number: string,
  geetestResult?: GeetestResult | null, // Geetest is optional here, but required by login logic
): Promise<RegisteredStatusAPIRes> => {
  console.log("调用检查注册状态接口:", { phone_number, hasGeetest: !!geetestResult });
  // Backend should ideally enforce geetestResult if required for this endpoint
  try {
    const res = await http.get<RegisteredStatusAPIRes>('/registered-status', {
      params: {
        phone_number,
        ...(geetestResult && { // Pass geetest params if provided
          lot_number: geetestResult.lot_number,
          captcha_output: geetestResult.captcha_output,
          pass_token: geetestResult.pass_token,
          gen_time: geetestResult.gen_time,
          captcha_id: geetestResult.captcha_id || import.meta.env.VITE_GEETEST_ID,
        })
      }
    });
    console.log("检查注册状态接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    // ... existing error handling ...
    console.error("检查注册状态接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as RegisteredStatusAPIRes;
    }
    return {
      status: 1,
      code: "statusCheckFailed",
      message: error.message || "检查注册状态请求失败"
    };
  }
};

// 修改：密码登录接口 - 移除内部状态检查
export const PasswordLoginAPI = async (
  phone_number: string,
  password?: string,
  geetestResult?: GeetestResult | null,
): Promise<LoginAPIRes> => {
  console.log("调用密码登录接口:", { phone_number, hasPassword: !!password, hasGeetest: !!geetestResult });
  try {
    // 1. 移除前端发起的内部状态检查
    // const statusRes = await CheckRegisteredStatusAPI(phone_number, geetestResult);
    // console.log("注册状态检查响应 (密码登录):", statusRes);
    // if (statusRes.status !== 0 || statusRes.code !== "phoneRegistered") { ... }
    // 2. 构建请求体，包含 Geetest 参数 (如果提供)
    // Backend's /password-login-detail should handle status checks if required
    const body: PasswordLoginReqBody = {
      phone_number,
      password,
      ...(geetestResult && {
        lot_number: geetestResult.lot_number,
        captcha_output: geetestResult.captcha_output,
        pass_token: geetestResult.pass_token,
        gen_time: geetestResult.gen_time,
        captcha_id: geetestResult.captcha_id || import.meta.env.VITE_GEETEST_ID,
      })
    };
    const res = await http.post<LoginAPIRes>('/password-login-detail', body);
    console.log("密码登录接口响应:", res.data);
    // Backend might still return codes like 'phoneNotRegistered' or 'captchaFailed'
    return res.data;

  } catch (error: any) {
    console.error("密码登录接口错误:", error);
    if (error.response && error.response.data) {
      // Return backend error structure
      return error.response.data as LoginAPIRes;
    }
    // Throw or return a generic error structure if needed
    // For consistency, let's return a structure matching LoginAPIRes
     return {
       status: 1,
       code: "passwordLoginRequestFailed", // Generic frontend error code
       message: error.message || "密码登录请求失败"
     };
  }
};

// 新增：验证码登录接口 - 移除内部状态检查
export const SmsLoginAPI = async (
  phone_number: string,
  sms_code: string,
  geetestResult?: GeetestResult | null,
): Promise<LoginAPIRes> => {
  console.log("调用验证码登录接口:", { phone_number, sms_code, geetestResult });
  try {
    // 移除内部的状态检查调用
    // const statusRes = await http.get<RegisteredStatusAPIRes>(...);
    // if (statusRes.data.status !== 0 || statusRes.data.code !== "phoneRegistered") {
    //   return { status: 1, code: "phoneNotRegistered", message: "该手机号未注册" };
    // }

    // 构建请求体，包含 Geetest 参数
    const body: SmsLoginReqBody = {
      phone_number,
      sms_code,
      ...(geetestResult && {
        lot_number: geetestResult.lot_number,
        captcha_output: geetestResult.captcha_output,
        pass_token: geetestResult.pass_token,
        gen_time: geetestResult.gen_time,
        captcha_id: geetestResult.captcha_id || import.meta.env.VITE_GEETEST_ID,
      })
    };
    const res = await http.post<LoginAPIRes>('/sms-login-detail', body);
    console.log("验证码登录接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    // ...existing error handling...
    console.error("验证码登录接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as LoginAPIRes;
    }
    throw new Error(error.message || "验证码登录请求失败");
  }
};

// --- Registration Types ---
export type RegisterAPIRes = {
  code: number;
  data: RegisterAPIResData;
  id: number;
  message: string;
}

// 注册接口返回数据类型
export type RegisterAPIResData = {
  role: string; // 用户角色
  username: string; // 用户名
}

// 注册接口请求体类型 - 添加可选 Geetest 参数
export type NewUserDetailReqBody = {
  phone_number: string;
  sms_code: string;
  user_role: "doctor" | "patient" | "relative" | string; // 更新类型
  birth_date: string; // ISO 字符串格式
  gender: string;
  password?: string; // 密码字段根据后端要求添加
  // Geetest params (optional but likely required by backend)
  lot_number?: string;
  captcha_output?: string;
  pass_token?: string;
  gen_time?: string;
  captcha_id?: string;
}

// 注册接口返回类型 (POST /new-user-detail)
export type NewUserDetailAPIRes = {
  status: number;
  code: "registrationSuccessful" | "registrationFailedExpired" | string; // 包含成功和失败代码
  data?: { // data 只在成功时存在
    jwt_token: string;
  };
  message?: string;
};

// 模拟注册接口 - 更新签名和请求体
export const RegisterAPI = async (
  phone_number: string,
  sms_code: string,
  user_role: string,
  birth_date: string, // 期望 ISO 字符串格式，例如 "2009-02-14T00:00:00Z"
  gender: string,
  password?: string, // 密码可能仍然需要，具体取决于逻辑
  geetestResult?: GeetestResult | null, // 添加可选 Geetest 参数
): Promise<NewUserDetailAPIRes> => {
  console.log("调用注册接口:", {
    phone_number,
    sms_code,
    user_role,
    birth_date,
    gender,
    password, // 如果后端需要密码，则包含在请求体中
    geetestResult
  });
  try {
    const body: NewUserDetailReqBody = {
      phone_number,
      sms_code,
      user_role,
      birth_date,
      gender,
      ...(password && { password }), // 条件包含密码
      ...(geetestResult && { // 如果 geetestResult 存在，则展开其属性
        lot_number: geetestResult.lot_number,
        captcha_output: geetestResult.captcha_output,
        pass_token: geetestResult.pass_token,
        gen_time: geetestResult.gen_time,
      })
    };
    const res = await http.post<NewUserDetailAPIRes>('/new-user-detail', body);
    console.log("注册接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("注册接口错误:", error);
    // 尝试从 Axios 错误中提取后端返回的错误信息
    if (error.response && error.response.data) {
      return error.response.data as NewUserDetailAPIRes;
    }
    // 如果无法提取，则返回一个通用的错误结构
    throw new Error(error.message || "注册请求失败");
  }
};

// --- Ask Code Types ---
export type AskCodeAPIRes = {
  code: number;
  data: null;
  id: number;
  message: string;
}

// 更新后的请求验证码接口 - 移除状态检查，只发送验证码
export const AskCodeAPI = async (
  phone_number: string,
  geetestResult?: GeetestResult | null, // Geetest is optional here, but required by login logic
): Promise<SmsCodeAPIRes> => {
  console.log("请求发送验证码:", { phone_number, hasGeetest: !!geetestResult });
  // Backend should ideally enforce geetestResult if required for this endpoint
  try {
    // 移除状态检查逻辑
    // const statusRes = await http.get<RegisteredStatusAPIRes>(...);
    // ... status check logic removed ...

    // 直接请求发送验证码
    const smsRes = await http.get<SmsCodeAPIRes>('/sms-code', {
      params: {
        phone_number,
        ...(geetestResult && { // Pass geetest params if provided
          lot_number: geetestResult.lot_number,
          captcha_output: geetestResult.captcha_output,
          pass_token: geetestResult.pass_token,
          gen_time: geetestResult.gen_time,
          captcha_id: geetestResult.captcha_id || import.meta.env.VITE_GEETEST_ID,
        })
      }
    });
    console.log("请求验证码接口响应:", smsRes.data);
    // 仍然需要处理 /sms-code 可能返回的 Geetest 错误
    if (smsRes.data.status !== 0 && smsRes.data.code === "captchaFailed") {
      return { status: 1, code: "captchaFailed", message: smsRes.data.message || "人机验证失败" };
    }
    return smsRes.data;

  } catch (error: any) {
    console.error("请求验证码流程错误:", error);
    if (error.response && error.response.data) {
      const errorData = error.response.data;
      if (errorData.code === "captchaFailed") {
        return { status: 1, code: "captchaFailed", message: errorData.message || "人机验证失败" } as SmsCodeAPIRes;
      }
      return {
        status: errorData.status !== undefined ? errorData.status : 1,
        code: errorData.code || "requestFailed",
        message: errorData.message || "请求验证码失败"
      } as SmsCodeAPIRes;
    }
    throw new Error(error.message || "请求验证码失败");
  }
};

// 注销接口返回类型
export type LogoutAPIRes = {
  code: number;
  data: string;
  id: number;
  message: string;
}

// 模拟注销接口
export const LogoutAPI = async (): Promise<LogoutAPIRes> => {
  try {
    const res = await http.get<LogoutAPIRes>('/auth/logout');
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
}

// 检查手机号注册状态接口返回类型
export type RegisteredStatusAPIRes = {
  status: number;
  code: "phoneNotRegistered" | "phoneRegistered" | "captchaFailed" | string;
  message?: string; // 可选的消息字段
}

// 请求验证码接口返回类型 (POST /sms-code)
export type SmsCodeAPIRes = {
  status: number;
  code: string; // 例如 "smsCodeSent" 或错误代码
  message?: string;
}

// 修改密码接口返回类型
export type ChangePasswordAPIRes = {
  status: number;
  code: string; // 例如 "passwordChangedSuccessfully", "invalidRequest"
  message?: string;
}

// 修改密码接口
export const ChangePasswordAPI = async (
  new_password: string
): Promise<ChangePasswordAPIRes> => {
  console.log("调用修改密码接口:", { new_password });
  try {
    // 注意：PUT 请求通常将数据放在 body 中，但根据要求放在 query 参数中
    const res = await http.put<ChangePasswordAPIRes>('/password', null, { // body 为 null
      params: { new_password } // 将 new_password 作为 query 参数
    });
    console.log("修改密码接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("修改密码接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as ChangePasswordAPIRes;
    }
    throw new Error(error.message || "修改密码请求失败");
  }
};