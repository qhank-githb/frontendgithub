import axios from "axios";
import { ElMessage } from "element-plus";

const API_BASE = "http://192.168.150.93:5000/api";
//const API_BASE = "http://localhost:5000/api";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

// 请求拦截器：自动加 JWT
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器：统一处理 401
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      ElMessage.error("未授权，请重新登录");
      // 可选：跳转登录页
    }
    return Promise.reject(err);
  }
);

export default http;
export { API_BASE };
