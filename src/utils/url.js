export function joinUrl(...parts) {
  return parts
    .map((p) => (p ? String(p).replace(/^\/+|\/+$/g, "") : ""))
    .filter(Boolean)
    .join("/");
}
