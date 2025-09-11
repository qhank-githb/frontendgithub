// src/composables/useUniversalPreview.js
import { ref } from "vue";
import http from "@/plugins/axios";
import { marked } from "marked";

/**
 * useUniversalPreview
 * - 支持下载进度（downloadPercent / showProgress）
 * - 支持文本/md/json、图片、视频、pdf、office(pptx/docx/xlsx)
 * - office 使用 ArrayBuffer（保留原来组件用法）
 */
export function useUniversalPreview() {
  const dialogVisible = ref(false);
  const fileUrl = ref(null); // string (objectURL) | ArrayBuffer | null
  const fileType = ref(null);
  const textContent = ref("");
  const renderedMarkdown = ref("");
  const formattedJson = ref("");
  const downloadPercent = ref(0);
  const showProgress = ref(false);

  function onRendered() {
    console.log("文件渲染完成");
  }

  function onError(e) {
    console.error("文件渲染失败", e);
  }

  function closeDialog() {
    // 释放可能的 objectUrl
    if (fileUrl.value && typeof fileUrl.value === "string") {
      try {
        URL.revokeObjectURL(fileUrl.value);
      } catch (e) {
        /* ignore */
      }
    }
    dialogVisible.value = false;
    fileUrl.value = null;
    fileType.value = null;
    textContent.value = "";
    renderedMarkdown.value = "";
    formattedJson.value = "";
    downloadPercent.value = 0;
    showProgress.value = false;
  }

  async function previewFileById(id, filename) {
    const ext = (filename || "").split(".").pop().toLowerCase();
    fileType.value = ext;

    const supportedTypes = [
      "txt",
      "csv",
      "log",
      "md",
      "json",
      "pptx",
      "docx",
      "xlsx",
      "pdf",
      "jpg",
      "jpeg",
      "png",
      "gif",
      "bmp",
      "webp",
      "mp4",
      "webm",
      "ogg",
    ];

    if (!supportedTypes.includes(ext)) {
      fileType.value = "unknown";
      dialogVisible.value = true;
      return;
    }

    // reset state
    downloadPercent.value = 0;
    showProgress.value = true;
    fileUrl.value = null;
    textContent.value = "";
    renderedMarkdown.value = "";
    formattedJson.value = "";

    try {
      const isText = ["txt", "csv", "log", "md", "json"].includes(ext);
      const isArrayBuffer = ["pptx", "docx", "xlsx"].includes(ext);
      // decide axios responseType
      const responseType = isArrayBuffer
        ? "arraybuffer"
        : isText
        ? "text"
        : "blob";

      const res = await http.get("/file/preview-by-id", {
        params: { id },
        responseType,
        onDownloadProgress: (ev) => {
          // debug log - 在排查时非常有用
          try {
            console.log("[onDownloadProgress]", {
              loaded: ev.loaded,
              total: ev.total,
              lengthComputable: ev.lengthComputable,
            });
          } catch (e) {
            console.log("[onDownloadProgress] event not standard", e);
          }

          if (ev && ev.lengthComputable) {
            downloadPercent.value = Math.floor((ev.loaded / ev.total) * 100);
          } else {
            // fallback: 给用户可见的进度感（不精确）
            // 以较小步长推进到 95%，真正完成后设 100%
            downloadPercent.value = Math.min(95, downloadPercent.value + 6);
          }
        },
      });

      // handle response by type
      if (isText) {
        if (["txt", "csv", "log"].includes(ext)) {
          textContent.value = res.data;
        } else if (ext === "md") {
          renderedMarkdown.value = marked(res.data);
        } else if (ext === "json") {
          try {
            formattedJson.value = JSON.stringify(JSON.parse(res.data), null, 2);
          } catch (e) {
            // 如果解析失败，就直接显示原文
            formattedJson.value = res.data;
            console.warn("JSON 解析失败，显示原始内容", e);
          }
        }
      } else {
        if (isArrayBuffer) {
          // some office viewer components expect ArrayBuffer
          fileUrl.value = res.data;
        } else {
          // blob -> objectURL
          const blob = res.data;
          fileUrl.value = URL.createObjectURL(blob);
        }
      }

      // 打开对话框并确保进度显示 100%
      downloadPercent.value = 100;
      dialogVisible.value = true;
    } catch (err) {
      console.error("加载文件失败", err);
      // 保持对话框关闭并清理
      closeDialog();
    } finally {
      // 给用户看到 100% 的短暂缓冲，然后隐藏进度指示
      setTimeout(() => {
        showProgress.value = false;
        // 注意不要马上把 downloadPercent 清零，给模板短暂机会显示 100%
        downloadPercent.value = 0;
      }, 400);
    }
  }

  return {
    dialogVisible,
    fileUrl,
    fileType,
    textContent,
    renderedMarkdown,
    formattedJson,
    downloadPercent,
    showProgress,
    previewFileById,
    onRendered,
    onError,
    closeDialog,
  };
}
