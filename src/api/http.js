// src/api/http.js
import axios from "axios";

// 使用 Vite 环境变量
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.150.93:5000/api";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// 请求拦截: 统一处理 token、loading 等
http.interceptors.request.use((config) => {
  // config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截: 直接返回 data，统一错误处理
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // ElMessage.error(error.response?.data?.message || '网络错误');
    return Promise.reject(error);
  }
);

export default http;
