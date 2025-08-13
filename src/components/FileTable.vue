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
        <el-button
          type="info"
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
          >批量下载选中文件 已选中{{ selectedIds.length }}个</el-button
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
import axios from "axios"; // 确保引入
import * as filesApi from "@/api/files";
import { ElMessage } from "element-plus";

const apiBase = "http://192.168.150.93:5000/api"; // 请根据实际改

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

const selectedRowsMap = reactive(new Map());
const selectedIds = ref([]);
const multipleTable = ref(null);

async function fetchFileList() {
  queryLoading.value = true;
  try {
    let start = null;
    let end = null;
    if (Array.isArray(timeRange.value) && timeRange.value.length >= 2) {
      const s = timeRange.value[0];
      const e = timeRange.value[1];
      if (s)
        start =
          typeof s.toISOString === "function" ? s.toISOString() : String(s);
      if (e)
        end = typeof e.toISOString === "function" ? e.toISOString() : String(e);
    }

    const params = {
      uploader: queryLocal.uploader ?? "",
      fileName: queryLocal.fileName ?? "",
      bucket: queryLocal.bucket ?? "",
      pageNumber: currentPage.value ?? 1,
      pageSize: pageSize.value ?? 10,
      start,
      end,
      id: queryLocal.id ?? "",
    };

    console.debug("[fetchFileList] send params:", params);

    const res = await axios.get(`${apiBase}/filequery/query`, { params });

    console.debug("[fetchFileList] response:", res);

    const data = res.data ?? {};
    files.value = data.Items ?? data.items ?? data.data ?? [];
    totalCount.value =
      data.TotalCount ?? data.totalCount ?? data.total ?? files.value.length;

    await nextTick();

    if (
      multipleTable.value &&
      typeof multipleTable.value.clearSelection === "function"
    ) {
      multipleTable.value.clearSelection();
    }

    files.value.forEach((row) => {
      if (!row || row.id === undefined || row.id === null) return;
      if (selectedRowsMap.has(row.id)) {
        if (
          multipleTable.value &&
          typeof multipleTable.value.toggleRowSelection === "function"
        ) {
          multipleTable.value.toggleRowSelection(row, true);
        }
      }
    });
  } catch (error) {
    console.error("[fetchFileList] error:", error);
    ElMessage.error("查询文件列表失败（查看控制台详细错误）");
  } finally {
    queryLoading.value = false;
  }
}

function onSelectionChange(rows) {
  const currentIds = rows.map((r) => r.id);
  rows.forEach((r) => r?.id && selectedRowsMap.set(r.id, r));
  files.value.forEach((row) => {
    if (row?.id && !currentIds.includes(row.id)) selectedRowsMap.delete(row.id);
  });
  selectedIds.value = Array.from(selectedRowsMap.keys());
}

// 取消所有选中状态
function clearAllSelection() {
  if (
    multipleTable.value &&
    typeof multipleTable.value.clearSelection === "function"
  ) {
    multipleTable.value.clearSelection();
    selectedRowsMap.clear();
    selectedIds.value = [];
  }
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
  } catch {
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
    const res = await filesApi.batchDownload(selectedIds.value);
    const blob = new Blob([res.data], { type: "application/zip" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `batch_${Date.now()}.zip`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    ElMessage.error("批量下载失败");
  } finally {
    loading.close();
  }
}

function handleSizeChange(val) {
  pageSize.value = val;
  currentPage.value = 1;
  fetchFileList();
}
function handleCurrentChange(val) {
  currentPage.value = val;
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
