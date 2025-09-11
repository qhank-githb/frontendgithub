import { ref } from "vue";
import http from "@/plugins/axios";

export function useUniversalPreview(API_BASE) {
  const dialogVisible = ref(false);
  const fileUrl = ref("");
  const fileType = ref("");
  const textContent = ref("");
  const renderedMarkdown = ref("");
  const formattedJson = ref("");
  const downloadPercent = ref(0);
  const showProgress = ref(false);

  // 定义所有支持预览的文件类型
  const supportedTypes = [
    // 办公文件
    "docx",
    "pptx",
    "xlsx",
    "pdf",
    // 图片
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    // 视频
    "mp4",
    "webm",
    "ogg",
    // 文本类
    "txt",
    "csv",
    "log",
    "md",
    "json",
  ];

  // 通用预览方法
  async function previewFileById(id, filename) {
    // 提取文件扩展名
    const ext = (filename || "").split(".").pop().toLowerCase();

    // 先判断是否为支持的类型
    if (!supportedTypes.includes(ext)) {
      fileType.value = "unknown"; // 直接标记为未知类型
      dialogVisible.value = true; // 显示对话框
      showProgress.value = false; // 不显示进度条
      return; // 终止后续流程
    }

    // 支持的类型继续处理
    fileType.value = ext;
    dialogVisible.value = true;
    showProgress.value = true;
    downloadPercent.value = 0;

    try {
      const res = await http.get(`${API_BASE}/file/preview-by-id`, {
        params: { id },
        responseType: "blob",
        onDownloadProgress: (ev) => {
          if (ev && ev.lengthComputable) {
            downloadPercent.value = Math.floor((ev.loaded / ev.total) * 100);
          } else {
            downloadPercent.value = Math.min(95, downloadPercent.value + 5);
          }
        },
      });

      const blob = new Blob([res.data], {
        type: getMimeType(ext),
      });
      fileUrl.value = URL.createObjectURL(blob);

      // 处理文本类文件内容
      if (["txt", "csv", "log", "md", "json"].includes(ext)) {
        const text = await blob.text();
        if (ext === "json") {
          formattedJson.value = JSON.stringify(JSON.parse(text), null, 2);
        } else if (ext === "md") {
          renderedMarkdown.value = parseMarkdown(text); // 假设已有此方法
        } else {
          textContent.value = text;
        }
      }
    } catch (err) {
      console.error("预览失败:", err);
      fileType.value = "unknown"; // 错误时也标记为未知
    } finally {
      // 下载完成后延迟隐藏进度条
      setTimeout(() => {
        showProgress.value = false;
      }, 500);
    }
  }

  // MIME类型映射
  function getMimeType(ext) {
    const mimeMap = {
      jpg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      ogg: "video/ogg",
      txt: "text/plain",
      csv: "text/csv",
      log: "text/plain",
      md: "text/markdown",
      json: "application/json",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pdf: "application/pdf",
    };
    return mimeMap[ext] || "application/octet-stream";
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
  };
}
