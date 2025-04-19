import http from '../utils/http';

// 登录接口返回类型 (适用于密码和验证码登录)
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
}

// 密码登录请求体类型
export type PasswordLoginReqBody = {
  phone_number: string;
  password?: string; // 密码现在是必须的
}

// 验证码登录请求体类型
export type SmsLoginReqBody = {
  phone_number: string;
  sms_code: string;
}

// 新增：密码登录接口
export const PasswordLoginAPI = async (
  phone_number: string,
  password?: string,
): Promise<LoginAPIRes> => {
  console.log("调用密码登录接口:", { phone_number, password });
  try {
    // 1. 检查手机号注册状态 (登录前需要确认已注册)
    const statusRes = await http.get<RegisteredStatusAPIRes>('/registered-status', {
      params: { phone_number }
    });
    console.log("注册状态检查响应 (密码登录):", statusRes.data);

    if (statusRes.data.status !== 0 || statusRes.data.code !== "phoneRegistered") {
      console.log("手机号未注册，无法使用密码登录");
      return {
        status: 1,
        code: "phoneNotRegistered",
        message: "该手机号未注册"
      };
    }

    // 2. 如果已注册，发起密码登录请求
    const body: PasswordLoginReqBody = { phone_number, password };
    const res = await http.post<LoginAPIRes>('/password-login-detail', body);
    console.log("密码登录接口响应:", res.data);
    return res.data;

  } catch (error: any) {
    console.error("密码登录接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as LoginAPIRes;
    }
    throw new Error(error.message || "密码登录请求失败");
  }
};

// 新增：验证码登录接口
export const SmsLoginAPI = async (
  phone_number: string,
  sms_code: string,
): Promise<LoginAPIRes> => {
  console.log("调用验证码登录接口:", { phone_number, sms_code });
  try {
    // 注意：验证码登录前通常也需要检查手机号是否已注册，
    // 但 AskCodeAPI 已经做了这个检查。如果后端 /sms-login-detail
    // 也做检查，这里的检查可以省略。为保险起见，可以保留。
    const statusRes = await http.get<RegisteredStatusAPIRes>('/registered-status', {
        params: { phone_number }
    });
    if (statusRes.data.status !== 0 || statusRes.data.code !== "phoneRegistered") {
        return { status: 1, code: "phoneNotRegistered", message: "该手机号未注册" };
    }

    const body: SmsLoginReqBody = { phone_number, sms_code };
    const res = await http.post<LoginAPIRes>('/sms-login-detail', body);
    console.log("验证码登录接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("验证码登录接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as LoginAPIRes;
    }
    throw new Error(error.message || "验证码登录请求失败");
  }
};

// 模拟登录接口
export const LoginAPI = (
  phone_number: string,
  password?: string, // 密码可选，如果不是必须的
): Promise<any> => {
  console.log("模拟登录接口调用:", { phone_number, password });
  return new Promise((resolve) => {
    setTimeout(() => {
      // 根据输入模拟 API 响应（可选）
      if (phone_number === "13000000000" && password === "123456") {
        resolve({
          status: 0, // 假设 0 表示成功
          code: 6,   // 示例成功代码
          data: {
            jwt_token: `mock_jwt_token_${Date.now()}`, // 生成唯一的模拟令牌
            username: "MockUser", // 示例用户名
            role: "patient", // 示例角色
            expire: new Date(Date.now() + 3600 * 1000).toISOString(), // 示例过期时间
          },
          message: "模拟：登录成功" // 可选成功消息
        });
      } else {
        resolve({
          status: 1, // 假设非零表示错误
          code: 7,   // 示例错误代码（无效凭据）
          message: "模拟：手机号或密码错误",
        });
      }
    }, 1000); // 模拟网络延迟
  });
};

// 注册接口返回类型
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

// 模拟注册接口
export const RegisterAPI = async (
  phone_number: string,
  sms_code: string,
  user_role: string,
  birth_date: string, // 期望 ISO 字符串格式，例如 "2009-02-14T00:00:00Z"
  gender: string,
  password?: string, // 密码可能仍然需要，具体取决于逻辑
): Promise<NewUserDetailAPIRes> => {
  console.log("调用注册接口:", {
    phone_number,
    sms_code,
    user_role,
    birth_date,
    gender,
    password, // 如果后端需要密码，则包含在请求体中
  });
  try {
    const body: NewUserDetailReqBody = {
      phone_number,
      sms_code,
      user_role,
      birth_date,
      gender,
    };
    // 如果后端注册接口需要密码，则添加到 body 中
    if (password) {
      body.password = password;
    }
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

// 请求验证码接口返回类型
export type AskCodeAPIRes = {
  code: number;
  data: null;
  id: number;
  message: string;
}

// 更新后的请求验证码接口 - 添加 type 参数以区分场景
export const AskCodeAPI = async (
  phone_number: string,
  type: "register" | "login" // 添加 type 参数
): Promise<SmsCodeAPIRes> => {
  console.log("请求验证码流程开始:", { phone_number, type });

  try {
    // 1. 检查手机号注册状态
    console.log("检查手机号注册状态:", phone_number);
    const statusRes = await http.get<RegisteredStatusAPIRes>('/registered-status', {
      params: { phone_number }
    });
    console.log("注册状态检查响应:", statusRes.data);

    // 根据类型执行不同的检查逻辑
    if (type === "register") {
      // 注册时：如果手机号已注册，则报错
      if (statusRes.data.status === 0 && statusRes.data.code === "phoneRegistered") {
        console.log("手机号已注册，无法用于注册");
        return { status: 1, code: "phoneRegistered", message: "该手机号已被注册" };
      }
      // 注册时：如果状态检查失败或非 "phoneNotRegistered"，也报错
      else if (statusRes.data.status !== 0 || statusRes.data.code !== "phoneNotRegistered") {
         console.error("注册状态检查失败或返回意外结果:", statusRes.data);
         return { status: 1, code: "statusCheckFailed", message: statusRes.data.message || "检查手机号状态时出错" };
      }
    } else if (type === "login") {
      // 登录时：如果手机号未注册，则报错
      if (statusRes.data.status === 0 && statusRes.data.code === "phoneNotRegistered") {
        console.log("手机号未注册，无法用于登录");
        return { status: 1, code: "phoneNotRegistered", message: "该手机号未注册" };
      }
      // 登录时：如果状态检查失败或非 "phoneRegistered"，也报错
      else if (statusRes.data.status !== 0 || statusRes.data.code !== "phoneRegistered") {
         console.error("注册状态检查失败或返回意外结果:", statusRes.data);
         return { status: 1, code: "statusCheckFailed", message: statusRes.data.message || "检查手机号状态时出错" };
      }
    }

    // 2. 如果检查通过，请求发送验证码
    console.log(`手机号状态符合 ${type} 要求，请求发送验证码:`, phone_number);
    // 注意：后端 /sms-code 接口可能也需要知道 type，如果需要，请在 body 中传递
    const smsRes = await http.post<SmsCodeAPIRes>('/sms-code', { phone_number /*, type: type */ });
    console.log("请求验证码接口响应:", smsRes.data);
    return smsRes.data;

  } catch (error: any) {
    // ... existing error handling ...
    console.error("请求验证码流程错误:", error);
    if (error.response && error.response.data) {
      const errorData = error.response.data;
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
  code: "phoneNotRegistered" | "phoneRegistered";
  message?: string; // 可选的消息字段
}

// 请求验证码接口返回类型 (POST /sms-code)
export type SmsCodeAPIRes = {
  status: number;
  code: string; // 例如 "smsCodeSent" 或错误代码
  message?: string;
}

// 注册接口返回类型 (POST /new-user-detail)
export type NewUserDetailAPIRes = {
  status: number;
  code: "registrationSuccessful" | "registrationFailedExpired" | string; // 包含成功和失败代码
  data?: { // data 只在成功时存在
    jwt_token: string;
  };
  message?: string;
}

// 注册接口请求体类型
export type NewUserDetailReqBody = {
  phone_number: string;
  sms_code: string;
  user_role: string;
  birth_date: string; // ISO 字符串格式
  gender: string;
  password?: string; // 密码字段根据后端要求添加
}