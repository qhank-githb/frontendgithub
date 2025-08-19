// useUniversalPreview.js
import { ref } from "vue";
import axios from "axios";
import { marked } from "marked"; // markdown 解析

// vue-office 组件

export function useUniversalPreview(baseUrl = "http://192.168.150.93:5000") {
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
      const res = await axios.get(
        `${baseUrl}/api/file/preview-by-id?id=${id}`,
        {
          responseType: isText ? "text" : "blob",
        }
      );

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
