// src/api/fileService.js
import http from "./http";

function joinUrl(...parts) {
  return parts.map((p) => p.replace(/^\/+|\/+$/g, "")).join("/");
}

export const fileService = {
  listBuckets() {
    return http.get("buckets");
  },

  upload(bucket, username, file) {
    const url = joinUrl(bucket, "fileupload", "upload");
    const form = new FormData();
    form.append("file", file);
    return http.post(url, form, {
      headers: { "Content-Type": "multipart/form-data" },
      params: { username },
    });
  },

  query(params) {
    return http.get("filequery/query", { params });
  },

  downloadById(bucket, id) {
    const url = joinUrl(bucket, "file", "download-by-id");
    return http.get(url, {
      params: { id },
      responseType: "blob",
    });
  },

  batchDownload(bucket, ids) {
    const url = joinUrl(bucket, "file", "batch-download");
    return http.post(url, ids, { responseType: "blob" });
  },
};
