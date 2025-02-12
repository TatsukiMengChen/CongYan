import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const http = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：在请求头中添加 Token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理错误
http.interceptors.response.use(
  (response) => {
    if (response.data.message === "no auth") {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default http;