<!-- src/components/LogQuery.vue -->
<template>
  <div class="log-query p-4">
    <el-form :inline="true" class="filters" label-width="0">
      <el-form-item>
        <el-select v-model="level" placeholder="全部级别" style="width: 150px">
          <el-option label="Verbose" value="Verbose" />
          <el-option label="Debug" value="Debug" />
          <el-option label="Information" value="Information" />
          <el-option label="Warning" value="Warning" />
          <el-option label="Error" value="Error" />
          <el-option label="Fatal" value="Fatal" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-input
          v-model="messageKeyword"
          placeholder="消息关键字"
          style="width: 220px"
        />
      </el-form-item>

      <!-- 动态属性过滤行 -->
      <el-form-item>
        <div style="display: flex; flex-direction: column; gap: 6px">
          <div
            v-for="(row, idx) in propertyFilterList"
            :key="idx"
            style="display: flex; gap: 6px; align-items: center"
          >
            <el-input
              v-model="row.key"
              placeholder="属性名"
              style="width: 160px"
            />
            <el-input
              v-model="row.value"
              placeholder="值"
              style="width: 160px"
            />
            <el-button type="text" @click="removeFilter(idx)">删除</el-button>
          </div>

          <div>
            <el-button type="text" @click="addFilter">+ 添加属性过滤</el-button>
          </div>
        </div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="applyFilters">查询</el-button>
        <el-button @click="clearFilters" style="margin-left: 8px"
          >清空</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <log-table
      :logs="logs"
      :current-page="currentPage"
      :page-size="pageSize"
      :total-count="totalCount"
      :loading="loading"
      @page-change="onPageChange"
    />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import { useLogQuery } from "@/composables/useLogQuery";
import LogTable from "./LogTable.vue";

export default {
  name: "LogQuery",
  components: { LogTable },
  setup() {
    const {
      logs,
      currentPage,
      pageSize,
      totalCount,
      loading,
      level,
      messageKeyword,
      propertyFilters,
      fetchLogs,
      resetPageAndFetch,
      setPage,
    } = useLogQuery();

    // Local UI list for dynamic key/value rows
    const propertyFilterList = ref([{ key: "", value: "" }]);

    function addFilter() {
      propertyFilterList.value.push({ key: "", value: "" });
    }
    function removeFilter(idx) {
      propertyFilterList.value.splice(idx, 1);
      if (!propertyFilterList.value.length)
        propertyFilterList.value.push({ key: "", value: "" });
    }

    function applyFilters() {
      // copy rows to propertyFilters (clears first)
      propertyFilters.value = {};
      for (const r of propertyFilterList.value) {
        if (r.key && String(r.value).trim() !== "") {
          propertyFilters.value[r.key] = String(r.value);
        }
      }
      resetPageAndFetch();
    }

    function clearFilters() {
      propertyFilterList.value = [{ key: "", value: "" }];
      level.value = "";
      messageKeyword.value = "";
      propertyFilters.value = {};
      resetPageAndFetch();
    }

    function onPageChange(page) {
      setPage(page);
      fetchLogs();
    }

    onMounted(() => {
      // 默认拉一次
      fetchLogs();
    });

    return {
      logs,
      currentPage,
      pageSize,
      totalCount,
      loading,
      level,
      messageKeyword,
      propertyFilterList,
      addFilter,
      removeFilter,
      applyFilters,
      clearFilters,
      onPageChange,
    };
  },
};
</script>

<style scoped>
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: flex-start;
  margin-bottom: 12px;
}
</style>
