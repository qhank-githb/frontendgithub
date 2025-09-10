import { ref, onMounted } from "vue";
import { jwtDecode } from "jwt-decode";
import { ElMessage } from "element-plus";

export function useJwt() {
  // 响应式变量
  const token = ref("");
  const currentUsername = ref("");
  const currentRole = ref(""); // 新增：存储用户角色
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
        currentRole.value = ""; // 新增：清空角色信息
        isTokenValid.value = false;
        localStorage.removeItem("jwt_token");
        ElMessage.error("登录已过期，请重新登录");
        return;
      }

      // 提取用户名
      const usernameField =
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
      currentUsername.value = decodedToken[usernameField] || "";

      // 新增：提取角色信息
      const roleField =
        "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
      currentRole.value = decodedToken[roleField] || "";

      // 验证有效性：同时检查用户名和角色是否存在
      isTokenValid.value = !!currentUsername.value && !!currentRole.value;

      if (!currentUsername.value) {
        ElMessage.error("无法获取用户信息");
      }

      if (!currentRole.value) {
        ElMessage.warning("无法获取用户角色信息");
      }
    } catch (error) {
      console.error("JWT解析失败：", error);
      token.value = "";
      currentUsername.value = "";
      currentRole.value = ""; // 新增：错误时清空角色
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
    currentRole,
    isTokenValid,
    parseToken, // 提供手动重新解析的方法（如登录后）
  };
}
