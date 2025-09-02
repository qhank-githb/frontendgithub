<template>
  <div style="display: flex; align-items: center; padding: 0 16px">
    <el-menu
      mode="horizontal"
      :default-active="activeMenu"
      @select="handleMenuSelect"
      background-color="transparent"
      text-color="#333333"
      active-text-color="#64B5F6"
      style="flex: 1"
    >
      <el-menu-item index="upload">上传文件</el-menu-item>
      <el-menu-item index="query">查询文件</el-menu-item>
      <el-menu-item index="tags">标签管理</el-menu-item>
    </el-menu>

    <el-button
      type="warning"
      @click="handleLogout"
      style="
        background-color: #ffb74d;
        border: none;
        color: #fff;
        margin-left: 16px;
      "
    >
      退出
    </el-button>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import { API_BASE } from "@/plugins/axios";

const activeMenu = ref("upload");
const emit = defineEmits(["menu-change", "logout"]);

const handleMenuSelect = (index) => {
  activeMenu.value = index;
  emit("menu-change", index);
};

const handleLogout = async () => {
  delete axios.defaults.headers.common["Authorization"];
  try {
    await axios.post(`${API_BASE}/api/auth/logout`);
    ElMessage.success("已退出登录");
  } catch (err) {
    console.warn("退出日志通知后端失败:", err);
  }
  localStorage.removeItem("jwt_token");
  emit("logout");
};
</script>
