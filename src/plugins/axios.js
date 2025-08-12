// axios 单例
import axios from "axios";

const API_BASE = "http://192.168.150.93:5000/api";

const http = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  withCredentials: false,
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    return Promise.reject(err);
  }
);

export default http;
export { API_BASE };
