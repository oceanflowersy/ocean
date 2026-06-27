<template>
  <section class="tool-card shared-log-card">
    <div class="shared-log-header">
      <div class="shared-log-title">
        <h2 class="tool-card-title bar-title">{{ mode === 'aes' ? aesTitle : title }}</h2>
        <div v-if="showAes" class="shared-log-tabs">
          <button :class="{ active: mode === 'log' }" type="button" @click="$emit('update:mode', 'log')">日志</button>
          <button :class="{ active: mode === 'aes' }" type="button" @click="$emit('update:mode', 'aes')">AES</button>
        </div>
      </div>
      <div class="shared-log-actions">
        <slot v-if="mode === 'log'" name="log-actions">
          <el-button type="danger" size="small" @click="$emit('clear')">清空</el-button>
        </slot>
        <slot v-else name="aes-actions"></slot>
      </div>
    </div>

    <div v-if="mode === 'log'" ref="logContainer" class="tool-log shared-log-body">
      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="['shared-log-line', `level-${logLevel(log)}`]"
      >
        {{ formatLog(log) }}
      </div>
    </div>
    <slot v-else name="aes"></slot>
  </section>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';

const props = defineProps({
  logs: { type: Array, default: () => [] },
  title: { type: String, default: '日志输出' },
  aesTitle: { type: String, default: 'AES 加解密' },
  showAes: { type: Boolean, default: false },
  mode: { type: String, default: 'log' },
});

defineEmits(['clear', 'update:mode']);

const logContainer = ref(null);

const logLevel = (log) => String(log?.level || log?.type || 'info').toLowerCase();
const formatLog = (log) => {
  if (typeof log === 'string') return log;
  const message = log?.message || '';
  return log?.timestamp ? `[${log.timestamp}] ${message}` : message;
};

watch(
  () => props.logs.length,
  () => nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
  }),
);
</script>

<style scoped lang="scss">
.shared-log-card {
  display: flex;
  min-height: 300px;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.shared-log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.shared-log-title {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;

  .tool-card-title {
    margin-bottom: 0;
    white-space: nowrap;
  }
}

.shared-log-tabs {
  display: inline-flex;
  overflow: hidden;
  border: 1px solid #d7dcff;
  border-radius: 6px;

  button {
    min-width: 54px;
    height: 28px;
    border: 0;
    color: #6574e8;
    background: rgba(255, 255, 255, 0.72);
    font-weight: 700;
    cursor: pointer;

    &.active {
      color: #fff;
      background: #6574e8;
    }
  }
}

.shared-log-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}

.shared-log-body {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.shared-log-line {
  white-space: pre-wrap;

  &.level-success {
    color: #4ade80;
  }

  &.level-error {
    color: #ff8a8a;
  }

  &.level-warning,
  &.level-warn {
    color: #facc15;
  }
}
</style>
