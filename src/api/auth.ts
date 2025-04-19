import http from '../utils/http';

// 登录接口返回类型
export type LoginAPIRes = {
  code: number;
  data: LoginAPIResData;
  id: number;
  message: string;
}

// 登录接口返回数据类型
export type LoginAPIResData = {
  expire: string; // 令牌过期时间
  role: string; // 用户角色
  token: string; // 令牌
  username: string; // 用户名
}

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
export const RegisterAPI = (
  phone_number: string,
  sms_code: string,
  user_role: string,
  birth_date: string, // 期望 ISO 字符串格式，例如 "2009-02-14T00:00:00Z"
  gender: string,
  password?: string, // 密码可能仍然需要，具体取决于逻辑
): Promise<any> => {
  console.log("模拟注册接口调用:", {
    phone_number,
    sms_code,
    user_role,
    birth_date,
    gender,
    password, // 如果传递了密码，则记录日志
  });
  return new Promise((resolve) => {
    setTimeout(() => {
      // 根据输入模拟 API 响应（可选）
      if (!phone_number || !sms_code || !user_role || !birth_date || !gender || !password) {
          resolve({ status: 1, code: -1, message: "模拟：缺少必填字段" });
      } else if (sms_code !== "000000") { // 示例验证
          resolve({ status: 1, code: 5, message: "模拟：无效的短信验证码" });
      }
      else {
          resolve({
            status: 0, // 假设 0 表示成功
            code: 4,   // 示例成功代码
            message: "模拟：注册成功" // 可选成功消息
          });
      }
    }, 1500); // 模拟网络延迟
  });
};

// 请求验证码接口返回类型
export type AskCodeAPIRes = {
  code: number;
  data: null;
  id: number;
  message: string;
}

// 模拟请求验证码接口（假设现在需要手机号）
export const AskCodeAPI = (
    phone_number: string,
    type: "register" | "login" | "reset_password" // 示例类型
): Promise<any> => {
    console.log("模拟请求验证码接口调用:", { phone_number, type });
    return new Promise((resolve) => {
        setTimeout(() => {
            // 示例手机号格式验证
            if (!phone_number || !/^\d{11}$/.test(phone_number)) {
                 resolve({ status: 1, code: -1, message: "模拟：手机号格式无效" });
            } else {
                console.log(`模拟：向 ${phone_number} 发送验证码，类型为 ${type}`);
                resolve({
                    status: 0, // 假设 0 表示成功
                    code: 0,   // 示例成功代码
                    message: "模拟：验证码发送成功" // 可选成功消息
                });
            }
        }, 800); // 模拟网络延迟
    });
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