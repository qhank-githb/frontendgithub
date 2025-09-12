<template>
  <div class="search-container" style="margin-bottom: 16px">
    <el-form :inline="true" class="search-form">
      <!-- 上传者 -->
      <el-form-item label="上传者">
        <el-input
          v-model="queryLocal.uploader"
          placeholder="输入上传者"
          style="width: 160px"
        />
      </el-form-item>

      <!-- 文件名 -->
      <el-form-item label="文件名">
        <el-input
          v-model="queryLocal.fileName"
          placeholder="输入文件名"
          style="width: 160px"
        />
      </el-form-item>

      <!-- 时间范围 -->
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="timeRangeLocal"
          type="datetimerange"
          style="width: 300px"
          @change="handleTimeRangeChange"
          placeholder="选择时间范围"
        />
      </el-form-item>

      <!-- ID -->
      <el-form-item label="ID">
        <el-input
          v-model="queryLocal.id"
          style="width: 120px"
          placeholder="输入ID"
        />
      </el-form-item>

      <!-- 标签抽屉按钮 -->
      <el-form-item>
        <el-button
          type="primary"
          @click="drawerVisible = true"
          style="margin-left: 10px"
        >
          <i class="el-icon-tags"></i> 标签列表
        </el-button>
      </el-form-item>
    </el-form>
  </div>

  <!-- 标签抽屉 -->
  <el-drawer
    title="标签列表"
    v-model="drawerVisible"
    width="200px"
    :before-close="handleClose"
  >
    <el-card
      style="margin: 10px; padding: 10px; border: none; box-shadow: none"
    >
      <el-scrollbar style="height: calc(100vh - 120px)">
        <el-checkbox-group
          v-model="selectedTagsLocal"
          @change="handleTagChange"
        >
          <el-checkbox
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.id"
            style="display: block; margin: 6px 0"
          >
            {{ tag.name }}
          </el-checkbox>
        </el-checkbox-group>
        <!-- 空状态提示 -->
        <div
          v-if="allTags.length === 0"
          style="text-align: center; color: #999; padding: 20px 0"
        >
          暂无标签数据
        </div>
      </el-scrollbar>
    </el-card>
  </el-drawer>
</template>

<script setup>
import { ref, watch } from "vue";

// 接收父组件props
const props = defineProps({
  queryLocal: {
    type: Object,
    default: () => ({ uploader: "", fileName: "", id: "" }),
  },
  allTags: { type: Array, default: () => [] },
  selectedTags: { type: Array, default: () => [] },
  timeRange: { type: Array, default: () => null },
});

// 事件发射
const emit = defineEmits(["fetch", "update:selectedTags", "update:timeRange"]);

// 子组件内部状态
const drawerVisible = ref(false);
const selectedTagsLocal = ref([...props.selectedTags]);
const timeRangeLocal = ref(props.timeRange);

// 同步父组件数据变化
watch(
  () => props.selectedTags,
  (newVal) => {
    selectedTagsLocal.value = Array.isArray(newVal) ? [...newVal] : [];
  },
  { immediate: true }
);

watch(
  () => props.timeRange,
  (newVal) => {
    timeRangeLocal.value = newVal;
  },
  { immediate: true }
);

// 抽屉关闭回调
const handleClose = () => {
  drawerVisible.value = false;
};

// 标签选择变化处理 - 核心修改：标签改变时立即触发fetch
const handleTagChange = (selected) => {
  // 更新选中的标签
  emit("update:selectedTags", selected);
  // 立即触发数据获取
  emit("fetch");
};

// 时间范围变化处理
const handleTimeRangeChange = (range) => {
  emit("update:timeRange", range);
  // 可选：如果需要时间范围变化也立即触发fetch，可以添加下面这行
  // emit("fetch");
};
</script>

<style scoped>
:deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

@media (max-width: 1200px) {
  .search-form {
    justify-content: flex-start;
  }
  .el-form-item {
    margin-bottom: 8px !important;
  }
}
</style>
