import { ref, onMounted } from "vue";
import { jwtDecode } from "jwt-decode";
import { ElMessage } from "element-plus";

export function useJwt() {
  // 响应式变量
  const token = ref("");
  const currentUsername = ref("");
  const isTokenValid = ref(false); // token是否有效（存在且未过期）

  // 解析逻辑
  const parseToken = () => {
    try {
      token.value = localStorage.getItem("jwt_token") || "";
      if (!token.value) {
        isTokenValid.value = false;
        ElMessage.warning("未检测到登录状态");
        return;
      }

      const decodedToken = jwtDecode(token.value);
      const currentTime = Date.now() / 1000;

      // 检查过期
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        token.value = "";
        currentUsername.value = "";
        isTokenValid.value = false;
        localStorage.removeItem("jwt_token");
        ElMessage.error("登录已过期，请重新登录");
        return;
      }

      // 提取用户名（你的特殊字段）
      const usernameField =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
      currentUsername.value = decodedToken[usernameField] || "";
      isTokenValid.value = !!currentUsername.value;

      if (!currentUsername.value) {
        ElMessage.error("无法获取用户信息");
      }
    } catch (error) {
      console.error("JWT解析失败：", error);
      token.value = "";
      currentUsername.value = "";
      isTokenValid.value = false;
      ElMessage.error("用户信息解析失败");
    }
  };

  // 组件挂载时自动解析
  onMounted(parseToken);

  // 暴露给组件的方法和变量
  return {
    token,
    currentUsername,
    isTokenValid,
    parseToken, // 提供手动重新解析的方法（如登录后）
  };
}
