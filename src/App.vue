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
      <!-- 顶部菜单 -->
      <div style="display: flex; align-items: center; padding: 0 16px">
        <!-- 菜单部分 -->
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

        <!-- 退出按钮靠右 -->
        <el-button
          type="warning"
          @click="handleLogout"
          style="
            background-color: #ff9900ff;
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
import UploadArea from "./components/UploadArea.vue";
import FileTable from "./components/FileTable.vue";
import TagsPage from "./components/TagsPage.vue";
import { fetchBuckets } from "./api/files";
import { ElMessage } from "element-plus";
import http from "@/plugins/axios";

const JWTusername = ref("");
const JWTpassword = ref("");
const isLoggedIn = ref(false);
const activeMenu = ref("upload");

const username = ref("bolo-vue-test");
const bucketOptions = ref([]);
const selectedBucket = ref("");
const newBucket = ref("");

const query = ref({ uploader: "", fileName: "", bucket: "", id: "" });
const fileTableRef = ref(null);
const tagsPageRef = ref(null); // 标签页 ref

const uploadResults = ref([]);

// 登录处理
async function handleLogin() {
  try {
    const res = await http.post("/auth/login", {
      // 使用http实例
      username: JWTusername.value,
      password: JWTpassword.value,
    });

    const token = res.data.token;
    if (!token) {
      alert("登录失败：没有拿到 token");
      return;
    }

    // 保存 token（http实例会自动在请求拦截器中添加token）
    localStorage.setItem("jwt_token", token);
    username.value = JWTusername.value;

    isLoggedIn.value = true;
    console.log("登录成功，Token:", token);
  } catch (err) {
    console.error("登录失败:", err);
    alert("登录失败：" + err.message);
  }
}

async function handleLogout() {
  delete http.defaults.headers.common["Authorization"];
  isLoggedIn.value = false;

  try {
    await http.post("http://192.168.150.93:5000/api/auth/logout");
    console.log("已通知后端用户退出");
  } catch (err) {
    console.warn("退出日志通知后端失败:", err);
  }

  localStorage.removeItem("jwt_token"); // 可选：清理本地 token
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

// 🔹监听菜单切换，刷新标签页
watch(activeMenu, (val) => {
  if (val === "tags") {
    tagsPageRef.value?.fetchAllTags?.();
    tagsPageRef.value?.fetchFilesByTagsPage?.();
  } else if (val === "query") {
    fileTableRef.value?.fetchFileList?.(); // 调用查询组件的刷新方法
  }
});

onMounted(async () => {
  // 可在这里检查 token 或加载桶
});
</script>

<style>
.top-menu {
  width: 100%;
}

.top-menu .el-menu-item {
  min-width: 100px;
  text-align: center;
}
</style>
