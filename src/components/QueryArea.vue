<template>
  <!-- 第一行： 上传者 / 文件名 / 时间范围 / ID -->
  <el-row :gutter="10" class="qa-row">
    <el-col :span="6" class="qa-col">
      <el-form-item label="上传者">
        <!-- 固定宽度，防止被压扁 -->
        <el-input v-model="queryLocal.uploader" placeholder="输入上传者" />
      </el-form-item>
    </el-col>

    <el-col :span="6" class="qa-col">
      <el-form-item label="文件名">
        <el-input v-model="queryLocal.fileName" placeholder="输入文件名" />
      </el-form-item>
    </el-col>

    <el-col :span="8" class="qa-col">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="timeRangeLocal"
          type="datetimerange"
          style="width: 100%"
          @change="updateTimeRange(timeRangeLocal)"
        />
      </el-form-item>
    </el-col>

    <el-col :span="4" class="qa-col">
      <el-form-item label="ID">
        <el-input v-model="queryLocal.id" style="width: 80px" />
      </el-form-item>
    </el-col>
  </el-row>

  <el-aside
    width="200px"
    style="border-right: 1px solid #ebeef5; overflow-y: auto"
  >
    <el-card style="margin: 10px; padding: 10px">
      <h4>标签列表</h4>
      <el-scrollbar style="height: calc(100vh - 40px)">
        <el-checkbox-group
          v-model="selectedTagsLocal"
          @change="updateSelectedTags(selectedTagsLocal)"
        >
          <el-checkbox
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.id"
            style="display: block; margin: 4px 0"
          >
            {{ tag.name }}
          </el-checkbox>
        </el-checkbox-group>
      </el-scrollbar>
    </el-card>
  </el-aside>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  queryLocal: { type: Object, default: () => ({}) },
  allTags: { type: Array, default: () => [] },
  queryLoading: { type: Boolean, default: false },
  selectedTags: { type: Array, default: () => [] },
  tagMatchMode: { type: String, default: "any" },
  timeRange: { type: Array, default: () => null },
});

const emit = defineEmits([
  "fetch",
  "update:selectedTags",
  "update:tagMatchMode",
  "update:timeRange",
]);

// 保持和父组件的 selectedTags / timeRange 同步
const selectedTagsLocal = ref([...props.selectedTags]);
const timeRangeLocal = ref(props.timeRange);

watch(
  () => props.selectedTags,
  (v) => {
    selectedTagsLocal.value = Array.isArray(v) ? [...v] : [];
  }
);
watch(
  () => props.timeRange,
  (v) => {
    timeRangeLocal.value = v;
  }
);

function updateSelectedTags(value) {
  emit("update:selectedTags", value);
}
function updateTimeRange(value) {
  emit("update:timeRange", value);
}
</script>
