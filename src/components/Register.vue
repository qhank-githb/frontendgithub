<template>
  <div style="display: flex; justify-content: center; padding: 20px">
    <el-card style="width: 300px; padding: 20px">
      <h3 style="text-align: center; margin-bottom: 5px">注册</h3>
      <h6 style="text-align: center; margin-bottom: 12px">仅管理员可注册</h6>

      <el-input
        v-model="RegisterUsername"
        placeholder="注册的用户名"
        style="margin-bottom: 12px"
        @keyup.enter="handleRegister"
      />
      <el-input
        v-model="RegisterPassword"
        placeholder="你的密码"
        type="password"
        style="margin-bottom: 12px"
        @keyup.enter="handleRegister"
      />
      <el-select
        v-model="RegisterRole"
        placeholder="选择用户类型"
        style="margin-bottom: 12px"
        @keyup.enter="handleRegister"
        clearable
      >
        <!-- user 选项 -->
        <el-option label="普通用户 (user)" value="user"></el-option>

        <!-- admin 选项 -->
        <el-option label="管理员 (admin)" value="admin"></el-option>
      </el-select>

      <el-button type="primary" style="width: 100%" @click="handleRegister">
        注册
      </el-button>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { useJwt } from "@/composables/useJwt.js";

const { currentRole } = useJwt();

const emit = defineEmits(["register"]);

const RegisterPassword = ref("");
const RegisterRole = ref("");
const RegisterUsername = ref("");

function handleRegister() {
  // 1. 非空校验：去除输入的前后空格（避免用户输入纯空格）
  const username = RegisterUsername.value.trim();
  const password = RegisterPassword.value.trim();
  const role = RegisterRole.value.trim();

  // 2. 逐一判断字段
  if (currentRole.value !== "Admin") {
    ElMessage.warning("普通用户不可注册");
    return;
  }
  if (!username) {
    ElMessage.warning("请输入注册的用户名");
    return; // 终止函数，不执行后续 emit
  }

  if (!password) {
    ElMessage.warning("请输入密码");
    return;
  }

  if (!role) {
    ElMessage.warning("请输入用户类型（如 user 或 admin）");
    return;
  }

  // 3. 所有字段均非空，才向父组件传递注册信息
  emit("register", {
    registerUsername: username, // 传递去除空格后的有效值
    registerPassword: password,
    registerRole: role,
  });

  // （可选）提交后清空输入框，提升用户体验
  RegisterUsername.value = "";
  RegisterPassword.value = "";
  RegisterRole.value = "";
}
</script>
