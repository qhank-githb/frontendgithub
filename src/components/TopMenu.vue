<template>
  <div style="display: flex; align-items: center; padding: 0 16px">
    <el-menu
      mode="horizontal"
      :default-active="modelValue"
      @select="handleMenuSelect"
      background-color="transparent"
      text-color="#333333"
      active-text-color="#64B5F6"
      style="flex: 1"
    >
      <el-menu-item index="upload">上传文件</el-menu-item>
      <el-menu-item index="query">查询文件</el-menu-item>
      <el-menu-item index="tags">标签管理</el-menu-item>
    </el-menu>

    <el-button
      type="warning"
      @click="handleLogout"
      style="
        background-color: #ffb74d;
        border: none;
        color: #fff;
        margin-left: 16px;
      "
    >
      退出
    </el-button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: "upload" },
});

const emit = defineEmits(["update:modelValue", "logout"]);

const handleMenuSelect = (index) => {
  emit("update:modelValue", index);
};

const handleLogout = () => {
  // 只通知父组件去做真正的 logout（比如调用后端、清理 token）
  emit("logout");
};
</script>
