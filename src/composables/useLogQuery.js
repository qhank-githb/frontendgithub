// src/composables/useLogQuery.js
import { ref } from "vue";
import { useJwt } from "./useJwt";
import { ElMessage } from "element-plus";

export function useLogQuery() {
  const logs = ref([]);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalCount = ref(0);
  const loading = ref(false);

  // 查询条件
  const level = ref("");
  const messageKeyword = ref("");
  const propertyFilters = ref({});

  // 引入 JWT 解析结果（全局共享）
  const { currentRole } = useJwt();

  async function fetchLogs() {
    // 检查权限：普通 User 不允许查询
    if (currentRole.value === "User") {
      ElMessage.warning("普通用户不可查询日志");
      logs.value = [];
      totalCount.value = 0;
      return;
    }

    loading.value = true;
    try {
      const params = new URLSearchParams();
      if (level.value) params.append("Levels", level.value);
      if (messageKeyword.value)
        params.append("MessageKeyword", messageKeyword.value);

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
          Authorization: `Bearer ${localStorage.getItem("jwt_token") ?? ""}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("[useLogQuery] 请求错误：", res.status, text);
        logs.value = [];
        totalCount.value = 0;
        return;
      }

      const data = await res.json();
      logs.value = data.logs ?? [];
      totalCount.value = data.totalCount ?? 0;
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
