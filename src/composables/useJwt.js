import { ref, onMounted } from "vue";
import { jwtDecode } from "jwt-decode";
import { ElMessage } from "element-plus";

const token = ref("");
const currentUsername = ref("");
const currentRole = ref("");
const isTokenValid = ref(false);

function parseToken() {
  try {
    token.value = localStorage.getItem("jwt_token") || "";
    if (!token.value) {
      isTokenValid.value = false;
      currentUsername.value = "";
      currentRole.value = "";
      return;
    }

    const decodedToken = jwtDecode(token.value); // ⚡命名导出
    const currentTime = Date.now() / 1000;

    if (decodedToken.exp && decodedToken.exp < currentTime) {
      token.value = "";
      currentUsername.value = "";
      currentRole.value = "";
      isTokenValid.value = false;
      localStorage.removeItem("jwt_token");
      ElMessage.error("登录已过期，请重新登录");
      return;
    }

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
  onMounted(parseToken);
  return { token, currentUsername, currentRole, isTokenValid, parseToken };
}
