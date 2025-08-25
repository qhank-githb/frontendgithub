import { ref } from "vue";
import { ElMessage } from "element-plus";
import { fileApi } from "@/api/fileService";

export function useFileEdit() {
  const fileList = ref([]);
  const allTags = ref([]);
  const editDialogVisible = ref(false);
  const editForm = ref({});

  function openEdit(row) {
    editForm.value = { ...row };
    editDialogVisible.value = true;
  }

  async function saveEdit() {
    try {
      await fileApi.updateFile(editForm.value);
      const idx = fileList.value.findIndex((f) => f.id === editForm.value.id);
      if (idx !== -1) fileList.value[idx] = { ...editForm.value };
      ElMessage.success("修改成功");
      editDialogVisible.value = false;
    } catch (err) {
      ElMessage.error("修改失败");
    }
  }

  return { fileList, allTags, editDialogVisible, editForm, openEdit, saveEdit };
}
