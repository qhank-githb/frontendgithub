<template>
  <div>
    <!-- 查询表单 -->
    <el-form :inline="true" class="mb-3" label-width="70px" style="width: 100%">
      <div class="query-bar">
        <div class="query-left">
          <QueryArea
            :queryLocal="queryLocal"
            :allTags="allTags"
            :queryLoading="queryLoading"
            v-model:selectedTags="selectedTags"
            v-model:timeRange="timeRange"
            @fetch="fetchFileList"
          />
        </div>

        <div class="query-right">
          <FileActionButtons
            :totalCount="totalCount"
            :selectedIds="selectedIds"
            :queryLoading="queryLoading"
            v-model:tagMatchMode="tagMatchMode"
            @fetch="fetchFileList"
            @select-all="SetAllSelection"
            @clear-selection="clearAllSelection"
            @batch-download="batchDownload"
          />
        </div>
      </div>
    </el-form>

    <!-- 文件表格 -->
    <!-- 重要：把表格组件实例 ref 传给 multipleTable，以便 useFileSelection 使用 -->
    <QueryTable
      ref="multipleTable"
      :files="files"
      @selection-change="onSelectionChange"
      @download="downloadById"
      @preview="handlePreview"
      @edit="openEdit"
    />

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
    <!-- 正确代码 -->
    <FilePreview
      v-model="dialogVisible"
      :fileUrl="fileUrl"
      :fileType="fileType"
      :progress="{
        downloadPercent: downloadPercent,
        showProgress: showProgress,
      }"
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
import FileActionButtons from "@/components/FileActionButtons.vue";
import QueryTable from "@/components/QueryTable.vue";

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
  downloadPercent, // 新增
  showProgress, // 新增
  previewFileById,
  onRendered,
  onError,
} = useUniversalPreview(API_BASE);

function handlePreview(id, filename) {
  console.log("触发文件预览", {
    id,
    filename,
    currentFile: files.value.find((f) => f.id === id),
  });
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
// multipleTable 是 QueryTable 组件的实例 ref（QueryTable 已有 defineExpose）
// 传给 useFileSelection 以便它在需要时调用 multipleTable.value.clearSelection / toggleRowSelection 等
const multipleTable = ref(null);

const {
  selectedIds,
  onSelectionChange,
  SetAllSelection,
  clearAllSelection,
  // restoreSelection, getSelectedIds, etc. are available if needed
} = useFileSelection(
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
/* 如果 QueryArea 已经内部使用 el-row/el-col，不需要再强制一行显示 */
/* 这里只是确保右侧按钮不换行 */

.demo-pagination-block {
  display: flex;
  justify-content: center;
  padding: 12px 0;
}
</style>
