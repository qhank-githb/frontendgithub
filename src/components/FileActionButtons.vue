<template>
  <el-row :gutter="10" style="margin-top: 10px">
    <el-col :span="10" style="text-align: right">
      <el-button type="primary" @click="$emit('select-all')">
        勾选全部 {{ totalCount }} 个
      </el-button>
      <el-button
        type="warning"
        @click="$emit('clear-selection')"
        :disabled="selectedIds.length === 0"
      >
        取消勾选
      </el-button>
      <el-button
        type="success"
        :disabled="selectedIds.length === 0"
        @click="$emit('batch-download')"
      >
        批量下载 ({{ selectedIds.length }})
      </el-button>
    </el-col>
  </el-row>
</template>

<script setup>
defineProps({
  totalCount: Number,
  selectedIds: Array,
});
defineEmits(["select-all", "clear-selection", "batch-download"]);
</script>
