import http from "@/plugins/axios";

// 所有文件相关接口集中在这里

export async function fetchBuckets() {
  const res = await http.get("/buckets");
  return res.data;
}

export async function fetchFileList(params) {
  const res = await http.get("/filequery/query", { params });
  return res.data;
}

export async function downloadById(id) {
  return http.get("/file/download-by-id", {
    params: { id },
    responseType: "blob",
  });
}

export async function batchDownload(ids) {
  return http.post("/file/batch-download", ids, { responseType: "blob" });
}
