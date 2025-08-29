// useUniversalPreview.js
import { ref } from "vue";
import http from "@/plugins/axios";
import { API_BASE } from "@/plugins/axios";
import { marked } from "marked"; // markdown 解析

export function useUniversalPreview() {
  // 移除硬编码baseUrl，使用API_BASE
  const dialogVisible = ref(false);
  const fileUrl = ref(null);
  const fileType = ref(null);
  const textContent = ref("");
  const renderedMarkdown = ref("");
  const formattedJson = ref("");

  function onRendered() {
    console.log("文件渲染完成");
  }

  function onError(e) {
    console.error("文件渲染失败", e);
  }

  function closeDialog() {
    if (fileUrl.value) URL.revokeObjectURL(fileUrl.value);
    dialogVisible.value = false;
    fileUrl.value = null;
    fileType.value = null;
    textContent.value = "";
    renderedMarkdown.value = "";
    formattedJson.value = "";
  }

  async function previewFileById(id, filename) {
    const ext = filename.split(".").pop().toLowerCase();
    fileType.value = ext;

    try {
      const isText = ["txt", "csv", "log", "md", "json"].includes(ext);
      const res = await http.get("/file/preview-by-id", {
        // 使用相对路径
        params: { id },
        responseType: isText ? "text" : "blob",
      });

      if (["txt", "csv", "log"].includes(ext)) {
        textContent.value = res.data;
      } else if (ext === "md") {
        renderedMarkdown.value = marked(res.data);
      } else if (ext === "json") {
        formattedJson.value = JSON.stringify(JSON.parse(res.data), null, 2);
      } else {
        fileUrl.value = URL.createObjectURL(res.data);
      }

      dialogVisible.value = true;
    } catch (err) {
      console.error("加载文件失败", err);
      closeDialog();
    }
  }

  return {
    dialogVisible,
    fileUrl,
    fileType,
    textContent,
    renderedMarkdown,
    formattedJson,
    previewFileById,
    onRendered,
    onError,
    closeDialog,
  };
}
