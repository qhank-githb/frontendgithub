<template>
  <el-card>
    <h2>文件上传</h2>

    <!-- UploadArea 保持不变：它会 emit upload-success -->
    <upload-area
      :username="username"
      :bucket-options="bucketOptions"
      v-model:selected-bucket="selectedBucket"
      v-model:new-bucket="newBucket"
      @upload-success="onUploadSuccess"
    />

    <el-divider />

    <!-- 恢复上传结果展示表格 -->
    <div style="margin-top: 12px">
      <h3
        style="
          display: flex;
          align-items: center;
          justify-content: space-between;
        "
      >
        <span>上传结果（最近 {{ uploadResults.length }} 条）</span>
        <small style="color: #888">最多显示 10 条</small>
      </h3>

      <el-table
        :data="uploadResults"
        style="width: 100%"
        border
        v-if="uploadResults.length > 0"
      >
        <el-table-column prop="originalFileName" label="文件名" />
        <el-table-column prop="size" label="文件大小" />
        <el-table-column prop="bucket" label="所在桶的名称" />
        <el-table-column prop="eTag" label="ETag" />
      </el-table>
      <div v-else style="color: #999; padding: 12px 0">暂无上传记录</div>
    </div>

    <el-divider />

    <h2>文件查询与下载</h2>
    <file-table
      ref="fileTableRef"
      :query="query"
      @update:query="(val) => (query = val)"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from "vue";
import UploadArea from "./components/UploadArea.vue";
import FileTable from "./components/FileTable.vue";
import { fetchBuckets } from "./api/files";
import { ElMessage } from "element-plus";

const username = ref("bolo-vue-test");
const bucketOptions = ref([]);
const selectedBucket = ref("");
const newBucket = ref("");

// 恢复上传结果数组
const uploadResults = ref([]); // 存放服务端返回的对象（或你需要展示的字段）
const fileTableRef = ref(null);

const query = ref({ uploader: "", fileName: "", bucket: "", id: "" });

async function loadBuckets() {
  try {
    bucketOptions.value = await fetchBuckets();
  } catch {
    ElMessage.error("获取桶列表失败");
  }
}

onMounted(loadBuckets);

function onUploadSuccess(payload) {
  console.log("[App] upload-success payload:", payload);
  if (!payload) return;

  // 兼容 axios 的 res 或直接 res 的各种情况
  let resData = null;
  if (payload.res) {
    resData = payload.res.data ?? payload.res;
  } else {
    resData = payload;
  }

  // 保守提取字段（注意这里用括号把 ?? 表达式包起来）
  const fileName =
    resData?.originalFileName ??
    resData?.fileName ??
    (payload.file && payload.file.name);
  const size = resData?.size ?? (payload.file && payload.file.size);

  // 下面这一行是重点：把 ?? 的部分放进括号，之后可以用 || 链接其他 fallback
  const bucket =
    (resData?.bucket ?? selectedBucket.value) ||
    newBucket.value ||
    resData?.bucketName ||
    "";

  const eTag =
    resData?.eTag ?? resData?.etag ?? resData?.ETag ?? resData?.e_tag ?? "";

  const item = {
    originalFileName: fileName,
    size,
    bucket,
    eTag,
    _raw: resData,
  };

  uploadResults.value.unshift(item);
  if (uploadResults.value.length > 10) uploadResults.value.pop();

  // 刷新桶 / 表格（按需）
  loadBuckets();
  fileTableRef.value?.fetchFileList?.();
}
</script>
