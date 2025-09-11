import { ref } from "vue";
import http from "@/plugins/axios";

export function useDownloadPreview() {
  const downloadPercent = ref(0);
  const showProgress = ref(false);
  const fileUrl = ref(null);
  const fileType = ref(null);

  /**
   * 下载并预览文件
   * @param {number} id 文件ID
   * @param {string} filename 原始文件名
   */
  async function downloadAndPreview(id, filename) {
    showProgress.value = true;
    downloadPercent.value = 0;
    fileType.value = filename.split(".").pop().toLowerCase();
    fileUrl.value = null;

    try {
      const res = await http.get(`/file/preview-by-id?id=${id}`, {
        responseType: "blob",
        onDownloadProgress: (event) => {
          if (event.lengthComputable) {
            downloadPercent.value = Math.floor(
              (event.loaded / event.total) * 100
            );
          }
        },
      });

      // 创建临时 URL 用于预览
      fileUrl.value = URL.createObjectURL(res.data);
      downloadPercent.value = 100;
    } catch (err) {
      console.error("下载失败", err);
      downloadPercent.value = 0;
      fileUrl.value = null;
    } finally {
      setTimeout(() => {
        showProgress.value = false;
        downloadPercent.value = 0;
      }, 500);
    }
  }

  /**
   * 清理 ObjectURL
   */
  function revokeUrl() {
    if (fileUrl.value) {
      URL.revokeObjectURL(fileUrl.value);
      fileUrl.value = null;
    }
  }

  return {
    downloadPercent,
    showProgress,
    fileUrl,
    fileType,
    downloadAndPreview,
    revokeUrl,
  };
}
