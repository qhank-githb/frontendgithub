<template>
  <el-row :gutter="10">
    <!-- 上传者 -->
    <el-col :span="6">
      <el-form-item label="上传者">
        <el-input v-model="queryLocal.uploader" placeholder="输入上传者" />
      </el-form-item>
    </el-col>

    <!-- 文件名 -->
    <el-col :span="6">
      <el-form-item label="文件名">
        <el-input v-model="queryLocal.fileName" placeholder="输入文件名" />
      </el-form-item>
    </el-col>

    <!-- 时间范围 -->
    <el-col :span="8">
      <el-form-item label="时间范围">
        <el-date-picker
          v-model="timeRangeLocal"
          type="datetimerange"
          style="width: 100%"
          @change="updateTimeRange(timeRangeLocal)"
        />
      </el-form-item>
    </el-col>

    <!-- ID -->
    <el-col :span="4">
      <el-form-item label="ID">
        <el-input v-model="queryLocal.id" />
      </el-form-item>
    </el-col>

    <!-- 标签选择 -->
    <el-col :span="10">
      <el-form-item label="标签">
        <el-select
          v-model="selectedTagsLocal"
          multiple
          filterable
          allow-create
          placeholder="选择或输入标签"
          style="width: 100%"
          @change="updateSelectedTags(selectedTagsLocal)"
        >
          <el-option
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.name"
          />
        </el-select>
      </el-form-item>
    </el-col>

    <!-- 匹配模式 + 查询 -->
    <el-col :span="4">
      <el-checkbox
        v-model="tagMatchModeLocal"
        true-label="all"
        false-label="any"
        @change="updateTagMatchMode(tagMatchModeLocal)"
      >
        全部匹配
      </el-checkbox>
      <el-button
        @click="$emit('fetch')"
        type="primary"
        style="margin-left: 15px"
        :loading="queryLoading"
      >
        查询
      </el-button>
    </el-col>
  </el-row>
</template>

<script setup>
import { ref } from "vue";

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

const selectedTagsLocal = ref([...props.selectedTags]);
const tagMatchModeLocal = ref(props.tagMatchMode);
const timeRangeLocal = ref(props.timeRange);

function updateSelectedTags(value) {
  emit("update:selectedTags", value);
}
function updateTagMatchMode(value) {
  emit("update:tagMatchMode", value);
}
function updateTimeRange(value) {
  emit("update:timeRange", value);
}
</script>
