import http from '../utils/http';

export type LoginAPIRes = {
  code: number;
  data: LoginAPIResData;
  id: number;
  message: string;
}

export type LoginAPIResData = {
  expire: string;
  role: string;
  token: string;
  username: string;
}

export const LoginAPI = async (username?: string, password?: string): Promise<LoginAPIRes> => {
  try {
    const formData = new FormData();
    if (username) formData.append('username', username);
    if (password) formData.append('password', password);

    const res = await http.post<LoginAPIRes>('/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
}

export type RegisterAPIRes = {
  code: number;
  data: RegisterAPIResData;
  id: number;
  message: string;
}

export type RegisterAPIResData = {
  role: string;
  username: string;
}

export const RegisterAPI = async (email: string, code: string, username: string, password: string): Promise<RegisterAPIRes> => {
  try {
    const res = await http.post<RegisterAPIRes>('/auth/register', {
      email,
      code,
      username,
      password,
    });
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
}

export type AskCodeAPIRes = {
  code: number;
  data: null;
  id: number;
  message: string;
}

export const AskCodeAPI = async (email: string, type: string): Promise<AskCodeAPIRes> => {
  try {
    const res = await http.get<AskCodeAPIRes>('/auth/ask-code', {
      params: {
        email,
        type
      }
    });
    return res.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    } else {
      throw new Error(String(error));
    }
  }
}

export type LogoutAPIRes = {
  code: number;
  data: string;
  id: number;
  message: string;
}

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