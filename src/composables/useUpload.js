// 上传逻辑封装：进度合并、批次控制、成功/失败处理
import { ref } from "vue";
import { ElMessage } from "element-plus";

/**
 * useUpload - composable
 * options:
 *   onFinishFetchBuckets: function 当批次完成后回调（父组件可传以刷新桶列表）
 */
export function useUpload({ onFinishFetchBuckets } = {}) {
  const uploadPercent = ref(0);
  const showProgress = ref(false);
  const uploadLoading = ref(false);

  // 批次内部状态
  const batchTotalSize = ref(0);
  const fileUploadedBytes = ref({}); // { uid: bytes }
  const batchTotalFiles = ref(0);
  const batchCompletedCount = ref(0);
  const batchInProgress = ref(false);

  function resetBatchStateAfterDelay() {
    setTimeout(() => {
      batchTotalSize.value = 0;
      fileUploadedBytes.value = {};
      batchTotalFiles.value = 0;
      batchCompletedCount.value = 0;
      batchInProgress.value = false;
      uploadPercent.value = 0;
      showProgress.value = false;
      uploadLoading.value = false;
    }, 600);
  }

  function beforeUpload(file, fileList) {
    if (!file) return false;

    if (file.size === 0) {
      ElMessage.error("不可上传空文件");
      return false;
    }
    if (file.size / 1024 / 1024 > 500) {
      ElMessage.error("文件大小不能超过 500MB");
      return false;
    }

    if (!batchInProgress.value) {
      batchInProgress.value = true;
      batchCompletedCount.value = 0;
      fileUploadedBytes.value = {};

      // ✅ 确保单文件时也有正确的总数和总大小
      batchTotalFiles.value = fileList?.length || 1;
      batchTotalSize.value =
        fileList?.reduce((s, f) => s + (f.size || 0), 0) || file.size || 0;
    }

    // 记录当前文件
    if (!(file.uid in fileUploadedBytes.value)) {
      fileUploadedBytes.value[file.uid] = 0;
    }

    uploadLoading.value = true;
    showProgress.value = true;
    uploadPercent.value = 0;
    return true;
  }

  function handleUploadProgress(event, file, fileList) {
    if (!event) return;
    const uid = file.uid;
    fileUploadedBytes.value[uid] = Math.min(
      event.loaded,
      event.total || file.size || event.loaded
    );

    const uploadedTotal = Object.values(fileUploadedBytes.value).reduce(
      (s, v) => s + (v || 0),
      0
    );
    const percent =
      batchTotalSize.value > 0
        ? (uploadedTotal / batchTotalSize.value) * 100
        : 0;
    uploadPercent.value = Math.floor(percent);
  }

  function handleUploadSuccess(res, file) {
    fileUploadedBytes.value[file.uid] =
      file.size || fileUploadedBytes.value[file.uid] || 0;
    batchCompletedCount.value++;

    if (batchCompletedCount.value >= batchTotalFiles.value) {
      uploadPercent.value = 100;
      uploadLoading.value = false;
      if (typeof onFinishFetchBuckets === "function") {
        try {
          onFinishFetchBuckets();
        } catch (e) {
          /* ignore */
        }
      }
      ElMessage.success("上传成功");
      resetBatchStateAfterDelay();
    }
  }

  function handleUploadError(err, file) {
    batchCompletedCount.value++;
    if (file && file.uid) {
      fileUploadedBytes.value[file.uid] =
        file.size || fileUploadedBytes.value[file.uid] || 0;
    }
    if (batchCompletedCount.value >= batchTotalFiles.value) {
      uploadPercent.value = 100;
      uploadLoading.value = false;
      resetBatchStateAfterDelay();
    }
    ElMessage.error("上传失败，请重试");
  }

  return {
    uploadPercent,
    showProgress,
    uploadLoading,
    beforeUpload,
    handleUploadProgress,
    handleUploadSuccess,
    handleUploadError,
  };
}
