import { ref } from "vue";
import http from "@/plugins/axios";

export function useTagQuery(apiBase = "/file") {
  const selectedTags = ref([]);
  const matchAll = ref(false);
  const files = ref([]);
  const totalCount = ref(0);

  async function queryFiles(extraParams = {}) {
    const params = {
      tags: selectedTags.value,
      matchAllTags: matchAll.value,
      pageNumber: 1,
      pageSize: 20,
      ...extraParams,
    };
    try {
      const res = await http.get(`${apiBase}/query`, { params }); // 使用相对路径
      files.value = res.data.items;
      totalCount.value = res.data.totalCount;
    } catch (err) {
      console.error("查询失败", err);
    }
  }

  return {
    selectedTags,
    matchAll,
    files,
    totalCount,
    queryFiles,
  };
}
