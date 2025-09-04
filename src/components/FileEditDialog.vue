<template>
  <el-dialog v-model="visible" title="编辑文件信息" width="500px">
    <el-form :model="localForm" label-width="80px">
      <!-- 文件名 -->
      <el-form-item label="文件名">
        <el-input v-model="localForm.fileName" />
      </el-form-item>

      <!-- 标签 -->
      <el-form-item label="标签">
        <el-select v-model="localForm.tags" multiple placeholder="选择标签">
          <el-option
            v-for="tag in allTags"
            :key="tag.id"
            :label="tag.name"
            :value="tag.name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <!-- 弹窗底部 -->
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="onSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  form: {
    type: Object,
    default: () => ({ id: null, fileName: "", tags: [] }),
  },
  allTags: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:modelValue", "save"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

// 本地表单，避免直接修改 props
const localForm = ref({ ...props.form });
watch(
  () => props.form,
  (v) => {
    localForm.value = { ...v };
  },
  { deep: true, immediate: true }
);

function close() {
  emit("update:modelValue", false);
}

function onSave() {
  emit("save", { ...localForm.value });
}
</script>
