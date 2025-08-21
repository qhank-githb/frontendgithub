// src/services/auth.js
import axios from "axios";

export async function login(username, password) {
  try {
    const res = await axios.post("http://192.168.150.93:5000/api/auth/login", {
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
