import { ref, reactive, nextTick } from "vue";
import { ElMessage } from "element-plus";
import http, { API_BASE } from "@/plugins/axios";

export function useFileSelection(
  files,
  queryLocal,
  timeRange,
  selectedTags,
  tagMatchMode,
  multipleTable
) {
  const selectedRowsMap = reactive(new Map());
  const selectedIds = ref([]);
  const isRestoringSelection = ref(false);

  function onSelectionChange(selection) {
    selection.forEach((r) => selectedRowsMap.set(r.id, r));
    selectedIds.value = Array.from(selectedRowsMap.keys());
  }

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
      const res = await http.get(`${API_BASE}/filequery/query-ids`, { params });
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

  function clearAllSelection() {
    isRestoringSelection.value = true;
    multipleTable.value?.clearSelection?.();
    selectedRowsMap.clear();
    selectedIds.value = [];
    isRestoringSelection.value = false;
  }

  return {
    selectedIds,
    onSelectionChange,
    SetAllSelection,
    clearAllSelection,
  };
}
