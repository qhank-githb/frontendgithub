<template>
  <el-card>
    <h2>文件上传</h2>

    <el-form :inline="true" class="mb-3">
      <!-- 用户名 -->
      <el-form-item label="用户名">
        <el-input
          v-model="username"
          placeholder="请输入用户名"
          style="width: 200px"
        />
      </el-form-item>

      <!-- 选择已有桶 -->
      <el-form-item label="选择已有桶">
        <el-select
          v-model="selectedBucket"
          placeholder="请选择桶名"
          style="width: 200px"
          @change="onBucketSelected"
        >
          <el-option
            v-for="bucket in bucketOptions"
            :key="bucket"
            :label="bucket"
            :value="bucket"
          />
        </el-select>
      </el-form-item>

      <!-- 新建桶名 -->
      <el-form-item label="新建桶名">
        <el-input
          v-model="newBucket"
          placeholder="输入新桶名"
          style="width: 200px"
          @input="onNewBucketInput"
        />
      </el-form-item>

      <!-- 上传按钮 -->
      <el-form-item>
        <el-upload
          :action="uploadAction"
          :data="{ username }"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :show-file-list="false"
        >
          <el-button type="primary" :loading="uploadLoading">
            选择并上传文件
          </el-button>
        </el-upload>
      </el-form-item>
    </el-form>

    <!-- 上传结果 -->
    <h3>上传结果</h3>
    <el-table :data="uploadResults" style="width: 100%" border>
      <el-table-column prop="originalFileName" label="文件名" />
      <el-table-column prop="size" label="文件大小" />
      <el-table-column prop="bucket" label="所在Bucket名称" />
      <el-table-column prop="eTag" label="ETag" />
      <el-table-column prop="storedfilename" label="存储文件名" />
    </el-table>

    <el-divider />

    <!-- 查询功能 -->
    <h2>文件查询</h2>
    <el-form :inline="true" class="mb-3" @submit.prevent>
      <el-form-item label="上传者">
        <el-input v-model="query.uploader" />
      </el-form-item>
      <el-form-item label="文件名">
        <el-input v-model="query.fileName" />
      </el-form-item>
      <el-form-item label="Bucket">
        <el-input v-model="query.bucket" />
      </el-form-item>
      <el-form-item>
        <el-button @click="fetchFileList" type="primary" :loading="queryloading"
          >查询</el-button
        >
      </el-form-item>
    </el-form>

    <el-table
      :data="files"
      style="width: 100%"
      @selection-change="onSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="originalFileName" label="文件名" />
      <el-table-column prop="fileSize" label="文件大小" />
      <el-table-column prop="bucketname" label="所在Bucket名称" />
      <el-table-column prop="uploader" label="上传者" />
      <el-table-column prop="uploadTime" label="上传时间" />
      <el-table-column prop="eTag" label="ETag" />
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="downloadById(row.id)"
            >下载</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <el-button
      type="success"
      class="mt-2"
      :disabled="selectedIds.length === 0"
      @click="batchDownload"
    >
      批量下载选中文件
    </el-button>
  </el-card>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

const apiBase = "http://192.168.150.93:5000/api";

const username = ref("bolo-vue-test");
const uploadLoading = ref(false);
const uploadResults = ref([]);

const bucketOptions = ref([]);
const selectedBucket = ref(""); // 已有桶名选择
const newBucket = ref(""); // 新建桶名输入

const actualBucket = computed(() => {
  return newBucket.value.trim() || selectedBucket.value;
});

const files = ref([]);
const selectedIds = ref([]);
const queryloading = ref(false);
const query = ref({
  uploader: "",
  fileName: "",
  bucket: "",
});

const uploadAction = computed(
  () => `${apiBase}/${actualBucket.value}/fileupload/upload`
);

onMounted(() => {
  fetchBuckets();
});

// 互斥逻辑
function onBucketSelected(value) {
  newBucket.value = "";
}
function onNewBucketInput(value) {
  selectedBucket.value = "";
}

// 上传验证
function beforeUpload(file) {
  if (!username.value) {
    ElMessage.error("请先填写用户名");
    return false;
  }
  if (!actualBucket.value) {
    ElMessage.error("请选择或输入桶名");
    return false;
  }
  uploadLoading.value = true;
  return true;
}

// 上传成功
function handleUploadSuccess(res) {
  uploadResults.value.unshift(res);
  ElMessage.success("上传成功");
  uploadLoading.value = false;
  newBucket.value = "";
  fetchBuckets();
}

// 上传失败
function handleUploadError(err) {
  console.error("上传失败", err);
  ElMessage.error("上传失败，请重试");
  uploadLoading.value = false;
}

// 查询文件列表
async function fetchFileList() {
  queryloading.value = true;
  const { uploader, fileName, bucket } = query.value;
  const params = { uploader, fileName, bucket };

  try {
    const res = await axios.get(`${apiBase}/filequery/query`, { params });
    files.value = res.data;
  } catch (error) {
    ElMessage.error("查询文件列表失败");
  } finally {
    queryloading.value = false;
  }
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id);
}

const fileApiBase = computed(() => {
  if (!actualBucket.value) return "";
  // 拼成 "http://...:5000/api/BUCKET/file"
  return joinUrl(apiBase, actualBucket.value, "file");
});

// 页面加载时获取桶列表
async function fetchBuckets() {
  try {
    const res = await axios.get(`${apiBase}/buckets`);
    bucketOptions.value = res.data;
  } catch (error) {
    ElMessage.error("获取桶列表失败");
  }
}

async function downloadById(id) {
  try {
    const url = joinUrl(apiBase, "file", "download-by-id");
    const res = await axios.get(url, {
      params: { id },
      responseType: "blob",
    });

    // 从响应头获取文件名
    const disposition = res.headers["content-disposition"];
    let filename = `file_${id}`;
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) {
        filename = decodeURIComponent(match[1]);
      }
    }

    const blob = new Blob([res.data]);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error(error);
    ElMessage.error("下载失败");
  }
}

// 如果批量下载也不需要桶名
async function batchDownload() {
  try {
    const url = joinUrl(apiBase, "file", "batch-download");
    const res = await axios.post(url, selectedIds.value, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error(error);
    ElMessage.error("批量下载失败");
  }
}

//统一清理 URL 拼接
function joinUrl(...parts) {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, "")).join("/");
}
</script>

<style scoped>
.mb-3 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 16px;
}
</style>
