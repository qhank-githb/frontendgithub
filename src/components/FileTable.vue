<template>
  <div>
    <!------------- 查询表单，包含勾选 下载等按钮 开始 --------------------->
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
        <el-select
          v-model="selectedTags"
          multiple
          filterable
          allow-create
          collapse-tags
          placeholder="选择或输入标签"
          style="width: 300px"
        >
          <el-option
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.id"
          />
        </el-select>

        <!-- 匹配模式 -->
        <el-checkbox v-model="tagMatchMode" true-label="all" false-label="any"
          >全部匹配</el-checkbox
        >

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
    <!------------- 查询表单，包含勾选 下载等按钮 结束 --------------------->

    <!--------预览文件区域 开始---------->
    <el-dialog v-model="dialogVisible" width="80%" :before-close="closeDialog">
      <!-- Office 文件 -->
      <vue-office-docx
        v-if="fileType === 'docx' && fileUrl"
        :src="fileUrl"
        style="height: 80vh; width: 100%"
        @rendered="onRendered"
        @error="onError"
      />
      <vue-office-pptx
        v-if="fileType === 'pptx' && fileUrl"
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
      <vue-office-pdf
        v-if="fileType === 'pdf' && fileUrl"
        :src="fileUrl"
        style="height: 80vh; width: 100%"
        @rendered="onRendered"
        @error="onError"
      />

      <!-- 图片 -->
      <img
        v-if="
          ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType) &&
          fileUrl
        "
        :src="fileUrl"
        style="max-width: 100%; max-height: 80vh"
      />

      <!-- 视频 -->
      <video
        v-if="['mp4', 'webm', 'ogg'].includes(fileType) && fileUrl"
        :src="fileUrl"
        controls
        style="max-width: 100%; max-height: 80vh"
      ></video>

      <!-- 文本 -->
      <pre
        v-if="['txt', 'csv', 'log'].includes(fileType)"
        style="white-space: pre-wrap"
        >{{ textContent }}</pre
      >

      <!-- Markdown -->
      <div v-if="fileType === 'md'" v-html="renderedMarkdown"></div>

      <!-- JSON -->
      <pre v-if="fileType === 'json'">{{ formattedJson }}</pre>

      <!-- 不支持 -->
      <div v-if="fileType === 'unknown'">不支持预览此类型文件</div>
    </el-dialog>
    <!--------------预览文件区域 结束-------------->

    <!------------------分页部分 开始------------------>
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
    <!-------------分页部分 结束---------------->

    <!--------------- 返回顶部 开始 ------------>
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
    <!------------ 返回顶部 结束 ------------->
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch, onMounted } from "vue";
import axios from "axios";
import * as filesApi from "@/api/files";
import { ElLoading, ElMessage } from "element-plus";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import VueOfficePptx from "@vue-office/pptx";
import VueOfficePdf from "@vue-office/pdf";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import { useUniversalPreview } from "@/composables/useUniversalPreview";
import { useTagQuery } from "@/composables/useTagQuery.js";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).href;

const apiBase = "http://192.168.150.93:5000/api"; // 后端地址
//////////////预览开始

const {
  dialogVisible,
  fileUrl,
  fileType,
  textContent,
  renderedMarkdown,
  formattedJson,
  previewFileById,
  onRendered,
  onError,
  closeDialog,
} = useUniversalPreview("http://192.168.150.93:5000");

function handlePreview(id, filename) {
  previewFileById(id, filename);
}
/////////////预览结束

////////tag查询
// --- 新增 tag 状态 ---
const selectedTags = ref([]); // 多选标签
const allTags = ref([]); // 可选的标签列表
const tagMatchMode = ref("any"); // 'any' 或 'all'，checkbox 控制
///////

function onSelectionChange(selection) {
  selectedIds.value = selection.map((item) => item.id);
}

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
async function fetchFileList(options = {}) {
  queryLoading.value = true;
  try {
    const params = {
      pageNumber: options.pageNumber ?? currentPage.value,
      pageSize: options.pageSize ?? pageSize.value,
    };

    // 查询条件
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (queryLocal.bucket) params.bucket = queryLocal.bucket.trim();
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      params.start = new Date(timeRange.value[0]).toISOString();
      params.end = new Date(timeRange.value[1]).toISOString();
    }
    if (selectedTags.value.length > 0) {
      params.tags = selectedTags.value;
      params.matchAllTags = tagMatchMode.value === "all";
    }

    console.log("fetchFileList params:", params);
    const res = await axios.get(
      "http://192.168.150.93:5000/api/filequery/query",
      {
        params,
        headers: { Accept: "application/json" },
      }
    );
    console.log(res.data);

    const data = res.data ?? {};
    files.value = data.items ?? [];
    totalCount.value = data.totalCount ?? files.value.length;

    await nextTick();
    if (multipleTable.value?.clearSelection)
      multipleTable.value.clearSelection();

    // 恢复选中状态
    selectedIds.value.forEach((id) => {
      const row = files.value.find((f) => f.id === id);
      if (row) multipleTable.value?.toggleRowSelection?.(row, true);
    });
  } catch (err) {
    console.error("fetchFileList error:", err);
    ElMessage.error("查询文件列表失败，请检查接口或网络");
  } finally {
    queryLoading.value = false;
  }
}

// selection change
async function SetAllSelection() {
  try {
    const params = {};
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (queryLocal.bucket) params.bucket = queryLocal.bucket.trim();
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      params.start = new Date(timeRange.value[0]).toISOString();
      params.end = new Date(timeRange.value[1]).toISOString();
    }
    if (selectedTags.value.length > 0) {
      params.tags = selectedTags.value;
      params.matchAllTags = tagMatchMode.value === "all";
    }

    const res =
      Object.keys(params).length === 0
        ? await axios.get(`${apiBase}/filequery/query-ids`, {
            responseType: "json",
          })
        : await axios.get(`${apiBase}/filequery/query-ids`, {
            params,
            responseType: "json",
          });

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
    ElMessage.success(`已选中所有符合条件的文件，共 ${allIds.length} 个`);
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
onMounted(async () => {
  fetchFileList();
  try {
    const res = await axios.get("http://192.168.150.93:5000/api/tags");
    allTags.value = res.data;
  } catch (err) {
    console.error("加载标签失败", err);
  }
});
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
