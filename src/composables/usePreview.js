// src/composables/usePreview.js
import { ref } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import * as filesApi from "@/api/files"; // 注意路径
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

/**
 * 组合式函数，管理文件预览
 */
export function usePreview(backendBaseUrl) {
  const dialogVisible = ref(false);
  const previewContainer = ref(null);
  const currentFile = ref(null);

  // 打开预览弹窗
  const previewFile = async (file) => {
    if (!file || !file.id || !file.originalFileName) return;

    currentFile.value = file;
    dialogVisible.value = true;

    // 延迟确保容器渲染完成
    setTimeout(() => {
      if (previewContainer.value) {
        previewByIdAuto(
          file.id,
          file.originalFileName,
          previewContainer.value,
          backendBaseUrl
        );
      }
    }, 50);
  };

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false;
    if (previewContainer.value) previewContainer.value.innerHTML = "";
    currentFile.value = null;
  };

  return {
    dialogVisible,
    previewContainer,
    currentFile,
    previewFile,
    handleClose,
  };
}

/**
 * 自动预览文件
 * @param {String} id 文件ID
 * @param {String} filename 文件名
 * @param {HTMLElement} container 渲染容器
 * @param {String} backendBaseUrl 后端地址（用于 office 预览）
 */
export async function previewByIdAuto(id, filename, container, backendBaseUrl) {
  const ext = filename.split(".").pop().toLowerCase();
  let type = "";

  if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext))
    type = "image";
  else if (["mp4", "webm", "ogg"].includes(ext)) type = "video";
  else if (ext === "pdf") type = "pdf";
  else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(ext))
    type = "office";
  else type = "unknown";

  try {
    if (type === "image" || type === "video" || type === "pdf") {
      const res = await filesApi.downloadById(id, { responseType: "blob" });
      const blob = new Blob([res.data]);
      const url = URL.createObjectURL(blob);

      if (type === "image") {
        container.innerHTML = `<img src="${url}" style="max-width:100%; max-height:600px"/>`;
      } else if (type === "video") {
        container.innerHTML = `<video src="${url}" controls style="max-width:100%; max-height:600px"></video>`;
      } else if (type === "pdf") {
        const arrayBuffer = await res.data.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });

        const canvas = document.createElement("canvas");
        container.innerHTML = "";
        container.appendChild(canvas);
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const ctx = canvas.getContext("2d");
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    } else if (type === "office") {
      if (!backendBaseUrl) throw new Error("backendBaseUrl 未定义");
      const fileUrl = `${backendBaseUrl}/files/download/${id}`;
      const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        fileUrl
      )}`;
      container.innerHTML = `<iframe src="${officeUrl}" width="100%" height="600px"></iframe>`;
    } else {
      container.innerHTML = `<div>不支持预览此类型文件</div>`;
    }
  } catch (err) {
    console.error("[previewByIdAuto] error:", err);
    container.innerHTML = `<div style="color:red">预览失败</div>`;
  }
}
