<template>
  <el-card style="width: 300px; padding: 20px">
    <h3 style="text-align: center; margin-bottom: 12px">登录</h3>

    <el-input
      v-model="localUsername"
      placeholder="用户名"
      style="margin-bottom: 12px"
      @keyup.enter="handleLogin"
    />
    <el-input
      v-model="localPassword"
      placeholder="密码"
      type="password"
      style="margin-bottom: 12px"
      @keyup.enter="handleLogin"
    />
    <el-button type="primary" style="width: 100%" @click="handleLogin">
      登录
    </el-button>
  </el-card>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";

const emit = defineEmits(["login"]);

const localUsername = ref("");
const localPassword = ref("");

function handleLogin() {
  if (!localUsername.value || !localPassword.value) {
    ElMessage.warning("请输入用户名和密码");
    return;
  }
  // 把用户名密码传回父组件（父组件负责调用后端）
  emit("login", {
    username: localUsername.value,
    password: localPassword.value,
  });
}
</script>
