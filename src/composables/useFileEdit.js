import { ref } from "vue";
import { ElMessage } from "element-plus";
import { editFile } from "@/api/files";

export function useFileEdit(fileList) {
  const editDialogVisible = ref(false);
  const editForm = ref({ id: null, fileName: "", tags: [] });

  function openEdit(row) {
    editForm.value = {
      id: row.id,
      fileName: row.originalFileName,
      tags: [...row.tags],
    };
    editDialogVisible.value = true;
  }

  async function saveEdit(newForm) {
    try {
      await editFile({
        id: newForm.id,
        fileName: newForm.fileName,
        tags: newForm.tags,
      });

      const idx = fileList.value.findIndex((f) => f.id === newForm.id);
      if (idx !== -1) {
        fileList.value[idx].originalFileName = newForm.fileName;
        fileList.value[idx].tags = [...newForm.tags];
      }

      ElMessage.success("修改成功");
      editDialogVisible.value = false;
    } catch (err) {
      ElMessage.error(
        "修改失败：" + (err.response?.data?.message || err.message)
      );
    }
  }

  return { editDialogVisible, editForm, openEdit, saveEdit };
}
