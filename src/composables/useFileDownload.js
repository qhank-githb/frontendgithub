import { ElLoading, ElMessage } from "element-plus";
import * as filesApi from "@/api/files";

export function useFileDownload(selectedIds) {
  async function downloadById(id) {
    const loading = ElLoading.service({ text: "正在下载..." });
    try {
      const res = await filesApi.downloadById(id);
      let filename = `file_${id}`;
      const disposition = res.headers["content-disposition"];
      if (disposition) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match) filename = decodeURIComponent(match[1]);
      }
      const blob = new Blob([res.data]);
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      ElMessage.error("下载失败");
    } finally {
      loading.close();
    }
  }

  async function batchDownload() {
    if (!selectedIds.value.length) return ElMessage.warning("请先选择文件");
    const loading = ElLoading.service({ text: "正在下载..." });
    try {
      const res = await filesApi.batchDownload(selectedIds.value);
      const blob = new Blob([res.data], { type: "application/zip" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `batch_${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error(err);
      ElMessage.error("批量下载失败");
    } finally {
      loading.close();
    }
  }

  return { downloadById, batchDownload };
}
