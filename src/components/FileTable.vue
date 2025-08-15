<template>
  <div>
    <el-form
      :inline="true"
      class="mb-3"
      style="width: 100%; display: flex; flex-wrap: wrap; align-items: center"
    >
      <el-form-item label="上传者"
        ><el-input v-model="queryLocal.uploader" style="width: 200px"
      /></el-form-item>
      <el-form-item label="文件名"
        ><el-input v-model="queryLocal.fileName" style="width: 200px"
      /></el-form-item>
      <el-form-item label="所在桶"
        ><el-input v-model="queryLocal.bucket" style="width: 200px"
      /></el-form-item>
      <el-form-item label="时间范围"
        ><el-date-picker
          v-model="timeRange"
          type="datetimerange"
          style="width: 350px"
      /></el-form-item>
      <el-form-item label="ID"
        ><el-input v-model="queryLocal.id" style="width: 75px"
      /></el-form-item>

      <el-form-item style="margin-left: auto; display: flex; gap: 10px">
        <el-button type="primary" @click="SetAllSelection"
          >勾选全部符合条件的 {{ totalCount }} 个对象</el-button
        >
        <el-button
          type="warning"
          @click="clearAllSelection"
          :disabled="selectedIds.length === 0"
          >取消所有勾选</el-button
        >
        <el-button @click="fetchFileList" type="primary" :loading="queryLoading"
          >查询</el-button
        >

        <el-button
          type="success"
          :disabled="selectedIds.length === 0"
          @click="batchDownload"
          >批量下载选中文件 已选中 {{ selectedIds.length }} 个</el-button
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

    <el-backtop
      style="
        background-color: #409eff; /* 蓝色背景 */
        color: white; /* 让内部箭头继承白色 */
        box-shadow: var(--el-box-shadow-lighter);
        width: 50px;
        height: 50px;
        font-size: 32px;
      "
    />
  </div>
</template>

<script setup>
import { ref, reactive, nextTick, watch } from "vue";
import axios from "axios";
import * as filesApi from "@/api/files";
import { ElLoading, ElMessage } from "element-plus";

const apiBase = "http://192.168.150.93:5000/api"; // 根据实际调整

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

const files = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const queryLoading = ref(false);
const timeRange = ref(null);

watch(timeRange, (val) => {
  if (val !== null && !Array.isArray(val)) {
    timeRange.value = null;
  }
});

// normalize id key consistently to string
const idKey = (id) => (id === null || id === undefined ? "" : String(id));

// store selected rows (keys are string ids)
const selectedRowsMap = reactive(new Map()); // Map<String(id), row or placeholder>
const selectedIds = ref([]); // array of string keys

const multipleTable = ref(null);

// flags to avoid misinterpreting programmatic/page-change selection events
const isRestoringSelection = ref(false);
const isPageChanging = ref(false);

async function fetchFileList() {
  queryLoading.value = true;

  try {
    // Construct safe params
    const params = {};
    if (queryLocal.uploader?.toString().trim())
      params.uploader = queryLocal.uploader.toString().trim();
    if (queryLocal.fileName?.toString().trim())
      params.fileName = queryLocal.fileName.toString().trim();
    if (queryLocal.bucket?.toString().trim())
      params.bucket = queryLocal.bucket.toString().trim();
    if (queryLocal.id && !isNaN(Number(queryLocal.id)))
      params.id = Number(queryLocal.id);

    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      const [s, e] = timeRange.value;
      if (s instanceof Date) params.start = s.toISOString();
      else if (s) params.start = new Date(s).toISOString();
      if (e instanceof Date) params.end = e.toISOString();
      else if (e) params.end = new Date(e).toISOString();
    }

    // paging
    params.pageNumber = currentPage.value ?? 1;
    params.pageSize = pageSize.value ?? 10;

    console.debug("[fetchFileList] send params:", params);

    // mark restoring/page changing to avoid onSelectionChange deletion
    isRestoringSelection.value = true;

    const res = await axios.get(`${apiBase}/filequery/query`, { params });

    console.debug("[fetchFileList] response:", res);

    const data = res.data ?? {};
    files.value = data.Items ?? data.items ?? data.data ?? [];
    totalCount.value =
      data.TotalCount ?? data.totalCount ?? data.total ?? files.value.length;

    await nextTick();

    // clear UI selection then restore for rows on this page
    if (
      multipleTable.value &&
      typeof multipleTable.value.clearSelection === "function"
    ) {
      multipleTable.value.clearSelection();
    }

    files.value.forEach((row) => {
      if (!row || row.id === undefined || row.id === null) return;
      if (selectedRowsMap.has(idKey(row.id))) {
        if (
          multipleTable.value &&
          typeof multipleTable.value.toggleRowSelection === "function"
        ) {
          multipleTable.value.toggleRowSelection(row, true);
        }
      }
    });

    // done restoring; if we were paginating, clear that flag too
    isRestoringSelection.value = false;
    isPageChanging.value = false;

    // sync selectedIds to reflect current Map (string keys)
    selectedIds.value = Array.from(selectedRowsMap.keys());
  } catch (error) {
    console.error("[fetchFileList] error:", error);
    // ensure flags reset on error
    isRestoringSelection.value = false;
    isPageChanging.value = false;
    ElMessage.error("查询文件列表失败（查看控制台详细错误）");
  } finally {
    queryLoading.value = false;
  }
}

function onSelectionChange(rows) {
  // rows: currently selected rows on this visible page
  const currentIds = rows.map((r) => idKey(r.id));

  // write current page selected rows into the Map (overwrite placeholders)
  rows.forEach((r) => {
    if (r?.id !== undefined && r?.id !== null) {
      selectedRowsMap.set(idKey(r.id), r);
    }
  });

  // if we are restoring programmatically or page is changing, skip deletion step
  if (isRestoringSelection.value || isPageChanging.value) {
    selectedIds.value = Array.from(selectedRowsMap.keys());
    return;
  }

  // normal user interaction: delete rows present on this page but not selected
  files.value.forEach((row) => {
    if (row?.id !== undefined && row?.id !== null) {
      const key = idKey(row.id);
      if (key && !currentIds.includes(key)) {
        selectedRowsMap.delete(key);
      }
    }
  });

  selectedIds.value = Array.from(selectedRowsMap.keys());
}

////////////////////////////////////////////////

// select every matching file across all pages (by ids)
async function SetAllSelection() {
  try {
    // safe params construction
    const params = {};
    if (queryLocal.uploader?.toString().trim())
      params.uploader = queryLocal.uploader.toString().trim();
    if (queryLocal.fileName?.toString().trim())
      params.fileName = queryLocal.fileName.toString().trim();
    if (queryLocal.bucket?.toString().trim())
      params.bucket = queryLocal.bucket.toString().trim();
    if (queryLocal.id && !isNaN(Number(queryLocal.id)))
      params.id = Number(queryLocal.id);

    if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
      const [s, e] = timeRange.value;
      if (s instanceof Date) params.start = s.toISOString();
      else if (s) params.start = new Date(s).toISOString();
      if (e instanceof Date) params.end = e.toISOString();
      else if (e) params.end = new Date(e).toISOString();
    }

    console.debug("[SetAllSelection] params:", params);

    // fetch all matching ids (no paging)
    const res =
      Object.keys(params).length === 0
        ? await axios.get(`${apiBase}/filequery/query-ids`)
        : await axios.get(`${apiBase}/filequery/query-ids`, { params });

    console.debug("[SetAllSelection] response:", res);
    const allIds = res.data?.items ?? [];

    // store all ids as string keys in map (placeholder objects)
    allIds.forEach((id) => {
      selectedRowsMap.set(idKey(id), { id }); // placeholder; will be replaced by real row when loaded
    });

    // avoid onSelectionChange deletion while we restore UI
    isRestoringSelection.value = true;

    // clear UI selection first
    if (
      multipleTable.value &&
      typeof multipleTable.value.clearSelection === "function"
    ) {
      multipleTable.value.clearSelection();
    }

    await nextTick();

    // restore UI checkboxes for current page rows
    if (
      multipleTable.value &&
      typeof multipleTable.value.toggleRowSelection === "function"
    ) {
      files.value.forEach((row) => {
        if (row?.id !== undefined && selectedRowsMap.has(idKey(row.id))) {
          multipleTable.value.toggleRowSelection(row, true);
        }
      });
    }

    isRestoringSelection.value = false;
    selectedIds.value = Array.from(selectedRowsMap.keys());

    ElMessage.success(`已选中所有页面，共 ${allIds.length} 个文件`);
  } catch (error) {
    console.error("[SetAllSelection] 全选失败", error);
    isRestoringSelection.value = false;
    ElMessage.error("全选所有页面失败（查看控制台详情）");
  }
}

/////////////////////////////////////////////////

function clearAllSelection() {
  // avoid race with selection-change handlers
  isRestoringSelection.value = true;
  isPageChanging.value = true;

  if (
    multipleTable.value &&
    typeof multipleTable.value.clearSelection === "function"
  ) {
    multipleTable.value.clearSelection();
  }

  selectedRowsMap.clear();
  selectedIds.value = [];

  isRestoringSelection.value = false;
  isPageChanging.value = false;
}

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
    console.error("[downloadById] error:", err);
    ElMessage.error("下载失败");
  } finally {
    loading.close();
  }
}

async function batchDownload() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning("请先选择要下载的文件");
    return;
  }
  const loading = ElLoading.service({ text: "正在下载..." });
  try {
    // convert string keys back to numbers if backend expects numbers
    const idsToSend = selectedIds.value
      .map((v) => Number(v))
      .filter((n) => !isNaN(n));
    if (idsToSend.length === 0) {
      ElMessage.error("没有有效的 ID 发送到后端");
      return;
    }

    const res = await filesApi.batchDownload(idsToSend);
    const blob = new Blob([res.data], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error("[batchDownload] error:", err);
    ElMessage.error("批量下载失败");
  } finally {
    loading.close();
  }
}

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

defineExpose({ fetchFileList });

nextTick(() => {
  fetchFileList();
});
</script>

<style scoped>
.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
