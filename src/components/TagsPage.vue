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
          <el-table-column prop="uploadTime" label="上传时间" />
          <el-table-column prop="uploader" label="上传者" />

          <!-- 新增标签列 -->
          <el-table-column label="标签">
            <template #default="{ row }">
              <span v-if="row.tags && row.tags.length">
                {{ row.tags.join(", ") }}
              </span>
              <span v-else>—</span>
            </template>
          </el-table-column>
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
import { ref, nextTick, onMounted, onActivated } from "vue";
import http from "@/plugins/axios";
import qs from "qs";
import { ElMessage } from "element-plus";

const allTags = ref([]);
const selectedTags = ref([]);
const files = ref([]);
const multipleTable = ref(null);
const selectedIds = ref([]);
const queryLoading = ref(false);
const currentPage = ref(1);
const pageSize = ref(10);
const totalCount = ref(0);
const tagMatchMode = ref("all");

function handleSelectionChange(selection) {
  selectedIds.value = selection.map((item) => item.id);
}

async function fetchAllTags() {
  try {
    const res = await http.get("/tags");
    allTags.value = Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error("fetchAllTags error:", err);
  }
}

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

    const res = await http.get("/filequery/query", {
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

defineExpose({
  fetchAllTags,
  fetchFilesByTagsPage,
});

// 页面首次加载
onMounted(async () => {
  await fetchAllTags();
  fetchFilesByTagsPage();
});

// 如果页面使用了 <keep-alive>，每次激活时也刷新
onActivated(async () => {
  await fetchAllTags();
  fetchFilesByTagsPage();
});
</script>

<style scoped>
.el-aside .el-card {
  height: 100%;
}
</style>
