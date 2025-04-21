import http from '../utils/http';

// 添加收藏字接口请求体类型
export interface AddFavoriteCharacterPayload {
  character: string;
}

// 添加收藏字接口返回类型
export interface AddFavoriteCharacterAPIRes {
  status: number;
  code: "favoriteCharacterAddSuccessful" | string;
  message?: string;
}

// 添加收藏字接口
export const AddFavoriteCharacterAPI = async (payload: AddFavoriteCharacterPayload): Promise<AddFavoriteCharacterAPIRes> => {
  console.log("调用添加收藏字接口，参数:", payload);
  try {
    const res = await http.post<AddFavoriteCharacterAPIRes>('/favorite-character', payload);
    console.log("添加收藏字接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("添加收藏字接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as AddFavoriteCharacterAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "添加收藏字失败"
    };
  }
};

// 收藏的字信息结构
export interface FavoriteCharacterInfo {
  uuid: string;
  user_id: number;
  character: string;
  created_at: string; // ISO 8601 format string
}

// 获取所有收藏的字接口返回类型
export interface GetAllFavoriteCharactersAPIRes {
  status: number;
  code: "favoriteCharactersGetSuccessful" | string;
  characters?: FavoriteCharacterInfo[];
  message?: string;
}

// 获取所有收藏的字接口
export const GetAllFavoriteCharactersAPI = async (): Promise<GetAllFavoriteCharactersAPIRes> => {
  console.log("调用获取所有收藏的字接口");
  try {
    const res = await http.get<GetAllFavoriteCharactersAPIRes>('/favorite-characters');
    console.log("获取所有收藏的字接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("获取所有收藏的字接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as GetAllFavoriteCharactersAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "获取所有收藏的字失败"
    };
  }
};

// 删除收藏字接口请求体类型
export interface DeleteFavoriteCharacterPayload {
  character: string;
}

// 删除收藏字接口返回类型
export interface DeleteFavoriteCharacterAPIRes {
  status: number;
  code: "favoriteCharacterDeleteSuccessful" | string;
  message?: string;
}

// 删除收藏字接口
export const DeleteFavoriteCharacterAPI = async (payload: DeleteFavoriteCharacterPayload): Promise<DeleteFavoriteCharacterAPIRes> => {
  console.log("调用删除收藏字接口，参数:", payload);
  try {
    // DELETE 请求通常将数据放在 body 中
    const res = await http.delete<DeleteFavoriteCharacterAPIRes>('/favorite-character', { data: payload });
    console.log("删除收藏字接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("删除收藏字接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as DeleteFavoriteCharacterAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "删除收藏字失败"
    };
  }
};


// 获取一个字是否收藏接口返回类型
export interface CheckFavoriteCharacterAPIRes {
  status: number;
  code: "favoriteCharacterCheckSuccessful" | string;
  is_favorite?: boolean;
  message?: string;
}

// 获取一个字是否收藏接口
export const CheckFavoriteCharacterAPI = async (character: string): Promise<CheckFavoriteCharacterAPIRes> => {
  console.log("调用获取一个字是否收藏接口，参数:", character);
  try {
    const res = await http.get<CheckFavoriteCharacterAPIRes>('/favorite-character', {
      params: { character }
    });
    console.log("获取一个字是否收藏接口响应:", res.data);
    return res.data;
  } catch (error: any) {
    console.error("获取一个字是否收藏接口错误:", error);
    if (error.response && error.response.data) {
      return error.response.data as CheckFavoriteCharacterAPIRes;
    }
    return {
        status: 1,
        code: "requestFailed",
        message: error.message || "检查收藏状态失败"
    };
  }
};
