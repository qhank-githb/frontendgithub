<template>
  <el-form :inline="true" class="mb-3">
    <el-form-item label="用户名">
      <el-input
        v-model="usernameLocal"
        placeholder="请输入用户名"
        style="width: 200px"
      />
    </el-form-item>

    <el-form-item label="选择已有桶">
      <el-select
        v-model="selectedBucketLocal"
        placeholder="请选择桶名"
        style="width: 200px"
        @change="onBucketSelected"
      >
        <el-option v-for="b in bucketOptions" :key="b" :label="b" :value="b" />
      </el-select>
    </el-form-item>

    <el-form-item label="新建桶名">
      <el-input
        v-model="newBucketLocal"
        placeholder="输入新桶名"
        style="width: 200px; margin-right: 260px"
        @input="onNewBucketInput"
      />
    </el-form-item>

    <el-form-item>
      <el-progress
        :percentage="uploadPercent"
        style="width: 250px"
        v-if="showProgress"
      />
    </el-form-item>

    <el-form-item class="upload-form-item">
      <!-- 注意：不要在下面这个标签的属性里放 HTML 注释 -->
      <el-upload
        drag
        class="my-upload-area"
        :action="uploadAction"
        :data="uploadData"
        :before-upload="handleBeforeUpload"
        :on-progress="handleUploadProgress"
        :on-success="emitUploadSuccess"
        :on-error="emitUploadError"
        :show-file-list="false"
        :multiple="true"
      >
        <div class="el-upload__text">
          将文件拖到此处，或 <em>点击上传</em><br />
          上传文件大小不可超过 500MB
        </div>
      </el-upload>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { computed } from "vue";
import { ElMessage } from "element-plus";
import { useUpload } from "@/composables/useUpload";

const props = defineProps({
  username: { type: String, default: "" },
  bucketOptions: { type: Array, default: () => [] },
  selectedBucket: { type: String, default: "" },
  newBucket: { type: String, default: "" },
});

const emit = defineEmits([
  "update:selectedBucket",
  "update:newBucket",
  "upload-success",
  "upload-error",
]);

const selectedBucketLocal = computed({
  get: () => props.selectedBucket,
  set: (v) => emit("update:selectedBucket", v),
});
const newBucketLocal = computed({
  get: () => props.newBucket,
  set: (v) => emit("update:newBucket", v),
});
const usernameLocal = computed({
  get: () => props.username,
  set: (v) => emit("update:username", v),
});

const actualBucket = computed(
  () =>
    (newBucketLocal.value && newBucketLocal.value.trim()) ||
    selectedBucketLocal.value ||
    ""
);

const uploadAction = computed(() => {
  return actualBucket.value
    ? `http://192.168.150.93:5000/api/${actualBucket.value}/fileupload/upload`
    : "";
});

const uploadData = computed(() => ({ username: usernameLocal.value }));

const {
  uploadPercent,
  showProgress,
  beforeUpload: composableBeforeUpload,
  handleUploadProgress,
  handleUploadSuccess,
  handleUploadError,
} = useUpload({
  onFinishFetchBuckets: () => {
    emit("upload-success");
  },
});

function handleBeforeUpload(file, fileList) {
  if (!usernameLocal.value) {
    ElMessage.error("请先填写用户名");
    return false;
  }
  if (!actualBucket.value) {
    ElMessage.error("请先选择或输入桶名");
    return false;
  }
  return composableBeforeUpload(file, fileList);
}

function emitUploadSuccess(res, file) {
  handleUploadSuccess(res, file);
  emit("upload-success", { res, file });
}

function emitUploadError(err, file) {
  handleUploadError(err, file);
  emit("upload-error", { err, file });
}

function onBucketSelected() {
  newBucketLocal.value = "";
}
function onNewBucketInput() {
  selectedBucketLocal.value = "";
}
</script>

<style scoped>
.mb-3 {
  margin-bottom: 16px;
}
.upload-form-item {
  width: 100%;
}
.my-upload-area {
  width: 100%;
  height: 170px;
}
.my-upload-area .el-upload-dragger {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
