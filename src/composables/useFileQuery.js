import { ref } from "vue";
import http, { API_BASE } from "@/plugins/axios";
import qs from "qs";
import { ElMessage } from "element-plus";

export function useFileQuery(
  queryLocal,
  timeRange,
  selectedTags,
  tagMatchMode
) {
  const files = ref([]);
  const totalCount = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const queryLoading = ref(false);

  async function fetchFileList() {
    queryLoading.value = true;
    try {
      const params = {
        pageNumber: currentPage.value,
        pageSize: pageSize.value,
        uploader: queryLocal.uploader?.trim(),
        fileName: queryLocal.fileName?.trim(),
      };
      if (queryLocal.id) params.id = Number(queryLocal.id);
      if (Array.isArray(timeRange.value) && timeRange.value.length === 2) {
        // 直接传 yyyy-MM-dd HH:mm:ss 格式的本地时间
        params.start = timeRange.value[0].toLocaleString("sv-SE");
        params.end = timeRange.value[1].toLocaleString("sv-SE");
      }

      if (selectedTags.value.length > 0) {
        params.tags = [...selectedTags.value];
        params.matchAllTags = tagMatchMode.value === "all";
      }

      const res = await http.get(`${API_BASE}/filequery/query`, {
        params,
        paramsSerializer: (p) => qs.stringify(p, { arrayFormat: "repeat" }),
      });
      files.value = res.data.items ?? [];
      totalCount.value = res.data.totalCount ?? 0;
    } catch (e) {
      ElMessage.error("查询失败");
    } finally {
      queryLoading.value = false;
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

  return {
    files,
    totalCount,
    currentPage,
    pageSize,
    queryLoading,
    fetchFileList,
    handleSizeChange,
    handleCurrentChange,
  };
}
