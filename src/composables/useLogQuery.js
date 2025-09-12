// src/composables/useLogQuery.js
import { ref } from "vue";

/**
 * useLogQuery - 负责记住查询条件 / 分页 / 请求后端并返回 DTO 格式的日志数据
 * 返回：
 *  logs, currentPage, pageSize, totalCount, loading,
 *  level, messageKeyword, propertyFilters,
 *  fetchLogs, resetPageAndFetch, setPage
 */
export function useLogQuery() {
  const logs = ref([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const loading = ref(false);

  // 查询条件（绑定在 UI）
  const level = ref("");
  const messageKeyword = ref("");
  // propertyFilters 是一个对象：{ key: value, ... }
  const propertyFilters = ref({});

  async function fetchLogs() {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (level.value) params.append("Levels", level.value);
      if (messageKeyword.value)
        params.append("MessageKeyword", messageKeyword.value);

      // 动态属性过滤：PropertyFilters[Key]=Value
      for (const key in propertyFilters.value) {
        const v = propertyFilters.value[key];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          params.append(`PropertyFilters[${key}]`, String(v));
        }
      }

      params.append("PageIndex", currentPage.value);
      params.append("PageSize", pageSize.value);

      const url = `/api/LogQuery/query?${params.toString()}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        // 尽量把后端错误文本打印出来，便于调试
        const text = await res.text();
        console.error("[useLogQuery] 请求错误：", res.status, text);
        logs.value = [];
        totalCount.value = 0;
        return;
      }

      const data = await res.json();
      // 期望后端返回 LogQueryResponse: { totalCount, totalPages, currentPage, logs: LogItemDto[] }
      logs.value = data.logs ?? [];
      totalCount.value = data.totalCount ?? 0;
      // 如果有 totalPages，也可以用于 UI，但我们以 totalCount/pageSize 计算为主
    } catch (err) {
      console.error("日志查询失败:", err);
      logs.value = [];
      totalCount.value = 0;
    } finally {
      loading.value = false;
    }
  }

  function resetPageAndFetch() {
    currentPage.value = 1;
    fetchLogs();
  }

  function setPage(page) {
    currentPage.value = page;
  }

  return {
    logs,
    currentPage,
    pageSize,
    totalCount,
    loading,
    level,
    messageKeyword,
    propertyFilters,
    fetchLogs,
    resetPageAndFetch,
    setPage,
  };
}
