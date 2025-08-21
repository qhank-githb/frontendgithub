<template>
  <el-form :inline="true" class="mb-3">
    <el-form-item label="用户名">
      <el-input
        v-model="usernameLocal"
        placeholder="请输入用户名"
        style="width: 200px"
      />
    </el-form-item>

    <el-form-item label="选择已有标签">
      <el-select
        v-model="selectedTagLocal"
        placeholder="请选择标签"
        style="width: 200px"
        @change="onTagSelected"
      >
        <el-option
          v-for="tag in allTags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
    </el-form-item>

    <el-form-item label="新建桶名">
      <el-input
        v-model="newBucketLocal"
        placeholder="输入新桶名"
        style="width: 200px"
        @input="onNewBucketInput"
      />
    </el-form-item>
    <el-form-item label="选择已有桶">
      <el-select
        v-model="selectedBucketLocal"
        placeholder="请选择桶"
        style="width: 200px"
        @change="onBucketSelected"
      >
        <el-option v-for="b in bucketOptions" :key="b" :label="b" :value="b" />
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
import { computed, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import { useUpload } from "@/composables/useUpload";
import { handleCreateTag } from "@/composables/useTagCreate";
import { useTagSelector } from "@/composables/useTagSelector";

/**
 * props / emit 必须先定义
 */
const props = defineProps({
  username: { type: String, default: "" },
  bucketOptions: { type: Array, default: () => [] },
  selectedBucket: { type: String, default: "" },
  newBucket: { type: String, default: "" },
  modelValue: { type: Array, default: () => [] },
  availableTags: { type: Array, default: () => [] }, // 可选标签池（可选）
});

const emit = defineEmits([
  "update:selectedBucket",
  "update:newBucket",
  "upload-success",
  "upload-error",
  "update:modelValue",
]);

/**
 * 把 props.modelValue 传给 composable，保证双向绑定
 */
const {
  selectedTags,
  inputVisible,
  inputValue,
  showInput,
  handleInputConfirm,
  removeTag,
  toggleTag,
} = useTagSelector(props.modelValue, (val) => emit("update:modelValue", val));

/**
 * 单选下拉（选择已有标签后追加到 selectedTags）
 */
const selectedTagLocal = ref(""); // 单选下拉当前值

function onTagSelected(tag) {
  if (!tag) return;
  if (!selectedTags.value.includes(tag)) {
    selectedTags.value.push(tag);
  }
  console.log("当前 selectedTags:", selectedTags.value);

  // 清空单选框，方便再次选择
  selectedTagLocal.value = "";
}

/**
 * 获取并标准化后端标签列表（保证是 string[]）
 */
const allTags = ref([]);
async function fetchTags() {
  try {
    const res = await axios.get("http://192.168.150.93:5000/api/tags");
    // 假设后端返回 [{id:..., name:...}, ...] 或 ["a","b","c"]
    if (Array.isArray(res.data)) {
      if (res.data.length === 0) {
        allTags.value = [];
      } else if (typeof res.data[0] === "string") {
        allTags.value = res.data;
      } else {
        allTags.value = res.data.map((t) => t.name || t);
      }
    } else {
      allTags.value = [];
    }
  } catch (err) {
    console.error("获取标签失败", err);
  }
}

onMounted(() => {
  fetchTags();
});

/**
 * 新建标签输入与创建（简单实现：输入框 + 按钮）
 */
const newTagInput = ref("");
async function onTagCreate() {
  const newTag = (newTagInput.value || "").trim();
  if (!newTag) {
    ElMessage.warning("请输入标签名");
    return;
  }
  try {
    const created = await handleCreateTag(newTag); // 期望后端返回 { name: 'xxx', id: 1 } 或至少 { name }
    const tagName = created?.name || newTag;
    // 把新标签加入 allTags（避免重复）
    if (!allTags.value.includes(tagName)) allTags.value.push(tagName);
    // 同时加入已选标签，方便上传绑定
    if (!selectedTags.value.includes(tagName)) selectedTags.value.push(tagName);

    newTagInput.value = "";
    ElMessage.success("标签创建并已加入已选");
  } catch (err) {
    console.error("标签创建失败", err);
    ElMessage.error("标签创建失败");
  }
}

/**
 * 桶 / 用户名 双向绑定
 */
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

/**
 * 上传表单数据：把 tags 序列化为 JSON 字符串（后端解析）
 */
const uploadData = computed(() => ({
  username: usernameLocal.value,
  tags: JSON.stringify(selectedTags.value),
}));

/**
 * 上传相关（复用 useUpload）
 */
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
  console.log("上传前 uploadData:", uploadData.value);
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
