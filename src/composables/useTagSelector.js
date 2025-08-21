import { ref, watch, nextTick } from "vue";

/**
 * 标签选择器组合函数
 * @param {Array} modelValue - 父组件传入 v-model 数组
 * @param {Function} emitFn - 父组件的 emit('update:modelValue', val)
 */
export function useTagSelector(modelValue = [], emitFn) {
  const selectedTags = ref(Array.isArray(modelValue) ? [...modelValue] : []);
  const inputVisible = ref(false);
  const inputValue = ref("");

  // 双向绑定父组件
  watch(selectedTags, (val) => {
    emitFn && emitFn(val);
  });

  // 显示输入框
  const showInput = () => {
    inputVisible.value = true;
    nextTick(() => {
      const input = document.querySelector(".input-new-tag input");
      input && input.focus();
    });
  };

  // 输入新标签确认
  const handleInputConfirm = () => {
    const val = inputValue.value.trim();
    if (val && !selectedTags.value.includes(val)) {
      selectedTags.value.push(val);
    }
    inputValue.value = "";
    inputVisible.value = false;
  };

  // 删除标签
  const removeTag = (index) => selectedTags.value.splice(index, 1);

  // 点击可选标签切换选择状态
  const toggleTag = (tag) => {
    const idx = selectedTags.value.indexOf(tag);
    if (idx >= 0) {
      selectedTags.value.splice(idx, 1);
    } else {
      selectedTags.value.push(tag);
    }
  };

  return {
    selectedTags,
    inputVisible,
    inputValue,
    showInput,
    handleInputConfirm,
    removeTag,
    toggleTag,
  };
}
