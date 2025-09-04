<template>
  <div>
    <!-- 查询表单 -->
    <el-form :inline="true" class="mb-3" label-width="70px" style="width: 100%">
      <QueryArea
        :queryLocal="queryLocal"
        :allTags="allTags"
        :queryLoading="queryLoading"
        v-model:selectedTags="selectedTags"
        v-model:tagMatchMode="tagMatchMode"
        v-model:timeRange="timeRange"
        @fetch="fetchFileList"
      />

      <el-row :gutter="10" style="margin-top: 10px">
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

    <!-- 编辑弹窗 -->
    <FileEditDialog
      v-model="editDialogVisible"
      :form="editForm"
      :allTags="allTags"
      @save="saveEdit"
    />

    <!-- 文件预览 -->
    <FilePreview
      v-model="dialogVisible"
      :fileUrl="fileUrl"
      :fileType="fileType"
      :textContent="textContent"
      :renderedMarkdown="renderedMarkdown"
      :formattedJson="formattedJson"
      :onRendered="onRendered"
      :onError="onError"
    />

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
import { ref, reactive, watch, onMounted } from "vue";
import QueryArea from "./QueryArea.vue";
import FilePreview from "./FilePreviewDialog.vue";
import FileEditDialog from "./FileEditDialog.vue";

// composables
import { useFileQuery } from "@/composables/useFileQuery";
import { useFileSelection } from "@/composables/useFileSelection";
import { useFileDownload } from "@/composables/useFileDownload";
import { useFileEdit } from "@/composables/useFileEdit";
import { useTags } from "@/composables/useTags";
import { useUniversalPreview } from "@/composables/useUniversalPreview";
import { API_BASE } from "@/plugins/axios";

// === props & emit ===
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

// === 预览逻辑 ===
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
} = useUniversalPreview(API_BASE);
function handlePreview(id, filename) {
  previewFileById(id, filename);
}

// === 标签 ===
const selectedTags = ref([]);
const tagMatchMode = ref("any");
const timeRange = ref(null);
const { allTags, fetchTags } = useTags();

// === 查询 & 分页 ===
const {
  files,
  totalCount,
  currentPage,
  pageSize,
  queryLoading,
  fetchFileList,
  handleSizeChange,
  handleCurrentChange,
} = useFileQuery(queryLocal, timeRange, selectedTags, tagMatchMode);

// === 选择 ===
const multipleTable = ref(null);
const { selectedIds, onSelectionChange, SetAllSelection, clearAllSelection } =
  useFileSelection(
    files,
    queryLocal,
    timeRange,
    selectedTags,
    tagMatchMode,
    multipleTable
  );

// === 下载 ===
const { downloadById, batchDownload } = useFileDownload(selectedIds);

// === 编辑 ===
const { editDialogVisible, editForm, openEdit, saveEdit } = useFileEdit(files);

// === 初始加载 ===
onMounted(async () => {
  await fetchFileList();
  await fetchTags();
});

defineExpose({ fetchFileList });
</script>

<style scoped>
.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
