// useUniversalPreview.js
import { ref } from "vue";
import http from "@/plugins/axios";
import { API_BASE } from "@/plugins/axios";
import { marked } from "marked"; // markdown 解析

export function useUniversalPreview() {
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
    if (fileUrl.value && typeof fileUrl.value === "string") {
      // 只有 objectUrl 才需要 revoke
      URL.revokeObjectURL(fileUrl.value);
    }
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

      if (ext === "pptx") {
        // ⚡ 针对 PPTX 用 ArrayBuffer
        const res = await http.get("/file/preview-by-id", {
          params: { id },
          responseType: "arraybuffer",
        });
        console.log("pptx 文件大小:", res.data.byteLength); // ✅ 应该有字节数
        fileUrl.value = res.data; // 直接传 ArrayBuffer 给 <vue-office-pptx>
        console.log("预览 fileUrl 类型:", typeof res.data, res.data);
      } else {
        const res = await http.get("/file/preview-by-id", {
          params: { id },
          responseType: isText ? "text" : "blob",
        });
        console.log("预览 fileUrl 类型:", typeof res.data, res.data);

        if (["txt", "csv", "log"].includes(ext)) {
          textContent.value = res.data;
        } else if (ext === "md") {
          renderedMarkdown.value = marked(res.data);
        } else if (ext === "json") {
          formattedJson.value = JSON.stringify(JSON.parse(res.data), null, 2);
        } else {
          fileUrl.value = URL.createObjectURL(res.data);
        }
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
