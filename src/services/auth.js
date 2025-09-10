// src/services/auth.js
import http from "@/plugins/axios";

export async function login(username, password) {
  try {
    const res = await http.post("/auth/login", {
      // 使用相对路径
      username,
      password,
    });
    const token = res.data.token;
    localStorage.setItem("jwt_token", token);
    return token;
  } catch (err) {
    console.error("登录失败:", err.response?.data || err.message);
    throw err;
  }
}

export async function register(username, password, role) {
  try {
    const res = await http.post("/auth/register", {
      // 使用相对路径
      username,
      password,
      role,
    });
  } catch (err) {
    console.error("注册失败:", err.response?.data || err.message);
    throw err;
  }
}
