import { ref } from "vue";
import axios from "axios";
import * as pdfjsLib from "pdfjs-dist";
import * as filesApi from "@/api/files";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

export function useUniversalPreview(baseUrl = "http://192.168.150.93:5000") {
  const dialogVisible = ref(false);
  const fileUrl = ref(null); // Office 文件 URL
  const fileType = ref(null); // 'docx' | 'xlsx' | 'pptx' | 'pdf' | 'image' | 'video'
  const fileBlob = ref(null); // PDF/图片/视频 Blob

  function onRendered() {
    console.log("文件渲染完成");
  }
  function onError() {
    console.log("文件渲染失败");
  }

  async function previewFile(id, filename) {
    const ext = filename.split(".").pop().toLowerCase();
    let type = "";

    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext))
      type = "image";
    else if (["mp4", "webm", "ogg"].includes(ext)) type = "video";
    else if (ext === "pdf") type = "pdf";
    else if (["doc", "docx"].includes(ext)) type = "docx";
    else if (["xls", "xlsx"].includes(ext)) type = "xlsx";
    else if (["ppt", "pptx"].includes(ext)) type = "pptx";
    else type = "unknown";

    try {
      if (["docx", "xlsx", "pptx"].includes(type)) {
        const res = await axios.get(
          `${baseUrl}/api/file/preview-by-id?id=${id}`,
          { responseType: "blob" }
        );
        fileUrl.value = URL.createObjectURL(res.data);
        fileType.value = type;
      } else if (["pdf", "image", "video"].includes(type)) {
        const res = await filesApi.downloadById(id, { responseType: "blob" });
        fileBlob.value = res.data;
        fileType.value = type;
      } else {
        fileType.value = "unknown";
      }
      dialogVisible.value = true;
    } catch (err) {
      console.error("[useUniversalPreview] error:", err);
      dialogVisible.value = false;
      fileUrl.value = null;
      fileBlob.value = null;
      fileType.value = null;
    }
  }

  return {
    dialogVisible,
    fileUrl,
    fileBlob,
    fileType,
    previewFile,
    onRendered,
    onError,
  };
}
