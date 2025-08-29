import http from "@/plugins/axios";

let heartbeatInterval = null;

export function startHeartbeat(intervalMs = 10000) {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(() => {
    http
      .post("/heartbeat/ping") // 使用相对路径
      .then(() => {
        console.log("Heartbeat sent");
      })
      .catch((err) => {
        console.warn("Heartbeat failed", err);
      });
  }, intervalMs);
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}
