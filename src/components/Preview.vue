<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { useUniversalPreview } from "@/composables/useUniversalPreview";
import VueOfficeDocx from "@vue-office/docx";
import VueOfficeExcel from "@vue-office/excel";
import "@vue-office/docx/lib/index.css";
import "@vue-office/excel/lib/index.css";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.13.216/pdf.worker.min.js";

const {
  dialogVisible,
  fileUrl,
  fileBlob,
  fileType,
  previewFile,
  onRendered,
  onError,
} = useUniversalPreview("http://192.168.150.93:5000");

const containerRef = ref(null);

function handlePreview(id, filename) {
  previewFile(id, filename);
}

// 渲染 PDF/图片/视频
watch([fileType, fileBlob], async () => {
  if (!containerRef.value || !fileBlob.value) return;
  if (fileType.value === "image") {
    const url = URL.createObjectURL(fileBlob.value);
    containerRef.value.innerHTML = `<img src="${url}" style="max-width:100%; max-height:600px"/>`;
  } else if (fileType.value === "video") {
    const url = URL.createObjectURL(fileBlob.value);
    containerRef.value.innerHTML = `<video src="${url}" controls style="max-width:100%; max-height:600px"></video>`;
  } else if (fileType.value === "pdf") {
    const arrayBuffer = await fileBlob.value.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    containerRef.value.innerHTML = "";
    containerRef.value.appendChild(canvas);
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    const ctx = canvas.getContext("2d");
    await page.render({ canvasContext: ctx, viewport }).promise;
  }
});
</script>

<template>
  <el-button @click="handlePreview(141, '123.jpg')">预览文件</el-button>

  <el-dialog v-model="dialogVisible" width="80%">
    <!-- Office 文件 -->
    <vue-office-docx
      v-if="fileType === 'docx' && fileUrl"
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
    <vue-office-pptx
      v-if="fileType === 'pptx' && fileUrl"
      :src="fileUrl"
      style="height: 80vh; width: 100%"
      @rendered="onRendered"
      @error="onError"
    />

    <!-- PDF/图片/视频 -->
    <div
      v-if="['pdf', 'image', 'video'].includes(fileType)"
      ref="containerRef"
      style="width: 100%; height: 600px; overflow: auto"
    ></div>

    <!-- 不支持文件 -->
    <div v-if="fileType === 'unknown'" style="color: red">
      不支持预览此类型文件
    </div>
  </el-dialog>
</template>
