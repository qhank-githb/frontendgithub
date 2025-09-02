<template>
  <div>
    <!-- 查询表单 -->
    <el-form :inline="true" class="mb-3" label-width="70px" style="width: 100%">
      <el-row :gutter="10">
        <el-col :span="6">
          <el-form-item label="上传者">
            <el-input v-model="queryLocal.uploader" placeholder="输入上传者" />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="文件名">
            <el-input v-model="queryLocal.fileName" placeholder="输入文件名" />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <el-col :span="4">
          <el-form-item label="ID">
            <el-input v-model="queryLocal.id" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="10" style="margin-top: 10px">
        <!-- 标签选择 -->
        <el-col :span="10">
          <el-form-item label="标签">
            <el-select
              v-model="selectedTags"
              multiple
              filterable
              allow-create
              placeholder="选择或输入标签"
              style="width: 100%"
            >
              <el-option
                v-for="tag in allTags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.name"
              />
            </el-select>
          </el-form-item>
        </el-col>
        <!-- 匹配模式 -->
        <el-col :span="4">
          <el-checkbox
            v-model="tagMatchMode"
            true-label="all"
            false-label="any"
          >
            全部匹配
          </el-checkbox>
        </el-col>
        <!-- 操作按钮 -->
        <el-col :span="10" style="text-align: right">
          <el-button type="primary" @click="SetAllSelection">
            勾选全部 {{ totalCount }} 个
          </el-button>
          <el-button
            type="warning"
            @click="clearAllSelection"
            :disabled="selectedIds.length === 0"
          >
            取消勾选
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
            批量下载 ({{ selectedIds.length }})
          </el-button>
        </el-col>
      </el-row>
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
      <el-table-column prop="uploader" label="上传者" />
      <el-table-column prop="uploadTime" label="上传时间" />
      <el-table-column label="操作" width="200">
        <template #default="{ row }">
          <el-button type="primary" size="small" @click="downloadById(row.id)"
            >下载</el-button
          >
          <el-button
            type="primary"
            size="small"
            @click="handlePreview(row.id, row.originalFileName)"
            >预览</el-button
          >
          <el-button type="primary" size="small" @click="openEdit(row)"
            >编辑</el-button
          >
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑文件信息" width="500px">
      <el-form :model="editForm" label-width="80px">
        <!-- 文件名 -->
        <el-form-item label="文件名">
          <el-input v-model="editForm.fileName" />
        </el-form-item>

        <!-- 标签 -->
        <el-form-item label="标签">
          <el-select v-model="editForm.tags" multiple placeholder="选择标签">
            <el-option
              v-for="tag in allTags"
              :key="tag.id"
              :label="tag.name"
              :value="tag.name"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <!-- 弹窗底部 -->
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 分页 -->
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

    <!-- 文件预览 -->
    <el-dialog v-model="dialogVisible" width="80%" :before-close="closeDialog">
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

      <img
        v-if="
          ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType) &&
          fileUrl
        "
        :src="fileUrl"
        style="max-width: 100%; max-height: 80vh"
      />
      <video
        v-if="['mp4', 'webm', 'ogg'].includes(fileType) && fileUrl"
        :src="fileUrl"
        controls
        style="max-width: 100%; max-height: 80vh"
      ></video>
      <pre
        v-if="['txt', 'csv', 'log'].includes(fileType)"
        style="white-space: pre-wrap"
        >{{ textContent }}
</pre
      >
      <div v-if="fileType === 'md'" v-html="renderedMarkdown"></div>
      <pre v-if="fileType === 'json'">{{ formattedJson }}</pre>
      <div v-if="fileType === 'unknown'">不支持预览此类型文件</div>
    </el-dialog>

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
import { ref, reactive, watch, nextTick, onMounted } from "vue";
import http from "@/plugins/axios";
import { API_BASE } from "@/plugins/axios";
import * as filesApi from "@/api/files";
import { ElLoading, ElMessage } from "element-plus";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import VueOfficePptx from "@vue-office/pptx";
import VueOfficePdf from "@vue-office/pdf";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import { useUniversalPreview } from "@/composables/useUniversalPreview";
import qs from "qs";
import * as pdfjsLib from "pdfjs-dist";
import { editFile } from "../api/files";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.js",
  import.meta.url
).href;

// 预览相关
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
} = useUniversalPreview(API_BASE);

function handlePreview(id, filename) {
  previewFileById(id, filename);
}

// 标签相关
const selectedTags = ref([]);
const allTags = ref([]);
const tagMatchMode = ref("any");

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
const selectedRowsMap = reactive(new Map());
const selectedIds = ref([]);
const multipleTable = ref(null);
const isRestoringSelection = ref(false);
const isPageChanging = ref(false);
const editForm = ref({ id: null, fileName: "", tags: [] });

const fileList = ref([]);

const editDialogVisible = ref(false);
// 打开弹窗
function openEdit(row) {
  // 复制当前行的数据到编辑表单
  editForm.value = {
    id: row.id,
    fileName: row.originalFileName,
    tags: [...row.tags],
  };
  editDialogVisible.value = true;
}

async function saveEdit() {
  try {
    // 调用接口
    await editFile({
      id: editForm.value.id,
      fileName: editForm.value.fileName,
      tags: editForm.value.tags,
    });

    // 更新本地表格数据
    const idx = fileList.value.findIndex((f) => f.id === editForm.value.id);
    if (idx !== -1) {
      fileList.value[idx].originalFileName = editForm.value.fileName;
      fileList.value[idx].tags = [...editForm.value.tags];
    }

    ElMessage.success("修改成功");
    editDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(
      "修改失败：" + (err.response?.data?.message || err.message)
    );
  }
}

function onSelectionChange(selection) {
  selection.forEach((r) => selectedRowsMap.set(r.id, r));
  selectedIds.value = Array.from(selectedRowsMap.keys());
}

// 查询列表
async function fetchFileList() {
  queryLoading.value = true;
  try {
    const params = { pageNumber: currentPage.value, pageSize: pageSize.value };
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      params.start = new Date(timeRange.value[0]).toISOString();
      params.end = new Date(timeRange.value[1]).toISOString();
    }
    if (selectedTags.value.length > 0) {
      params.tags = [...selectedTags.value];
      params.matchAllTags = tagMatchMode.value === "all";
    }
    const res = await http.get(`${API_BASE}/filequery/query`, {
      params,
      headers: { Accept: "application/json" },
      paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
    });
    const data = res.data ?? {};
    files.value = data.items ?? [];
    totalCount.value = data.totalCount ?? files.value.length;

    await nextTick();
    multipleTable.value?.clearSelection?.();
    selectedIds.value.forEach((id) => {
      const row = files.value.find((f) => f.id === id);
      if (row) multipleTable.value?.toggleRowSelection?.(row, true);
    });
  } catch (err) {
    console.error(err);
    ElMessage.error("查询失败");
  } finally {
    queryLoading.value = false;
  }
}

// 全选
async function SetAllSelection() {
  try {
    const params = {};
    if (queryLocal.id) params.id = Number(queryLocal.id);
    if (queryLocal.uploader) params.uploader = queryLocal.uploader.trim();
    if (queryLocal.fileName) params.fileName = queryLocal.fileName.trim();
    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      params.start = new Date(timeRange.value[0]).toISOString();
      params.end = new Date(timeRange.value[1]).toISOString();
    }
    if (selectedTags.value.length > 0) {
      params.tags = selectedTags.value;
      params.matchAllTags = tagMatchMode.value === "all";
    }
    const res = await http.get(`${API_BASE}/filequery/query-ids`, {
      params,
      responseType: "json",
    });
    const allIds = res.data?.items ?? [];
    allIds.forEach((id) => selectedRowsMap.set(id, { id }));
    isRestoringSelection.value = true;
    multipleTable.value?.clearSelection?.();
    await nextTick();
    files.value.forEach((row) => {
      if (selectedRowsMap.has(row.id))
        multipleTable.value?.toggleRowSelection?.(row, true);
    });
    isRestoringSelection.value = false;
    selectedIds.value = Array.from(selectedRowsMap.keys());
    ElMessage.success(`已选中 ${allIds.length} 个文件`);
  } catch (err) {
    console.error(err);
    ElMessage.error("全选失败");
  }
}

// 清空选择
function clearAllSelection() {
  isRestoringSelection.value = true;
  multipleTable.value?.clearSelection?.();
  selectedRowsMap.clear();
  selectedIds.value = [];
  isRestoringSelection.value = false;
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
  if (!selectedIds.value.length) return ElMessage.warning("请先选择文件");
  const loading = ElLoading.service({ text: "正在下载..." });
  try {
    const res = await filesApi.batchDownload(selectedIds.value);
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
  fetchFileList();
}
function handleCurrentChange(val) {
  currentPage.value = val;
  fetchFileList();
}

defineExpose({
  fetchFileList,
});

// 初次加载
onMounted(async () => {
  fetchFileList();
  try {
    const res = await http.get("/tags"); // 使用http实例
    allTags.value = res.data ?? [];
  } catch (err) {
    console.error("加载标签失败", err);
  }
});
</script>

<style scoped>
.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
