<template>
  <el-dialog v-model="visible" width="80%" :before-close="onClose">
    <!-- 下载进度 -->
    <div v-if="showProgress" style="margin-bottom: 10px">
      <el-progress :percentage="downloadPercent" />
      <div style="font-size: 14px; color: #409eff">{{ downloadPercent }}%</div>
    </div>

    <!-- Office 文件 -->
    <vue-office-docx
      v-if="fileType === 'docx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="props.onRendered"
      @error="props.onError"
    />
    <vue-office-pptx
      v-if="fileType === 'pptx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="props.onRendered"
      @error="props.onError"
    />
    <vue-office-excel
      v-if="fileType === 'xlsx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="props.onRendered"
      @error="props.onError"
    />
    <vue-office-pdf
      v-if="fileType === 'pdf' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="props.onRendered"
      @error="props.onError"
    />

    <!-- 图片 -->
    <img
      v-if="
        ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileType) &&
        fileUrl
      "
      :src="fileUrl"
      style="max-width: 100%; max-height: 80vh"
    />

    <!-- 视频 -->
    <video
      v-if="['mp4', 'webm', 'ogg'].includes(fileType) && fileUrl"
      :src="fileUrl"
      controls
      style="max-width: 100%; max-height: 80vh"
    ></video>

    <!-- 文本 -->
    <pre
      v-if="['txt', 'csv', 'log'].includes(fileType) && fileUrl"
      style="white-space: pre-wrap"
    >
      {{ textContent }}
    </pre>

    <!-- Markdown -->
    <div v-if="fileType === 'md'" v-html="renderedMarkdown"></div>

    <!-- JSON -->
    <pre v-if="fileType === 'json'">{{ formattedJson }}</pre>

    <!-- 不支持 -->
    <div v-if="fileType === 'unknown'">不支持预览此类型文件</div>
  </el-dialog>
</template>

<script setup>
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import VueOfficePptx from "@vue-office/pptx";
import VueOfficePdf from "@vue-office/pdf";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import { computed, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
  fileUrl: [String, ArrayBuffer, Blob],
  fileType: String,
  textContent: String,
  renderedMarkdown: String,
  formattedJson: String,
  progress: {
    type: Object,
    default: () => ({
      downloadPercent: ref(0),
      showProgress: ref(false),
    }),
  },
  onRendered: Function,
  onError: Function,
});

// FilePreviewDialog.vue
const downloadPercent = computed(() => props.progress.downloadPercent);
const showProgress = computed(() => props.progress.showProgress);

// 在 FilePreviewDialog.vue 中添加
watch(
  [downloadPercent, showProgress],
  ([newPercent, newShow], [oldPercent, oldShow]) => {
    console.log("进度条状态变化", {
      showProgress: newShow,
      downloadPercent: newPercent,
    });
  },
  { immediate: true }
);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const emit = defineEmits(["update:modelValue"]);

function onClose() {
  emit("update:modelValue", false);
}

function onError(e) {
  console.error(e);
}
</script>
