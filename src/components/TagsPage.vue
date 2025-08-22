<template>
  <el-container style="height: 100vh; border: 1px solid #ebeef5">
    <!-- 左侧标签菜单 -->
    <el-aside
      width="200px"
      style="border-right: 1px solid #ebeef5; overflow-y: auto"
    >
      <el-card style="margin: 10px; padding: 10px">
        <h4>标签列表</h4>
        <el-scrollbar style="height: calc(100vh - 40px)">
          <el-checkbox-group
            v-model="selectedTags"
            @change="fetchFilesByTagsPage"
          >
            <el-checkbox
              v-for="tag in allTags"
              :key="tag.id"
              :label="tag.id"
              style="display: block; margin: 4px 0"
            >
              {{ tag.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-scrollbar>
      </el-card>
    </el-aside>

    <!-- 右侧文件表格 + 分页 -->
    <el-container>
      <el-main>
        <el-table
          ref="multipleTable"
          :data="files"
          style="width: 100%"
          border
          @selection-change="handleSelectionChange"
          :loading="queryLoading"
          row-key="id"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="originalFileName" label="文件名" />
          <el-table-column prop="bucketname" label="桶名" />
          <el-table-column prop="uploadTime" label="上传时间" />
          <el-table-column prop="uploader" label="上传者" />
        </el-table>

        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalCount"
          layout="prev, pager, next, jumper"
          @current-change="fetchFilesByTagsPage"
          style="margin-top: 10px; text-align: right"
        />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, nextTick, onMounted } from "vue";
import axios from "axios";
import qs from "qs";
import { ElMessage } from "element-plus";

const apiBase = "http://192.168.150.93:5000/api"; // 替换成你的接口前缀

// 标签 & 文件状态
const allTags = ref([]);
const selectedTags = ref([]);
const files = ref([]);
const multipleTable = ref(null);
const selectedIds = ref([]);
const queryLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const tagMatchMode = ref("all"); // "all" 或 "any"

// 表格多选
function handleSelectionChange(selection) {
  selectedIds.value = selection.map((item) => item.id);
}

// 获取标签列表
async function fetchAllTags() {
  try {
    const res = await axios.get(`${apiBase}/tags`);
    allTags.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("fetchAllTags error:", err);
  }
}

// 按标签查询文件（分页）
async function fetchFilesByTagsPage() {
  queryLoading.value = true;
  try {
    const params = {
      bucket: "my-bucket",
      pageNumber: currentPage.value,
      pageSize: pageSize.value,
    };

    if (selectedTags.value.length > 0) {
      params.tags = [...selectedTags.value];
      params.matchAllTags = tagMatchMode.value === "all";
    }

    const res = await axios.get(`${apiBase}/filequery/query`, {
      params,
      headers: { Accept: "application/json" },
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: "repeat" }),
    });

    const data = res.data ?? {};
    files.value = data.items ?? [];
    totalCount.value = data.totalCount ?? files.value.length;

    await nextTick();
    multipleTable.value?.clearSelection?.();

    // 恢复已选中行
    selectedIds.value.forEach((id) => {
      const row = files.value.find((f) => f.id === id);
      if (row) multipleTable.value?.toggleRowSelection?.(row, true);
    });
  } catch (err) {
    console.error("fetchFilesByTagsPage error:", err);
    ElMessage.error("按标签分页查询文件失败，请检查接口或网络");
  } finally {
    queryLoading.value = false;
  }
}

// 页面初始化
onMounted(async () => {
  await fetchAllTags();
  fetchFilesByTagsPage();
});
</script>

<style scoped>
.el-aside .el-card {
  height: 100%;
}
</style>
