<template>
  <div>
    <!-- 查询表单 -->
    <el-form
      :inline="true"
      class="mb-3"
      style="width: 100%; display: flex; flex-wrap: wrap; align-items: center"
    >
      <el-form-item label="上传者">
        <el-input v-model="queryLocal.uploader" style="width: 200px" />
      </el-form-item>
      <el-form-item label="文件名">
        <el-input v-model="queryLocal.fileName" style="width: 200px" />
      </el-form-item>
      <el-form-item label="所在桶">
        <el-input v-model="queryLocal.bucket" style="width: 200px" />
      </el-form-item>
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          style="width: 350px"
        />
      </el-form-item>
      <el-form-item label="ID">
        <el-input v-model="queryLocal.id" style="width: 75px" />
      </el-form-item>

      <el-form-item style="margin-left: auto; display: flex; gap: 10px">
        <el-button type="primary" @click="SetAllSelection">
          勾选全部符合条件的 {{ totalCount }} 个对象
        </el-button>
        <el-button
          type="warning"
          @click="clearAllSelection"
          :disabled="selectedIds.length === 0"
        >
          取消所有勾选
        </el-button>
        <el-button
          @click="fetchFileList"
          type="primary"
          :loading="queryLoading"
        >
          查询
        </el-button>
        <el-button
          type="success"
          :disabled="selectedIds.length === 0"
          @click="batchDownload"
        >
          批量下载选中文件 已选中 {{ selectedIds.length }} 个
        </el-button>
      </el-form-item>
    </el-form>

    <!-- 文件表格 -->
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
          <el-button @click="handlePreview(row.id, row.originalFileName)"
            >预览文件</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <el-dialog v-model="dialogVisible" width="80%">
      <!-- Office 文件 -->
      <vue-office-docx
        v-if="fileType === 'docx' && fileUrl"
        :src="fileUrl"
        style="height: 80vh; width: 100%"
        @rendered="onRendered"
        @error="onError"
      />
      <vue-office-excel
        v-if="fileType === 'xlsx' && fileUrl"
        :src="fileUrl"
        style="height: 80vh; width: 100%"
        @rendered="onRendered"
        @error="onError"
      />

      <!-- PDF/图片/视频 -->
      <div
        v-if="['pdf', 'image', 'video'].includes(fileType)"
        ref="containerRef"
        style="width: 100%; height: 600px; overflow: auto"
      ></div>

      <!-- 不支持文件 -->
      <div v-if="fileType === 'unknown'" style="color: red">
        不支持预览此类型文件
      </div>
    </el-dialog>

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

    <!-- 返回顶部 -->
    <el-backtop
      style="
        background-color: #409eff;
        color: white;
        box-shadow: var(--el-box-shadow-lighter);
        width: 50px;
        height: 50px;
        font-size: 32px;
      "
    />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch, onMounted } from "vue";
import axios from "axios";
import * as filesApi from "@/api/files";
import { ElLoading, ElMessage } from "element-plus";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import { useUniversalPreview } from "@/composables/useUniversalPreview";
import * as pdfjsLib from "pdfjs-dist";

const apiBase = "http://192.168.150.93:5000/api"; // 后端地址
//////////////预览
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

const {
  dialogVisible,
  fileUrl,
  fileBlob,
  fileType,
  previewFile,
  onRendered,
  onError,
} = useUniversalPreview("http://192.168.150.93:5000");

const containerRef = ref(null);

function handlePreview(id, filename) {
  previewFile(id, filename);
}

// 渲染 PDF/图片/视频
watch([fileType, fileBlob], async () => {
  if (!containerRef.value || !fileBlob.value) return;
  if (fileType.value === "image") {
    const url = URL.createObjectURL(fileBlob.value);
    containerRef.value.innerHTML = `<img src="${url}" style="max-width:100%; max-height:600px"/>`;
  } else if (fileType.value === "video") {
    const url = URL.createObjectURL(fileBlob.value);
    containerRef.value.innerHTML = `<video src="${url}" controls style="max-width:100%; max-height:600px"></video>`;
  } else if (fileType.value === "pdf") {
    const arrayBuffer = await fileBlob.value.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    containerRef.value.innerHTML = "";
    containerRef.value.appendChild(canvas);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
});
/////////////

// 查询表单绑定
const props = defineProps({
  query: {
    type: Object,
    default: () => ({ uploader: "", fileName: "", bucket: "", id: "" }),
  },
});
const emit = defineEmits(["update:query"]);
const queryLocal = reactive({ ...props.query });

watch(
  () => props.query,
  (v) => Object.assign(queryLocal, v),
  { deep: true }
);
watch(queryLocal, (v) => emit("update:query", { ...v }), { deep: true });

// 文件表格及分页
const files = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const queryLoading = ref(false);
const timeRange = ref(null);

// selection
const selectedRowsMap = reactive(new Map());
const selectedIds = ref([]);
const multipleTable = ref(null);
const isRestoringSelection = ref(false);
const isPageChanging = ref(false);

// 获取文件列表
async function fetchFileList() {
  queryLoading.value = true;
  try {
    const params = {};
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (queryLocal.bucket) params.bucket = queryLocal.bucket.trim();
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      const [s, e] = timeRange.value;
      params.start = new Date(s).toISOString();
      params.end = new Date(e).toISOString();
    }
    params.pageNumber = currentPage.value;
    params.pageSize = pageSize.value;

    isRestoringSelection.value = true;
    const res = await axios.get(`${apiBase}/filequery/query`, { params });
    const data = res.data ?? {};
    files.value = data.Items ?? data.items ?? data.data ?? [];
    totalCount.value =
      data.TotalCount ?? data.totalCount ?? data.total ?? files.value.length;

    await nextTick();
    if (multipleTable.value?.clearSelection)
      multipleTable.value.clearSelection();
    files.value.forEach((row) => {
      if (selectedRowsMap.has(String(row.id))) {
        multipleTable.value?.toggleRowSelection?.(row, true);
      }
    });

    isRestoringSelection.value = false;
    isPageChanging.value = false;
    selectedIds.value = Array.from(selectedRowsMap.keys());
  } catch (err) {
    console.error(err);
    isRestoringSelection.value = false;
    isPageChanging.value = false;
    ElMessage.error("查询文件列表失败");
  } finally {
    queryLoading.value = false;
  }
}

// selection change
function onSelectionChange(rows) {
  const currentIds = rows.map((r) => String(r.id));
  rows.forEach((r) => selectedRowsMap.set(String(r.id), r));
  if (isRestoringSelection.value || isPageChanging.value) {
    selectedIds.value = Array.from(selectedRowsMap.keys());
    return;
  }
  files.value.forEach((row) => {
    const key = String(row.id);
    if (!currentIds.includes(key)) selectedRowsMap.delete(key);
  });
  selectedIds.value = Array.from(selectedRowsMap.keys());
}

// 全选当前查询所有页面
async function SetAllSelection() {
  try {
    const params = {};
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (queryLocal.bucket) params.bucket = queryLocal.bucket.trim();
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      const [s, e] = timeRange.value;
      params.start = new Date(s).toISOString();
      params.end = new Date(e).toISOString();
    }

    const res =
      Object.keys(params).length === 0
        ? await axios.get(`${apiBase}/filequery/query-ids`)
        : await axios.get(`${apiBase}/filequery/query-ids`, { params });

    const allIds = res.data?.items ?? [];
    allIds.forEach((id) => selectedRowsMap.set(String(id), { id }));
    isRestoringSelection.value = true;
    multipleTable.value?.clearSelection?.();
    await nextTick();
    files.value.forEach((row) => {
      if (selectedRowsMap.has(String(row.id)))
        multipleTable.value?.toggleRowSelection?.(row, true);
    });
    isRestoringSelection.value = false;
    selectedIds.value = Array.from(selectedRowsMap.keys());
    ElMessage.success(`已选中所有页面，共 ${allIds.length} 个文件`);
  } catch (err) {
    console.error(err);
    isRestoringSelection.value = false;
    ElMessage.error("全选失败");
  }
}

// 清空选择
function clearAllSelection() {
  isRestoringSelection.value = true;
  isPageChanging.value = true;
  multipleTable.value?.clearSelection?.();
  selectedRowsMap.clear();
  selectedIds.value = [];
  isRestoringSelection.value = false;
  isPageChanging.value = false;
}

// 下载
async function downloadById(id) {
  const loading = ElLoading.service({ text: "正在下载..." });
  try {
    const res = await filesApi.downloadById(id);
    let filename = `file_${id}`;
    const disposition = res.headers["content-disposition"];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match) filename = decodeURIComponent(match[1]);
    }
    const blob = new Blob([res.data]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    ElMessage.error("下载失败");
  } finally {
    loading.close();
  }
}

// 批量下载
async function batchDownload() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请先选择要下载的文件");
    return;
  }
  const loading = ElLoading.service({ text: "正在下载..." });
  try {
    const idsToSend = selectedIds.value.map(Number).filter((n) => !isNaN(n));
    if (idsToSend.length === 0) return ElMessage.error("没有有效 ID");
    const res = await filesApi.batchDownload(idsToSend);
    const blob = new Blob([res.data], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error(err);
    ElMessage.error("批量下载失败");
  } finally {
    loading.close();
  }
}

// 分页
function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
  isPageChanging.value = true;
  fetchFileList();
}
function handleCurrentChange(val) {
  currentPage.value = val;
  isPageChanging.value = true;
  fetchFileList();
}

// 初次加载
onMounted(fetchFileList);
defineExpose({ fetchFileList });
</script>

<style scoped>
.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
.preview-box {
  width: 100%;
  text-align: center;
}
</style>
