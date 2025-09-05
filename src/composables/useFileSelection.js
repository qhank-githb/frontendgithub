// src/composables/useFileSelection.js
import { ref, reactive, nextTick, watch } from "vue";
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
  const isPageChanging = ref(false);

  function buildQueryIdsParams() {
    const params = {};
    try {
      if (
        queryLocal?.id !== undefined &&
        queryLocal?.id !== null &&
        queryLocal?.id !== ""
      ) {
        const n = Number(queryLocal.id);
        if (!Number.isNaN(n)) params.id = n;
      }
      if (queryLocal?.uploader) params.uploader = queryLocal.uploader.trim();
      if (queryLocal?.fileName) params.fileName = queryLocal.fileName.trim();
      if (queryLocal?.bucket) params.bucket = queryLocal.bucket.trim();
      if (Array.isArray(timeRange?.value) && timeRange.value.length === 2) {
        const [s, e] = timeRange.value;
        params.start = new Date(s).toISOString();
        params.end = new Date(e).toISOString();
      }
      if (
        selectedTags?.value &&
        Array.isArray(selectedTags.value) &&
        selectedTags.value.length
      ) {
        params.tags = selectedTags.value;
        params.matchAllTags = tagMatchMode?.value === "all";
      }
    } catch (err) {
      console.warn("buildQueryIdsParams error", err);
    }
    return params;
  }

  function onSelectionChange(rows) {
    const currentIds = rows.map((r) => String(r.id));
    rows.forEach((r) => selectedRowsMap.set(String(r.id), r));
    if (isRestoringSelection.value || isPageChanging.value) {
      selectedIds.value = Array.from(selectedRowsMap.keys());
      return;
    }
    const pageIds = (files?.value ?? []).map((r) => String(r.id));
    pageIds.forEach((pid) => {
      if (!currentIds.includes(pid)) selectedRowsMap.delete(pid);
    });
    selectedIds.value = Array.from(selectedRowsMap.keys());
  }

  async function SetAllSelection() {
    try {
      const params = buildQueryIdsParams();
      const res =
        Object.keys(params).length === 0
          ? await http.get(`${API_BASE}/filequery/query-ids`)
          : await http.get(`${API_BASE}/filequery/query-ids`, { params });

      const allIds = res?.data?.items ?? res?.data ?? [];
      if (!Array.isArray(allIds)) {
        ElMessage.error("全选失败：服务器返回格式异常");
        return 0;
      }

      allIds.forEach((id) => selectedRowsMap.set(String(id), { id }));

      // 优先调用子组件暴露的 restoreSelection 方法（如果有）
      const ids = Array.from(selectedRowsMap.keys());
      if (multipleTable?.value?.restoreSelection) {
        // restoreSelection 应接收 selectedIds 数组并在子组件内部操作 el-table
        try {
          isRestoringSelection.value = true;
          await multipleTable.value.restoreSelection(ids);
        } catch (err) {
          console.warn(
            "restoreSelection on child failed, fallback to toggleRowSelection",
            err
          );
          // fallback 下方处理
        } finally {
          isRestoringSelection.value = false;
        }
      } else {
        // fallback：尝试直接调用 el-table 实例的 api（当 multipleTable 是 el-table 或暴露了这些方法）
        isRestoringSelection.value = true;
        multipleTable.value?.clearSelection?.();
        await nextTick();
        (files?.value ?? []).forEach((row) => {
          if (selectedRowsMap.has(String(row.id))) {
            multipleTable.value?.toggleRowSelection?.(row, true);
          }
        });
        isRestoringSelection.value = false;
      }

      selectedIds.value = ids;
      ElMessage.success(`已选中 ${allIds.length} 个文件`);
      return allIds.length;
    } catch (err) {
      console.error("SetAllSelection error:", err);
      isRestoringSelection.value = false;
      ElMessage.error("全选失败");
      throw err;
    }
  }

  function clearAllSelection() {
    isRestoringSelection.value = true;
    isPageChanging.value = true;
    // 尝试调用子组件暴露的方法
    if (multipleTable?.value?.clearSelection) {
      try {
        multipleTable.value.clearSelection();
      } catch (e) {
        console.warn("child clearSelection failed", e);
      }
    } else {
      multipleTable.value?.clearSelection?.();
    }
    selectedRowsMap.clear();
    selectedIds.value = [];
    isRestoringSelection.value = false;
    isPageChanging.value = false;
  }

  async function restoreSelection() {
    if (!multipleTable?.value) return;
    const ids = Array.from(selectedRowsMap.keys());
    if (multipleTable.value?.restoreSelection) {
      try {
        isRestoringSelection.value = true;
        await multipleTable.value.restoreSelection(ids);
        selectedIds.value = ids;
      } catch (e) {
        console.warn("restoreSelection on child failed, fallback", e);
      } finally {
        isRestoringSelection.value = false;
      }
      return;
    }

    // fallback direct el-table ops
    try {
      isRestoringSelection.value = true;
      multipleTable.value?.clearSelection?.();
      await nextTick();
      (files?.value ?? []).forEach((row) => {
        if (selectedRowsMap.has(String(row.id))) {
          multipleTable.value?.toggleRowSelection?.(row, true);
        }
      });
      selectedIds.value = Array.from(selectedRowsMap.keys());
    } catch (err) {
      console.error("restoreSelection fallback error:", err);
    } finally {
      isRestoringSelection.value = false;
    }
  }

  function getSelectedIds(asNumber = false) {
    return asNumber
      ? selectedIds.value.map((s) => Number(s))
      : [...selectedIds.value];
  }

  // watch files to auto restore selection on page change / data refresh
  const stopFilesWatch = watch(
    files,
    async () => {
      await nextTick();
      await restoreSelection();
    },
    { deep: true }
  );

  return {
    multipleTable,
    selectedRowsMap,
    selectedIds,
    isRestoringSelection,
    isPageChanging,
    onSelectionChange,
    SetAllSelection,
    clearAllSelection,
    restoreSelection,
    getSelectedIds,
    _stopFilesWatch: stopFilesWatch,
  };
}
