<template>
  <div class="stagehand-component">
    <button :disabled="loading" @click="handleSend">
      {{ loading ? "执行中..." : "发送" }}
    </button>
    <span class="result" v-if="message">{{ message }}</span>
  </div>
</template>

<script setup>
import { ref } from "vue";

const loading = ref(false);
const message = ref("");

async function handleSend() {
  if (!window.electronAPI?.stagehandSearch) {
    message.value = "当前不是 Electron 环境，无法调用 Node 侧 Stagehand";
    return;
  }

  loading.value = true;
  message.value = "";
  try {
    const result = await window.electronAPI.stagehandSearch("Stagehand");
    message.value = result?.success ? "执行成功：已打开百度并触发搜索" : `执行失败：${result?.error || "未知错误"}`;
  } catch (error) {
    message.value = `执行失败：${error?.message || "未知错误"}`;
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.stagehand-component {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}
button {
  padding: 6px 18px;
  font-size: 16px;
  cursor: pointer;
}
.result {
  font-size: 14px;
  color: #333;
}
</style>
