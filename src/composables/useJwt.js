// src/composables/useJwt.js
import { ref, onMounted } from "vue";
import { jwtDecode } from "jwt-decode";
import { ElMessage } from "element-plus";

// ---- 全局单例响应式变量 ----
const token = ref("");
const currentUsername = ref("");
const currentRole = ref("");
const isTokenValid = ref(false);

function parseToken() {
  try {
    token.value = localStorage.getItem("jwt_token") || "";
    if (!token.value) {
      isTokenValid.value = false;
      return;
    }

    const decodedToken = jwtDecode(token.value);
    const currentTime = Date.now() / 1000;

    // 检查过期
    if (decodedToken.exp && decodedToken.exp < currentTime) {
      token.value = "";
      currentUsername.value = "";
      currentRole.value = "";
      isTokenValid.value = false;
      localStorage.removeItem("jwt_token");
      ElMessage.error("登录已过期，请重新登录");
      return;
    }

    // 提取用户名和角色
    const usernameField =
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    const roleField =
      "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

    currentUsername.value = decodedToken[usernameField] || "";
    currentRole.value = decodedToken[roleField] || "";
    isTokenValid.value = !!currentUsername.value && !!currentRole.value;
  } catch (e) {
    console.error("JWT解析失败:", e);
    token.value = "";
    currentUsername.value = "";
    currentRole.value = "";
    isTokenValid.value = false;
  }
}

export function useJwt() {
  // 组件挂载时自动解析一次
  onMounted(parseToken);

  return {
    token,
    currentUsername,
    currentRole,
    isTokenValid,
    parseToken,
  };
}
