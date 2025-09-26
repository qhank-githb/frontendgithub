<!-- src/components/LogTable.vue -->
<template>
  <div class="log-table">
    <el-table
      :data="logs"
      stripe
      border
      style="width: 100%"
      v-loading="loading"
      element-loading-text="加载中..."
    >
      <el-table-column prop="timestamp" label="时间" width="180">
        <template #default="{ row }">
          {{ formatTimestamp(row.timestamp) }}
        </template>
      </el-table-column>

      <el-table-column prop="level" label="等级" width="120" />

      <el-table-column prop="message" label="消息" show-overflow-tooltip />

      <!-- 属性列：展示预览，tooltip 显示 JSON -->
      <el-table-column prop="properties" label="属性">
        <template #default="{ row }">
          <div v-if="hasProperties(row.properties)">
            <el-tooltip
              :content="formatProperties(row.properties)"
              placement="top-start"
            >
              <span class="ellipsis">{{
                formatPropertiesPreview(row.properties)
              }}</span>
            </el-tooltip>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页（使用 el-pagination） -->
    <div
      class="pagination-wrapper"
      style="
        margin-top: 12px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
      "
    >
      <el-pagination
        background
        layout="prev, pager, next, ->, total"
        :current-page="currentPage"
        :page-size="pageSize"
        :total="totalCount"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "LogTable",
  props: {
    logs: { type: Array, default: () => [] },
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    totalCount: { type: Number, default: 0 },
    loading: { type: Boolean, default: false },
  },
  emits: ["page-change"],
  methods: {
    getPropValue(value) {
      if (!value) return "-";
      if (typeof value === "object" && "Value" in value) {
        return value.Value;
      }
      return String(value);
    },

    formatTimestamp(value) {
      if (!value) return "";
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    },

    formatProperties(obj) {
      try {
        // 可选优化：简化 JSON 中的 Value 字段
        const simplified = JSON.parse(JSON.stringify(obj), (key, value) => {
          if (typeof value === "object" && "Value" in value) {
            return value.Value;
          }
          return value;
        });
        return JSON.stringify(simplified, null, 2);
      } catch {
        return String(obj);
      }
    },

    formatPropertiesPreview(obj) {
      try {
        const entries = Object.entries(obj || {});
        if (!entries.length) return "-";
        return (
          entries
            .slice(0, 3)
            .map(([k, v]) => `${k}:${this.getPropValue(v)}`) // 调用新方法
            .join(", ") + (entries.length > 3 ? "..." : "")
        );
      } catch {
        return "";
      }
    },

    isLong(text) {
      return text && text.length > 80;
    },
    hasProperties(obj) {
      return obj && Object.keys(obj).length > 0;
    },
    onPageChange(page) {
      this.$emit("page-change", page);
    },
  },
};
</script>

<style scoped>
.ellipsis {
  display: inline-block;
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
