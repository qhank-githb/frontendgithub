<template>
  <el-card>
    <h2>文件上传</h2>

    <el-form :inline="true" class="mb-3">
      <el-form-item label="用户名">
        <el-input
          v-model="username"
          placeholder="请输入用户名"
          style="width: 200px"
        />
      </el-form-item>

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

      <el-form-item label="新建桶名">
        <el-input
          v-model="newBucket"
          placeholder="输入新桶名"
          style="width: 200px"
          @input="onNewBucketInput"
        />
      </el-form-item>

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

    <div
      style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px"
    >
      <h3 style="margin: 0">上传结果</h3>
      <small style="color: #888">最多显示10个上传结果</small>
    </div>

    <el-table :data="uploadResults" style="width: 100%" border>
      <el-table-column prop="originalFileName" label="文件名" />
      <el-table-column prop="size" label="文件大小" />
      <el-table-column prop="bucket" label="所在桶的名称" />
      <el-table-column prop="eTag" label="ETag" />
    </el-table>

    <el-divider />

    <h2>文件查询与下载</h2>
    <el-form
      :inline="true"
      class="mb-3"
      style="width: 100%; display: flex; flex-wrap: wrap; align-items: center"
    >
      <el-form-item label="上传者">
        <el-input v-model="query.uploader" style="width: 200px" />
      </el-form-item>
      <el-form-item label="文件名">
        <el-input v-model="query.fileName" style="width: 200px" />
      </el-form-item>
      <el-form-item label="所在桶">
        <el-input v-model="query.bucket" style="width: 200px" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          style="width: 350px"
        />
      </el-form-item>
      <el-form-item label="ID">
        <el-input v-model="query.id" style="width: 75px" />
      </el-form-item>

      <el-form-item style="margin-left: auto; display: flex; gap: 10px">
        <el-button @click="fetchFileList" type="primary" :loading="queryloading"
          >查询</el-button
        >
        <el-button
          type="success"
          :disabled="selectedIds.length === 0"
          @click="batchDownload"
          >批量下载选中文件</el-button
        >
      </el-form-item>
    </el-form>

    <el-table
      :data="files"
      style="width: 100%"
      ref="multipleTable"
      :row-key="(row) => row.id"
      @selection-change="onSelectionChange"
      border
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="originalFileName" label="文件名" />
      <el-table-column prop="fileSize" label="文件大小" />
      <el-table-column prop="bucketname" label="所在桶的名称" />
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
import { ref, computed, onMounted, reactive, nextTick } from "vue";
import axios from "axios";
import { ElMessage } from "element-plus";

const apiBase = "http://192.168.150.93:5000/api";

const username = ref("bolo-vue-test");
const uploadLoading = ref(false);
const uploadResults = ref([]);
const timeRange = ref([]);

// 跨页保存选中项：key=id, value=row对象
// 使用 reactive(new Map()) 是可以的，但注意 Map 的一些响应性限制（这里只用于存储/读取）
const selectedRowsMap = reactive(new Map());
const multipleTable = ref(null);

const bucketOptions = ref([]);
const selectedBucket = ref("");
const newBucket = ref("");

const actualBucket = computed(() => newBucket.value.trim() || selectedBucket.value);

const files = ref([]);
const selectedIds = ref([]); // 用于批量下载（存储所有页的选中 id）
const queryloading = ref(false);

const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);

const query = ref({
  uploader: "",
  fileName: "",
  bucket: "",
  id: ""
});

const uploadAction = computed(
  () => `${apiBase}/${actualBucket.value}/fileupload/upload`
);

onMounted(() => {
  fetchBuckets();
  fetchFileList();
});

function onBucketSelected(value) {
  newBucket.value = "";
}
function onNewBucketInput(value) {
  selectedBucket.value = "";
}

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

function handleUploadSuccess(res) {
  uploadResults.value.unshift(res);
  ElMessage.success("上传成功");
  if (uploadResults.value.length > 10) uploadResults.value.pop();
  uploadLoading.value = false;
  newBucket.value = "";
  fetchBuckets();
}

function handleUploadError(err) {
  console.error("上传失败", err);
  ElMessage.error("上传失败，请重试");
  uploadLoading.value = false;
}

// ---------- fetchFileList（带分页） ----------
async function fetchFileList() {
  queryloading.value = true;
  const params = {
    uploader: query.value.uploader,
    fileName: query.value.fileName,
    bucket: query.value.bucket,
    pageNumber: currentPage.value,
    pageSize: pageSize.value,
    start: timeRange.value[0] ? timeRange.value[0].toISOString() : null,
    end: timeRange.value[1] ? timeRange.value[1].toISOString() : null,
    id: query.value.id
  };

  try {
    const res = await axios.get(`${apiBase}/filequery/query`, { params });
    const data = res.data || {};
    files.value = data.Items ?? data.items ?? [];
    totalCount.value = (data.TotalCount ?? data.totalCount) ?? files.value.length;

    // 等 DOM 更新后，恢复当前页中已选的行
    await nextTick();

    // 先清理当前表格的 selection（避免冲突）
    if (multipleTable.value && typeof multipleTable.value.clearSelection === "function") {
      multipleTable.value.clearSelection();
    }

    files.value.forEach(row => {
      if (!row || row.id === undefined || row.id === null) return;
      if (selectedRowsMap.has(row.id)) {
        // 再次选中当前页里曾经选中的行
        if (multipleTable.value && typeof multipleTable.value.toggleRowSelection === "function") {
          multipleTable.value.toggleRowSelection(row, true);
        }
      }
    });
  } catch (error) {
    ElMessage.error("查询文件列表失败");
    console.error("查询错误:", error);
  } finally {
    queryloading.value = false;
  }
}
// -------------------------------------------------

// 修正后的 onSelectionChange：使用传入的 rows 参数（不要用未声明的变量）
function onSelectionChange(rows) {
  // rows 是当前页被勾选的行数组
  const currentIds = rows.map(r => r.id);

  // 1）把当前页选中的都加入 Map
  rows.forEach(item => {
    if (item && item.id !== undefined && item.id !== null) {
      selectedRowsMap.set(item.id, item);
    }
  });

  // 2）把当前页未选中的，从 Map 里删掉（只删除当前页的未选中项）
  files.value.forEach(row => {
    if (!row || row.id === undefined || row.id === null) return;
    if (!currentIds.includes(row.id)) {
      selectedRowsMap.delete(row.id);
    }
  });

  // 3）更新 selectedIds（用于批量下载）
  selectedIds.value = Array.from(selectedRowsMap.keys());
}

// ---------- 其它方法（下载、批量下载等） ----------
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

async function batchDownload() {
  try {
    if (selectedIds.value.length === 0) {
      ElMessage.warning("请先选择要下载的文件");
      return;
    }
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

function joinUrl(...parts) {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, "")).join("/");
}

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchFileList();
};
const handleCurrentChange = (val) => {
  currentPage.value = val;
  fetchFileList();
};
</script>

<style scoped>
.mb-3 {
  margin-bottom: 16px;
}

.upload-form-item {
  width: 100%;
}
.my-upload-area {
  width: 100%;
  height: 170px;
}

.my-upload-area .el-upload-dragger {
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
