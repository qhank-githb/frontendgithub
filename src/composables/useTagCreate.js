import axios from "axios";
import { ElMessage } from "element-plus";

/**
 * 创建新标签并同步到后端
 * @param {string} newTagName - 用户输入的新标签名
 * @param {Array} allTags - ref数组，保存所有可选标签
 * @param {Array} selectedTags - ref数组，保存已选标签
 */
export async function handleCreateTag(newTag) {
  const url = "http://192.168.150.93:5000/api/tags";
  if (!newTag?.trim()) throw new Error("标签名不能为空");

  try {
    // 方法 1: JSON 对象
    const res = await axios.post(url, { name: newTag });
    return res.data;
  } catch (err) {
    console.error("创建失败（JSON方式）", err.response?.data || err);
    try {
      // 方法 2: FormData
      const form = new FormData();
      form.append("name", newTag);
      const res2 = await axios.post(url, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res2.data;
    } catch (err2) {
      console.error("创建失败（FormData方式）", err2.response?.data || err2);
      // 方法 3: 原始 JSON 字符串
      const res3 = await axios.post(url, JSON.stringify(newTag), {
        headers: { "Content-Type": "application/json" },
      });
      return res3.data;
    }
  }
}
