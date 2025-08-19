// src/composables/useUniversalPreview.js
import { ref } from "vue";
import axios from "axios";

export function useUniversalPreview(baseUrl = "http://192.168.150.93:5000") {
  const dialogVisible = ref(false);
  const fileUrl = ref(null);
  const fileType = ref(null);
  const officeViewerUrl = ref("");

  function onRendered() {
    console.log("文件渲染完成");
  }

  function onError() {
    console.log("文件渲染失败");
  }

  function closeDialog() {
    fileUrl.value && URL.revokeObjectURL(fileUrl.value);
    dialogVisible.value = false;
    fileUrl.value = null;
    officeViewerUrl.value = "";
    fileType.value = null;
  }

  async function previewFileById(id, filename) {
    const ext = filename.split(".").pop().toLowerCase();

    // 判断类型
    if (["docx"].includes(ext)) fileType.value = "docx";
    else if (["xlsx"].includes(ext)) fileType.value = "xlsx";
    else if (["pptx"].includes(ext)) fileType.value = "pptx";
    else if (["pdf"].includes(ext)) fileType.value = "pdf";
    else if (["doc", "xls", "ppt"].includes(ext)) fileType.value = "office";
    else fileType.value = "unknown";

    if (fileType.value === "office") {
      const fileUrlTemp = `${baseUrl}/api/file/download-by-id?id=${id}`;
      officeViewerUrl.value = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        fileUrlTemp
      )}`;
      dialogVisible.value = true;
      return;
    }

    try {
      const res = await axios.get(
        `${baseUrl}/api/file/preview-by-id?id=${id}`,
        { responseType: "blob" }
      );
      fileUrl.value = URL.createObjectURL(res.data);
      dialogVisible.value = true;
    } catch (err) {
      console.error("加载文件失败", err);
      fileUrl.value = null;
      fileType.value = "unknown";
      dialogVisible.value = false;
    }
  }

  return {
    dialogVisible,
    fileUrl,
    fileType,
    officeViewerUrl,
    previewFileById,
    onRendered,
    onError,
    closeDialog,
  };
}
