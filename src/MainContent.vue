<template>
  <div>
    <!-- 登录页面 -->
    <div
      v-if="!isLoggedIn"
      style="
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
      "
    >
      <LoginForm @login="handleLogin" />
    </div>

    <!-- 主页面（菜单 + 内容） -->
    <div v-else style="height: 100vh; display: flex; flex-direction: column">
      <!-- 顶部菜单 -->
      <TopMenu v-model="activeMenu" @logout="handleLogout" />

      <!-- 主体内容 -->
      <el-container style="flex: 1; overflow: auto; padding: 12px">
        <el-main style="display: flex; flex-direction: column; gap: 12px">
          <!-- 上传组件 -->
          <upload-area
            v-show="activeMenu === 'upload'"
            v-model:username="username"
            :bucket-options="bucketOptions"
            v-model:selected-bucket="selectedBucket"
            v-model:new-bucket="newBucket"
            @upload-success="onUploadSuccess"
          />

          <!-- 上传结果表格 -->
          <div v-show="activeMenu === 'upload'">
            <UpResultTable :uploadResults="uploadResults" />
          </div>

          <!-- 查询组件 -->
          <file-table
            v-if="activeMenu === 'query'"
            ref="fileTableRef"
            :query="query"
            @update:query="(val) => (query = val)"
          />

          <!-- 标签管理组件 -->
          <TagsPage v-if="activeMenu === 'tags'" ref="tagsPageRef" />

          <Register
            v-if="activeMenu === 'register'"
            @-register="handleRegister"
          />

          <UserInfo v-if="activeMenu === 'userinfo'" />

          <LogQuery v-if="activeMenu === 'logs'" />
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import UploadArea from "@/components/UploadArea.vue";
import FileTable from "@/components/FileTable.vue";
import TagsPage from "@/components/TagsPage.vue";
import LoginForm from "@/components/LoginForm.vue";
import TopMenu from "@/components/TopMenu.vue";
import Register from "@/components/Register.vue";
import UpResultTable from "@/components/UpResultTable.vue";
import UserInfo from "./components/UserInfo.vue";
import LogQuery from "./components/LogQuery.vue";
import { fetchBuckets } from "@/api/files";
import { login } from "@/services/auth";
import http, { API_BASE } from "@/plugins/axios.js";
import { register } from "@/services/auth";

// 登录相关状态
const JWTusername = ref("");
const JWTpassword = ref("");
const isLoggedIn = ref(false);
const username = ref(""); // 登录后的用户名

// 主内容状态
const activeMenu = ref("upload");
const bucketOptions = ref([]);
const selectedBucket = ref("");
const newBucket = ref("");
const query = ref({ uploader: "", fileName: "", bucket: "", id: "" });
const fileTableRef = ref(null);
const tagsPageRef = ref(null);
const uploadResults = ref([]);

// 登录处理
async function handleLogin({ username, password }) {
  try {
    const token = await login(username, password);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    isLoggedIn.value = true;
    ElMessage.success("登录成功");
    loadBuckets();
  } catch (err) {
    console.error("登录失败:", err);
    ElMessage.error(
      "登录失败：" + (err.response?.data?.message || err.message)
    );
  }
}

// 退出处理
async function handleLogout() {
  try {
    await http.post("/auth/logout"); // 不需要再写 API_BASE
    ElMessage.success("已退出登录");
  } catch (err) {
    console.warn("退出通知后端失败:", err);
  } finally {
    // 清理前端登录状态
    isLoggedIn.value = false;
    username.value = "";
    JWTusername.value = "";
    JWTpassword.value = "";
    localStorage.removeItem("jwt_token");
  }
}

async function handleRegister({
  registerUsername,
  registerPassword,
  registerRole,
}) {
  try {
    await register(registerUsername, registerPassword, registerRole);
    ElMessage.success("注册成功");
  } catch (err) {
    console.warn("注册失败:", err);
    ElMessage.error(err);
  }
}

// 加载桶列表
async function loadBuckets() {
  try {
    bucketOptions.value = await fetchBuckets();
  } catch {
    ElMessage.error("获取桶列表失败");
  }
}

// 上传成功回调
function onUploadSuccess(payload) {
  const resData = payload.res?.data ?? payload.res ?? payload;
  const item = {
    originalFileName: resData?.originalFileName ?? resData?.fileName ?? "",
    size: resData?.size ?? 0,
    bucket: resData?.bucket ?? selectedBucket.value ?? newBucket.value ?? "",
    eTag: resData?.eTag ?? "",
    username: resData?.username ?? username.value,
    tags: resData?.tags ?? [],
    uploadtime: resData?.uploadtime ? new Date(resData.uploadtime) : null,
  };
  uploadResults.value.unshift(item);

  loadBuckets();
  fileTableRef.value?.fetchFileList?.();
}

// 监听菜单切换，刷新对应组件
watch(activeMenu, (val) => {
  if (val === "tags") {
    tagsPageRef.value?.fetchAllTags?.();
    tagsPageRef.value?.fetchFilesByTagsPage?.();
  } else if (val === "query") {
    fileTableRef.value?.fetchFileList?.();
  }
});

// 初始化：检查本地token（保持登录状态）
onMounted(async () => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    isLoggedIn.value = true;
    // 这里可以补充：调用接口获取当前用户信息（如果需要）
    await loadBuckets(); // 已登录时加载桶列表
  }
});
</script>

<style scoped>
.top-menu {
  width: 100%;
}

.top-menu .el-menu-item {
  min-width: 100px;
  text-align: center;
}
</style>
