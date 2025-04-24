import http from '../utils/http';

// 获取预签名 URL 请求参数类型
export interface GetOssPreSignedUrlRequest {
  "object-suffix"?: string; // 图片类型，例如 jpg, png
  "object-type"?: string;   // 固定为 'avatar'
  [property: string]: any;
}

// 获取预签名 URL 接口返回数据类型
export interface OssPreSignedUrlData {
  url: string;
}

// 获取预签名 URL 接口返回类型
export interface GetOssPreSignedUrlAPIRes {
  status: number;
  code: "preSignedURLGenerated" | string;
  data?: OssPreSignedUrlData;
  message?: string;
}

// 获取预签名 URL 接口
export const GetOssPreSignedUrlAPI = async (params: GetOssPreSignedUrlRequest): Promise<GetOssPreSignedUrlAPIRes> => {
  console.log("调用获取预签名 URL 接口，参数:", params);
  try {
    const res = await http.get<GetOssPreSignedUrlAPIRes>('/oss-pre-signed-url', { params });
    console.log("获取预签名 URL 接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("获取预签名 URL 接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as GetOssPreSignedUrlAPIRes;
    }
    return {
      status: 1,
      code: "requestFailed",
      message: error.message || "获取预签名 URL 失败"
    };
  }
};

// 上传文件到 OSS (使用 fetch)
export const UploadToOSSAPI = async (uploadUrl: string, file: File): Promise<Response> => {
    console.log("开始上传文件到 OSS:", uploadUrl);
    try {
        // 注意：根据后端要求，这里使用 POST 方法
        // 通常 S3/COS 预签名 URL 使用 PUT，请与后端确认
        const response = await fetch(uploadUrl, {
            method: 'PUT', // 或者 'PUT'，根据后端预签名 URL 的设置
            body: file,
            headers: {
                // 可能需要根据后端要求设置 Content-Type
                // 'Content-Type': file.type,
                // COS 的 POST 上传可能不需要 Content-Type，或者需要其他特定头
            }
        });
        console.log("上传文件到 OSS 响应状态:", response.status);
        if (!response.ok) {
            // 如果状态码不是 2xx，则抛出错误
            const errorText = await response.text();
            console.error("上传文件到 OSS 失败:", errorText);
            throw new Error(`上传失败: ${response.status} ${response.statusText}`);
        }
        // POST 上传成功通常返回 200 或 204 No Content，具体看 COS 配置
        console.log("上传文件到 OSS 成功");
        return response;
    } catch (error: any) {
        console.error("上传文件到 OSS 接口错误:", error);
        throw error; // 将错误继续抛出，由调用者处理
    }
};

