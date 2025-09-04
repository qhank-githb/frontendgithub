import { ref } from "vue";
import http from "@/plugins/axios";

export function useTags() {
  const allTags = ref([]);
  async function fetchTags() {
    try {
      const res = await http.get("/tags");
      allTags.value = res.data ?? [];
    } catch (err) {
      console.error("加载标签失败", err);
    }
  }
  return { allTags, fetchTags };
}
