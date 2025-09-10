import { ElLoading, ElMessage } from "element-plus";
import * as filesApi from "@/api/files";

/**
 * 解析 Content-Disposition 中的文件名（支持 filename*、filename、以及简单 RFC2047）
 * 返回 null 表示未解析到
 */
function parseContentDisposition(disposition) {
  if (!disposition) return null;

  // 尝试找到 filename*（RFC5987）: charset''percent-encoded 或者 filename*=percentEncoded
  const starRegex = /filename\*\s*=\s*([^;]+)/i;
  const starMatch = disposition.match(starRegex);
  if (starMatch) {
    let val = starMatch[1].trim();
    // 去掉可能的引号
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    // 常见格式：UTF-8''%E4%B8%AD%E6%96%87.doc
    const parts = val.split("''");
    try {
      if (parts.length === 2) {
        // parts[1] 是 percent-encoded
        return decodeURIComponent(parts[1]);
      } else {
        // 直接尝试 decodeURIComponent
        return decodeURIComponent(val);
      }
    } catch (e) {
      // decode 失败则回退为原始未解码值（去引号）
      return val;
    }
  }

  // 再尝试常规 filename="..."
  const filenameRegex = /filename\s*=\s*"([^"]+)"|filename\s*=\s*([^;]+)/i;
  const filenameMatch = disposition.match(filenameRegex);
  if (filenameMatch) {
    let name = filenameMatch[1] || filenameMatch[2] || "";
    name = name.trim();
    // 去掉引号
    if (name.startsWith('"') && name.endsWith('"')) name = name.slice(1, -1);

    // 有时候后端会把 UTF-8 做了 percent-encoding 放在 filename 中，尝试 decodeURIComponent
    try {
      return decodeURIComponent(name);
    } catch (e) {
      // 不是 percent-encoding，直接返回原串
      return name;
    }
  }

  // 简单尝试 RFC2047 形式 =?utf-8?B?base64?= 或 =?utf-8?q?...
  const rfc2047Regex = /=\?([^?]+)\?([bqBQ])\?([^?]+)\?=/;
  const rfcMatch = disposition.match(rfc2047Regex);
  if (rfcMatch) {
    const enc = rfcMatch[2].toLowerCase();
    const text = rfcMatch[3];
    try {
      if (enc === "b") {
        const bytes = atob(text);
        // 将 binary string 转为 UTF-8 字符串
        // eslint-disable-next-line no-undef
        return decodeURIComponent(escape(bytes));
      } else {
        // q-encoding: 等号十六进制替换
        const replaced = text.replace(/_/g, " ");
        const decoded = replaced.replace(/=([A-Fa-f0-9]{2})/g, (_, hex) =>
          String.fromCharCode(parseInt(hex, 16))
        );
        return decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  return null;
}

export function useFileDownload(selectedIds) {
  async function downloadById(id) {
    const loading = ElLoading.service({ text: "正在下载..." });
    try {
      const res = await filesApi.downloadById(id);

      // headers 在浏览器环境会被转小写，但是兼容性保留两种写法
      const disposition =
        (res.headers &&
          (res.headers["content-disposition"] ||
            res.headers["Content-Disposition"])) ||
        "";

      let filename = `file_${id}`;
      const parsed = parseContentDisposition(disposition);
      if (parsed) filename = parsed;

      // res.data 可能已经是 Blob（如果 filesApi 设置了 responseType: 'blob'），也可能是 ArrayBuffer / Uint8Array / string
      let blob;
      if (typeof Blob !== "undefined" && res.data instanceof Blob) {
        blob = res.data;
      } else {
        // 如果是 ArrayBuffer 或其他，合成 Blob。若没有 type，则保守设置为 octet-stream
        const type = (res.data && res.data.type) || "application/octet-stream";
        blob = new Blob([res.data], { type });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      // 兼容性：部分浏览器需要 append 到 DOM
      document.body.appendChild(a);
      a.click();
      // 延迟 revoke 和移除，确保下载已触发
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
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

      const disposition =
        (res.headers &&
          (res.headers["content-disposition"] ||
            res.headers["Content-Disposition"])) ||
        "";
      let filename = `batch_${Date.now()}.zip`;
      const parsed = parseContentDisposition(disposition);
      if (parsed) filename = parsed;

      let blob;
      if (typeof Blob !== "undefined" && res.data instanceof Blob) {
        blob = res.data;
      } else {
        const type = (res.data && res.data.type) || "application/zip";
        blob = new Blob([res.data], { type });
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 1000);
    } catch (err) {
      console.error(err);
      ElMessage.error("批量下载失败");
    } finally {
      loading.close();
    }
  }

  return { downloadById, batchDownload };
}
