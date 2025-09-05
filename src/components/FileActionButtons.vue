<template>
  <div class="action-buttons">
    <el-checkbox
      v-model="tagMatchModeLocal"
      true-label="all"
      false-label="any"
      @change="$emit('update:tagMatchMode', tagMatchModeLocal)"
    >
      全部匹配
    </el-checkbox>
    <el-button type="primary" @click="$emit('fetch')" :loading="queryLoading">
      查询
    </el-button>

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
      @click="$emit('batch-download')"
      :disabled="selectedIds.length === 0"
    >
      批量下载 ({{ selectedIds.length }})
    </el-button>
  </div>
</template>

<script setup>
import { ref } from "vue";

const props = defineProps({
  totalCount: Number,
  selectedIds: Array,
  queryLoading: Boolean,
  tagMatchMode: { type: String, default: "any" },
});

const emit = defineEmits([
  "fetch",
  "select-all",
  "clear-selection",
  "batch-download",
  "update:tagMatchMode",
]);

const tagMatchModeLocal = ref(props.tagMatchMode);
</script>

<style scoped>
.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: flex-end; /* 底部对齐 */
  gap: 10px;
  margin-bottom: 12px; /* 👈 加一点下边距 */
}
</style>
