<template>
  <div class="user-info" style="margin: auto; border: 1px dashe black">
    <h3>用户信息</h3>
    <p>用户名: {{ currentUsername || "未获取到" }}</p>
    <p>角色: {{ roleLabel || "未获取到" }}</p>
  </div>
</template>

<script setup>
import { useJwt } from "@/composables/useJwt";
import { computed } from "vue";

const { currentUsername, currentRole } = useJwt();

// 计算属性：根据角色值返回对应的中文标签
const roleLabel = computed(() => {
  switch (currentRole.value) {
    case "admin":
    case "Admin":
      return "管理员(admin)";
    case "user":
    case "User":
      return "普通用户(user)";
    default:
      return currentRole.value || "未知角色";
  }
});
</script>
<style scoped>
.user-info {
  border: 2px solid #333;
  border-radius: 8px; /* 圆角 */
  padding: 10px;
}
</style>
