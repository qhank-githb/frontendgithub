<template>
  <el-card style="width: 300px; padding: 20px">
    <h3 style="text-align: center; margin-bottom: 12px">登录</h3>
    <el-input
      v-model="username"
      placeholder="用户名"
      style="margin-bottom: 12px"
    />
    <el-input
      v-model="password"
      placeholder="密码"
      type="password"
      style="margin-bottom: 12px"
    />
    <el-button type="primary" style="width: 100%" @click="handleLogin"
      >登录</el-button
    >
  </el-card>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";

const username = ref("");
const password = ref("");
const emit = defineEmits(["login-success"]);

const handleLogin = async () => {
  try {
    const res = await axios.post("/api/auth/login", {
      username: username.value,
      password: password.value,
    });

    const token = res.data.token;
    if (!token) {
      ElMessage.error("登录失败：没有拿到 token");
      return;
    }

    localStorage.setItem("jwt_token", token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    emit("login-success", username.value);
  } catch (err) {
    console.error("登录失败:", err);
    ElMessage.error("登录失败：" + (err.message || "未知错误"));
  }
};
</script>
