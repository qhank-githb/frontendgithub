<template>
  <h3
    style="display: flex; align-items: center; justify-content: space-between"
  >
    <span>上传结果（最近 {{ uploadResults.length }} 条）</span>
  </h3>

  <el-table
    :data="props.uploadResults"
    style="width: 100%"
    border
    v-if="uploadResults.length > 0"
  >
    <el-table-column
      prop="originalFileName"
      label="文件名"
      show-overflow-tooltip
    />
    <el-table-column prop="tags" label="标签" />
    <!-- 1. 给文件大小列添加 formatter 函数 -->
    <el-table-column prop="size" label="文件大小" :formatter="formatSizeToMB" />
    <el-table-column
      prop="uploadtime"
      label="上传时间"
      :formatter="
        (row) => (row.uploadtime ? row.uploadtime.toLocaleString() : '')
      "
    />
  </el-table>
  <div v-else style="color: #999; padding: 12px 0">暂无上传记录</div>
</template>
<script setup>
const props = defineProps({
  uploadResults: {
    type: Array,
    default: () => [],
  },
});
// 2. 定义“字节转MB”的格式化函数
const formatSizeToMB = (row) => {
  // 1. 处理异常情况：size不存在/非数字/小于0时，显示“0 B”（更精准的默认值）
  const byteSize = Number(row.size); // 确保拿到数字类型的字节数
  if (isNaN(byteSize) || byteSize <= 0) {
    return "0 B";
  }

  // 2. 定义单位规则：从最小的B到GB，对应1024的幂次
  const unitRules = [
    { unit: "B", factor: 1 }, // 1B = 1字节
    { unit: "KB", factor: 1024 }, // 1KB = 1024B
    { unit: "MB", factor: 1024 * 1024 }, // 1MB = 1024KB
    { unit: "GB", factor: 1024 ** 3 }, // 1GB = 1024MB（1024^3 = 1073741824）
  ];

  // 3. 自动匹配最合适的单位（从大到小判断，优先显示大单位）
  let targetUnit = unitRules[0]; // 默认用B单位
  for (let i = unitRules.length - 1; i >= 0; i--) {
    const rule = unitRules[i];
    // 当字节数 >= 当前单位的换算因子时，选用该单位
    if (byteSize >= rule.factor) {
      targetUnit = rule;
      break;
    }
  }

  // 4. 计算换算后的值，并控制小数精度（避免过多小数位）
  const convertedSize = byteSize / targetUnit.factor;
  // 规则：数值<10保留2位小数（如2.45 KB），数值>=10保留1位小数（如12.5 MB）
  const decimalPlaces = convertedSize < 10 ? 2 : 1;

  // 5. 返回“数值+单位”的最终格式
  return `${convertedSize.toFixed(decimalPlaces)} ${targetUnit.unit}`;
};
</script>
