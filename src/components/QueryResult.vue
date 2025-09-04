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
          >下载</el-button
        >
        <el-button type="primary" size="small" @click="$emit('preview', row)"
          >预览</el-button
        >
        <el-button type="primary" size="small" @click="$emit('edit', row)"
          >编辑</el-button
        >
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  files: { type: Array, default: () => [] },
});
defineEmits(["download", "preview", "edit", "selection-change"]);

const multipleTable = ref(null);

// 暴露方法给父组件
function clearSelection() {
  multipleTable.value?.clearSelection();
}
function restoreSelection(selectedIds) {
  multipleTable.value?.clearSelection();
  props.files.forEach((row) => {
    if (selectedIds.includes(row.id)) {
      multipleTable.value?.toggleRowSelection(row, true);
    }
  });
}

defineExpose({
  clearSelection,
  restoreSelection,
});
</script>
