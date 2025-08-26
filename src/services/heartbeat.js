import axios from "axios";

let heartbeatInterval = null;

export function startHeartbeat(intervalMs = 10000) {
  if (heartbeatInterval) return;

  heartbeatInterval = setInterval(() => {
    axios
      .post("/api/heartbeat/ping")
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
