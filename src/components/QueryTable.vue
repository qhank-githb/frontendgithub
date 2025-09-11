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
    <el-table-column label="关联标签">
      <template #default="{ row }">
        <el-tag
          v-for="tag in row.tags || []"
          :key="tag"
          type="info"
          class="mr-1"
        >
          {{ tag }}
        </el-tag>
      </template>
    </el-table-column>

    <el-table-column
      prop="fileSize"
      label="文件大小"
      :formatter="formatFileSize"
    />
    <el-table-column prop="uploader" label="上传者" />
    <el-table-column label="上传时间">
      <template #default="{ row }">
        {{ dayjs(row.uploadTime).format("YYYY-MM-DD HH:mm:ss") }}
      </template>
    </el-table-column>

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
import dayjs from "dayjs";

const props = defineProps({
  files: { type: Array, default: () => [] },
});
const emit = defineEmits(["selection-change", "download", "preview", "edit"]);

// 获取 el-table 实例
const multipleTable = ref(null);

/**
 * 将纯数字字节数转换为带单位的格式
 * @param {Object} row - 表格行数据
 * @returns {string} 带单位的文件大小（如 "1.5 MB"、"200 KB"）
 */
const formatFileSize = (row) => {
  // 获取纯数字字节数（确保是数字类型）
  const bytes = Number(row.fileSize);

  // 处理无效值
  if (isNaN(bytes) || bytes < 0) {
    return "0 B";
  }

  // 定义单位转换规则（字节 -> KB -> MB -> GB）
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  // 自动切换到最合适的单位（大于等于1024时进位）
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  // 保留1-2位小数（根据大小动态调整，避免显示过多小数位）
  const decimalPlaces = size < 10 ? 2 : 1;

  // 拼接数值和单位（如 "2.45 MB"、"100 KB"）
  return `${size.toFixed(decimalPlaces)} ${units[unitIndex]}`;
};

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
