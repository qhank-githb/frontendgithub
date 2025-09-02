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
      <el-card style="width: 300px; padding: 20px">
        <h3 style="text-align: center; margin-bottom: 12px">登录</h3>
        <el-input
          v-model="JWTusername"
          placeholder="用户名"
          style="margin-bottom: 12px"
        />
        <el-input
          v-model="JWTpassword"
          placeholder="密码"
          type="password"
          style="margin-bottom: 12px"
        />
        <el-button type="primary" style="width: 100%" @click="handleLogin"
          >登录</el-button
        >
      </el-card>
    </div>

    <!-- 主页面（菜单 + 内容） -->
    <div v-else style="height: 100vh; display: flex; flex-direction: column">
      <!-- 顶部菜单 -->
      <div style="display: flex; align-items: center; padding: 0 16px">
        <el-menu
          mode="horizontal"
          :default-active="activeMenu"
          @select="activeMenu = $event"
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

      <!-- 主体内容 -->
      <el-container style="flex: 1; overflow: auto; padding: 12px">
        <el-main style="display: flex; flex-direction: column; gap: 12px">
          <!-- 上传组件 -->
          <upload-area
            v-show="activeMenu === 'upload'"
            :username="username"
            :bucket-options="bucketOptions"
            v-model:selected-bucket="selectedBucket"
            v-model:new-bucket="newBucket"
            @upload-success="onUploadSuccess"
          />

          <!-- 上传结果表格 -->
          <div v-show="activeMenu === 'upload'">
            <h3
              style="
                display: flex;
                align-items: center;
                justify-content: space-between;
              "
            >
              <span>上传结果（最近 {{ uploadResults.length }} 条）</span>
            </h3>

            <el-table
              :data="uploadResults"
              style="width: 100%"
              border
              v-if="uploadResults.length > 0"
            >
              <el-table-column
                prop="originalFileName"
                label="文件名"
                show-overflow-tooltip
              />
              <el-table-column prop="tags" label="标签" />
              <el-table-column prop="size" label="文件大小" />
              <el-table-column prop="username" label="上传者" />
              <el-table-column
                prop="uploadtime"
                label="上传时间"
                :formatter="
                  (row) =>
                    row.uploadtime ? row.uploadtime.toLocaleString() : ''
                "
              />
            </el-table>
            <div v-else style="color: #999; padding: 12px 0">暂无上传记录</div>
          </div>

          <!-- 查询组件 -->
          <file-table
            v-show="activeMenu === 'query'"
            ref="fileTableRef"
            :query="query"
            @update:query="(val) => (query = val)"
          />

          <!-- 标签管理组件 -->
          <TagsPage v-show="activeMenu === 'tags'" ref="tagsPageRef" />
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import UploadArea from "./UploadArea.vue";
import FileTable from "./FileTable.vue";
import TagsPage from "./TagsPage.vue";
import { fetchBuckets } from "../api/files";
import { ElMessage } from "element-plus";
import axios from "axios";
import { login } from "../services/auth"; // 引入登录API
import { API_BASE } from "@/plugins/axios";

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
async function handleLogin() {
  try {
    // 调用登录API
    const token = await login(JWTusername.value, JWTpassword.value);
    // 设置全局token
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    username.value = JWTusername.value;
    isLoggedIn.value = true;
    // 登录成功后加载桶列表
    loadBuckets();
    ElMessage.success("登录成功");
  } catch (err) {
    console.error("登录失败:", err);
    ElMessage.error(
      "登录失败：" + (err.response?.data?.message || err.message)
    );
  }
}

// 退出处理
async function handleLogout() {
  delete axios.defaults.headers.common["Authorization"];
  isLoggedIn.value = false;
  username.value = "";
  JWTusername.value = "";
  JWTpassword.value = "";

  try {
    await axios.post(`${API_BASE}/auth/logout`);
    ElMessage.success("已退出登录");
  } catch (err) {
    console.warn("退出通知后端失败:", err);
  }
  localStorage.removeItem("jwt_token");
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
