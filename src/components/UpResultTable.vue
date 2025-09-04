<template>
  <h3
    style="display: flex; align-items: center; justify-content: space-between"
  >
    <span>上传结果（最近 {{ uploadResults.length }} 条）</span>
  </h3>

  <el-table
    :data="props.uploadResults"
    style="width: 100%"
    border
    v-if="uploadResults.length > 0"
  >
    <el-table-column
      prop="originalFileName"
      label="文件名"
      show-overflow-tooltip
    />
    <el-table-column prop="tags" label="标签" />
    <el-table-column prop="size" label="文件大小" />
    <el-table-column prop="username" label="上传者" />
    <el-table-column
      prop="uploadtime"
      label="上传时间"
      :formatter="
        (row) => (row.uploadtime ? row.uploadtime.toLocaleString() : '')
      "
    />
  </el-table>
  <div v-else style="color: #999; padding: 12px 0">暂无上传记录</div>
</template>
<script setup>
const props = defineProps({
  uploadResults: {
    type: Array,
    default: () => [],
  },
});
</script>
