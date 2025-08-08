import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  server: {
    host: "0.0.0.0", // 监听所有网卡地址，允许局域网访问
    port: 3000, // 你想要的端口，可以修改
  },

  plugins: [vue()],
});
