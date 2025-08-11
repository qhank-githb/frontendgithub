<template>
  <el-card>
    <h2>文件上传</h2>

    <!--inline:横向排布-->
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

      <!--拖拽上传-->
      <br />
      <el-form-item class="upload-form-item">
        <el-upload
          drag
          class="my-upload-area"
          :action="uploadAction"
          :data="{ username }"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          :before-upload="beforeUpload"
          :show-file-list="false"
          :multiple="true"
        >
          <div class="el-upload__text">
            将文件拖到此处，或 <em>点击上传</em>
            <br />
            上传文件大小不可超过 500MB
          </div>
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
    <h2>文件查询与下载</h2>
    <el-form :inline="true" class="mb-3">
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

      <el-form-item>
        <!-- selectedIds.length为 0 时，禁用按钮 -->
        <el-button
          type="success"
          class="mt-2"
          :disabled="selectedIds.length === 0"
          @click="batchDownload"
        >
          批量下载选中文件
        </el-button>
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

    <div class="demo-pagination-block">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :background="true"
        layout="total, sizes, prev, pager, next, jumper"
        :total="totalCount"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </el-card>
</template>

<script setup lang="js">
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

// ---------- 分页相关（新增） ----------
const currentPage = ref(1);      // 当前页码（1-based）
const pageSize = ref(10);       // 每页条数
const totalCount = ref(0);       // 总记录数
// -------------------------------------

const query = ref({
  uploader: "",
  fileName: "",
  bucket: ""
});

const uploadAction = computed(
  () => `${apiBase}/${actualBucket.value}/fileupload/upload`
);

onMounted(() => {
  fetchBuckets();
  fetchFileList(); // 初始加载第一页
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

// 查询文件列表（带分页）
// 注意：后端应返回 { Items: [...], TotalCount: N } 或 { items: [...], totalCount: N }
async function fetchFileList() {
  queryloading.value = true;
  // 只改了这里：把分页参数加入 params（其它查询条件保持不变）
  const params = {
    uploader: query.value.uploader,
    fileName: query.value.fileName,
    bucket: query.value.bucket,
    pageNumber: currentPage.value,
    pageSize: pageSize.value
  };

  try {
    const res = await axios.get(`${apiBase}/filequery/query`, { params });

    // 兼容大小写两种命名：Items / items
    const data = res.data || {};
    files.value = data.Items ?? data.items ?? [];
    // total 优先取返回值，否则回退为当前页长度（以免为 undefined）
    totalCount.value = (data.TotalCount ?? data.totalCount) ?? files.value.length;
  } catch (error) {
    ElMessage.error("查询文件列表失败");
    console.error("查询错误:", error);
  } finally {
    queryloading.value = false;
  }
}

function onSelectionChange(rows) {
  selectedIds.value = rows.map((r) => r.id);
}

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
      responseType: "blob",   //使用blob类型下载二进制文件
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

    const blob = new Blob([res.data]);   //res.data本就是blob类型 为了兼容性重新创建blob对象
    const link = document.createElement("a");  //标准的浏览器端“模拟点击下载”的做法。 创建<a>标签
    link.href = URL.createObjectURL(blob);     //临时下载连接
    link.download = filename;    // https://developer.mozilla.org/zh-CN/docs/Web/API/HTMLAnchorElement/download
    link.click();                //模拟点击触发下载
    URL.revokeObjectURL(link.href);     //释放内存
  } catch (error) {
    console.error(error);
    ElMessage.error("下载失败");
  }
}

// 批量下载,与downloadById()类似
async function batchDownload() {
  try {
    const url = joinUrl(apiBase, "file", "batch-download");
    const res = await axios.post(url, selectedIds.value, {     //使用POST上传selectedIds
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/zip" }); //指定下载zip
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

// ---------- 分页事件处理（只改了这里） ----------
const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1; // 修改每页大小后回到第一页
  fetchFileList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchFileList();
};
// -----------------------------------------------
</script>

<style scoped>
.mb-3 {
  margin-bottom: 16px;
}

.upload-form-item {
  width: 100%;
}
.my-upload-area {
  /* 控制外层包装器的尺寸 */
  width: 100%;
  height: 170px;
}

.my-upload-area .el-upload-dragger {
  /* 控制拖拽框内实际可用区域 */
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
