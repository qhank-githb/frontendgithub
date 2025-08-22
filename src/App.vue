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
      <el-menu
        mode="horizontal"
        :default-active="activeMenu"
        @select="activeMenu = $event"
        background-color="#409EFF"
        text-color="#fff"
        active-text-color="#fff "
        style="height: 50px"
      >
        <el-menu-item index="upload">上传文件</el-menu-item>
        <el-menu-item index="query">查询文件</el-menu-item>
        <el-menu-item index="tags">标签管理</el-menu-item>
      </el-menu>

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
          <TagsPage v-show="activeMenu === 'tags'" />
        </el-main>
      </el-container>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import UploadArea from "./components/UploadArea.vue";
import FileTable from "./components/FileTable.vue";
import { fetchBuckets } from "./api/files";
import { ElMessage } from "element-plus";
import { login } from "@/services/auth.js";
import TagsPage from "./components/TagsPage.vue";

const JWTusername = ref("");
const JWTpassword = ref("");
const isLoggedIn = ref(false); // 登录状态，测试其他功能，暂时默认为登录
const activeMenu = ref("upload"); // 默认显示上传页

// 上传组件绑定的数据
const username = ref("bolo-vue-test");
const bucketOptions = ref([]);
const selectedBucket = ref("");
const newBucket = ref("");

// 查询组件绑定的数据
const query = ref({ uploader: "", fileName: "", bucket: "", id: "" });
const fileTableRef = ref(null);

// 上传结果
const uploadResults = ref([]);

// 登录处理
async function handleLogin() {
  try {
    const token = await login(JWTusername.value, JWTpassword.value);
    console.log("登录成功，Token:", token);
    isLoggedIn.value = true;

    // 登录成功后加载桶和刷新表格
    await loadBuckets();
    fileTableRef.value?.fetchFileList?.();
  } catch (err) {
    alert("登录失败");
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
  console.log("uploadtime原始值", resData.uploadtime);
  console.log("Date对象", new Date(resData.uploadtime));

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

onMounted(async () => {
  // 如果需要记住登录状态，可在这里检查 token
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
