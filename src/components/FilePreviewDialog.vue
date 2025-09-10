<template>
  <el-dialog v-model="visible" width="80%" :before-close="onClose">
    <!-- Office 文件 -->
    <vue-office-docx
      v-if="fileType === 'docx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="onRendered"
      @error="onError"
    />
    <vue-office-pptx
      v-if="fileType === 'pptx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="onRendered"
      @error="onError"
    />
    <vue-office-excel
      v-if="fileType === 'xlsx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="onRendered"
      @error="onError"
    />
    <vue-office-pdf
      v-if="fileType === 'pdf' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="onRendered"
      @error="onError"
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
      v-if="['txt', 'csv', 'log'].includes(fileType)"
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
  modelValue: Boolean, // 控制 dialog 显示
  fileUrl: [String, ArrayBuffer, Blob],
  fileType: String,
  textContent: String,
  renderedMarkdown: String,
  formattedJson: String,
  onRendered: Function,
  onError: Function,
});

const emit = defineEmits(["update:modelValue"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

function onClose() {
  emit("update:modelValue", false);
}
watch(
  () => props.fileUrl,
  (val) => {
    console.log("FilePreviewDialog 收到 fileUrl:", val);
  }
);

function onError(e) {
  console.error(e);
}
</script>
