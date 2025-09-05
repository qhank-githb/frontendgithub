<template>
  <el-table
    :data="files"
    style="width: 100%"
    ref="multipleTable"
    :row-key="(row) => row.id"
    @selection-change="$emit('selection-change', $event)"
    border
  >
    <el-table-column type="selection" width="55" />
    <el-table-column prop="id" label="ID" width="60" />
    <el-table-column prop="originalFileName" label="文件名" />
    <el-table-column prop="fileSize" label="文件大小" />
    <el-table-column prop="uploader" label="上传者" />
    <el-table-column prop="uploadTime" label="上传时间" />
    <el-table-column label="操作" width="200">
      <template #default="{ row }">
        <el-button
          type="primary"
          size="small"
          @click="$emit('download', row.id)"
        >
          下载
        </el-button>
        <el-button
          type="primary"
          size="small"
          @click="$emit('preview', row.id, row.originalFileName)"
        >
          预览
        </el-button>
        <el-button type="primary" size="small" @click="$emit('edit', row)">
          编辑
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref, nextTick } from "vue";

const props = defineProps({
  files: { type: Array, default: () => [] },
});
const emit = defineEmits(["selection-change", "download", "preview", "edit"]);

// 获取 el-table 实例
const multipleTable = ref(null);

/**
 * 清除当前表格的可视选择（调用 el-table 的 API）
 */
function clearSelection() {
  try {
    multipleTable.value?.clearSelection?.();
  } catch (e) {
    // 防御性处理，避免因实例不同而报错
    console.warn("clearSelection failed:", e);
  }
}

/**
 * 在当前页恢复勾选
 * @param {Array<string|number>} selectedIds - 已选 id 列表（字符串或数字）
 */
async function restoreSelection(selectedIds = []) {
  if (!multipleTable.value) return;
  try {
    // 标准化：把 selectedIds 转为字符串集合，便于比较
    const idSet = new Set((selectedIds || []).map((id) => String(id)));

    // 清空当前视觉选择
    multipleTable.value.clearSelection && multipleTable.value.clearSelection();
    await nextTick();

    // 在当前 files 中找到匹配 id 的行并勾上
    (props.files || []).forEach((row) => {
      const rid = String(row.id);
      if (idSet.has(rid)) {
        // toggleRowSelection 在 el-table 实例上存在（ElementPlus）
        try {
          multipleTable.value.toggleRowSelection &&
            multipleTable.value.toggleRowSelection(row, true);
        } catch (e) {
          console.warn("toggleRowSelection failed for row", row, e);
        }
      }
    });
  } catch (err) {
    console.error("restoreSelection error:", err);
  }
}

// 将方法暴露给父组件（父组件通过 ref 调用）
defineExpose({
  clearSelection,
  restoreSelection,
});
</script>

<style scoped>
/* 如果需要可在这里加入样式 */
</style>
