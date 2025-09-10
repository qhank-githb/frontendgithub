<template>
  <el-form :inline="true" class="mb-3">
    <el-form-item label="选择已有标签">
      <el-select
        v-model="selectedTags"
        multiple
        filterable
        allow-create
        placeholder="请选择标签"
      >
        <el-option
          v-for="tag in allTags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="新建标签">
      <el-input
        v-model="newTagInput"
        placeholder="输入新标签名"
        style="width: 200px"
        @keyup.enter="onTagCreate"
      />
      <el-button type="primary" @click="onTagCreate" style="margin-left: 8px">
        创建并加入
      </el-button>
    </el-form-item>

    <el-form-item class="upload-form-item">
      <el-upload
        drag
        class="my-upload-area"
        :action="uploadAction"
        :headers="{ Authorization: `Bearer ${token}` }"
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
          上传文件大小不可超过 500MB<br />
        </div>
      </el-upload>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import http from "@/plugins/axios";
import { API_BASE } from "@/plugins/axios";
import { useUpload } from "@/composables/useUpload";
import { handleCreateTag } from "@/composables/useTagCreate";
import { useTagSelector } from "@/composables/useTagSelector";
import { useJwt } from "@/composables/useJwt";

const { currentUsername, isTokenValid, token } = useJwt();

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});

const emit = defineEmits([
  "upload-success",
  "upload-error",
  "update:modelValue",
]);

const { selectedTags } = useTagSelector(props.modelValue, (val) =>
  emit("update:modelValue", val)
);

const selectedTagLocal = ref("");
const allTags = ref([]);
const newTagInput = ref("");

// 获取标签列表
async function fetchTags() {
  try {
    const res = await http.get("/tags"); // 使用http实例和相对路径
    if (Array.isArray(res.data)) {
      allTags.value =
        typeof res.data[0] === "string"
          ? res.data
          : res.data.map((t) => t.name);
    } else {
      allTags.value = [];
    }
  } catch (err) {
    console.error("获取标签失败", err);
  }
}
onMounted(fetchTags);

function onTagSelected(tag) {
  if (!tag) return;
  if (!selectedTags.value.includes(tag)) selectedTags.value.push(tag);
  selectedTagLocal.value = "";
}

async function onTagCreate() {
  const newTag = (newTagInput.value || "").trim();
  if (!newTag) {
    ElMessage.warning("请输入标签名");
    return;
  }
  try {
    const created = await handleCreateTag(newTag);
    const tagName = created?.name || newTag;
    if (!allTags.value.includes(tagName)) allTags.value.push(tagName);
    if (!selectedTags.value.includes(tagName)) selectedTags.value.push(tagName);
    newTagInput.value = "";
    ElMessage.success("标签创建并已加入已选");
  } catch (err) {
    console.error("标签创建失败", err);
    ElMessage.error("标签创建失败");
  }
}

// 上传地址固定 my-bucket
// 上传地址
const uploadAction = computed(
  () => `${API_BASE}/my-bucket/fileupload/upload` // 使用API_BASE
);

// 上传数据
const uploadData = computed(() => ({
  username: currentUsername.value, // 用JWT解析的用户名
  tags: JSON.stringify(selectedTags.value),
}));

const {
  uploadPercent,
  showProgress,
  beforeUpload,
  handleUploadProgress,
  handleUploadSuccess,
  handleUploadError,
} = useUpload({ onFinishFetchBuckets: () => emit("upload-success") });

function handleBeforeUpload(file, fileList) {
  if (!currentUsername.value) {
    // 校验JWT解析的用户名
    ElMessage.error("未获取到用户信息，请重新登录"); //  提示更准确
    return false;
  }
  return beforeUpload(file, fileList);
}

function emitUploadSuccess(res, file) {
  handleUploadSuccess(res, file);
  emit("upload-success", { res, file });
}

function emitUploadError(err, file) {
  handleUploadError(err, file);
  emit("upload-error", { err, file });
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
