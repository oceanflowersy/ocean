<template>
  <section class="tool-card shared-log-card">
    <div class="shared-log-header">
      <div class="shared-log-title">
        <h2 class="tool-card-title bar-title">{{ activeMode === 'aes' ? aesTitle : title }}</h2>
        <div v-if="showAes" class="shared-log-tabs">
          <button :class="{ active: activeMode === 'log' }" type="button" @click="setMode('log')">日志</button>
          <button :class="{ active: activeMode === 'aes' }" type="button" @click="setMode('aes')">AES</button>
        </div>
      </div>
      <div class="shared-log-actions">
        <slot v-if="activeMode === 'log'" name="log-actions">
          <button class="shared-log-button danger" type="button" @click="$emit('clear')">清空</button>
        </slot>
        <slot v-else name="aes-actions">
          <button class="shared-log-button success" type="button" @click="copyCryptoResult">复制结果</button>
          <button class="shared-log-button danger" type="button" @click="clearCryptoTool">清空</button>
        </slot>
      </div>
    </div>

    <div v-if="activeMode === 'log'" ref="logContainer" class="tool-log shared-log-body">
      <div
        v-for="(log, index) in logs"
        :key="index"
        :class="['shared-log-line', `level-${logLevel(log)}`]"
      >
        {{ formatLog(log) }}
      </div>
    </div>
    <slot v-else name="aes">
      <div class="shared-crypto-tool">
        <div class="shared-crypto-field">
          <label>输入</label>
          <textarea
            v-model="cryptoInput"
            placeholder="输入明文进行加密，或输入 Base64 密文进行解密"
          ></textarea>
        </div>
        <div class="shared-crypto-actions">
          <button class="primary" type="button" @click="runAesEncrypt">加密</button>
          <button class="teal" type="button" @click="runAesDecrypt">解密</button>
          <button class="purple" type="button" @click="runSqlDecryptText">SQL解密</button>
          <span v-if="cryptoStatus" :class="['shared-crypto-status', cryptoStatus.type]">
            {{ cryptoStatus.message }}
          </span>
        </div>
        <div class="shared-sql-file">
          <div class="shared-sql-file-row">
            <input v-model="sqlDecryptFileForm.sourcePath" readonly placeholder="选择加密 SQL 文件" />
            <button type="button" @click="selectSqlDecryptSource">选择文件</button>
          </div>
          <div class="shared-sql-file-row">
            <input v-model="sqlDecryptFileForm.outputPath" readonly placeholder="选择解密后 SQL 输出位置" />
            <button type="button" @click="selectSqlDecryptOutput">输出位置</button>
          </div>
          <button class="shared-sql-file-submit" type="button" @click="runSqlDecryptFile">解密文件</button>
        </div>
        <div class="shared-crypto-field shared-crypto-output-field">
          <label>结果</label>
          <textarea
            v-model="cryptoOutput"
            readonly
            placeholder="加密或解密结果会显示在这里"
          ></textarea>
        </div>
      </div>
    </slot>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue';

const props = defineProps({
  logs: { type: Array, default: () => [] },
  title: { type: String, default: '日志输出' },
  aesTitle: { type: String, default: 'AES 加解密' },
  showAes: { type: Boolean, default: true },
  mode: { type: String, default: 'log' },
});

const emit = defineEmits(['clear', 'update:mode']);

const logContainer = ref(null);
const localMode = ref(props.mode);
const cryptoInput = ref('');
const cryptoOutput = ref('');
const cryptoStatus = ref(null);
const sqlDecryptFileForm = ref({ sourcePath: '', outputPath: '' });

const activeMode = computed(() => localMode.value);

const setMode = (mode) => {
  localMode.value = mode;
  emit('update:mode', mode);
};

const logLevel = (log) => String(log?.level || log?.type || 'info').toLowerCase();
const formatLog = (log) => {
  if (typeof log === 'string') return log;
  const message = log?.message || '';
  return log?.timestamp ? `[${log.timestamp}] ${message}` : message;
};
const setCryptoStatus = (type, message) => {
  cryptoStatus.value = { type, message };
  setTimeout(() => {
    cryptoStatus.value = null;
  }, 2500);
};

const runAesEncrypt = async () => {
  if (!window.electronAPI?.aesEncrypt) return setCryptoStatus('error', 'AES 功能不可用');
  cryptoOutput.value = await window.electronAPI.aesEncrypt(cryptoInput.value);
  setCryptoStatus('success', cryptoOutput.value ? '加密完成' : '输入为空');
};

const runAesDecrypt = async () => {
  if (!window.electronAPI?.aesDecrypt) return setCryptoStatus('error', 'AES 功能不可用');
  cryptoOutput.value = await window.electronAPI.aesDecrypt(cryptoInput.value);
  setCryptoStatus(cryptoOutput.value ? 'success' : 'warning', cryptoOutput.value ? '解密完成' : '解密失败或输入无效');
};

const runSqlDecryptText = async () => {
  if (!window.electronAPI?.sqlDecryptText) return setCryptoStatus('error', 'SQL 解密功能不可用');
  if (!cryptoInput.value.trim()) return setCryptoStatus('warning', '请输入需要解密的 SQL 密文');

  const result = await window.electronAPI.sqlDecryptText(cryptoInput.value);
  if (result?.success) {
    cryptoOutput.value = result.text || '';
    setCryptoStatus(cryptoOutput.value ? 'success' : 'warning', cryptoOutput.value ? 'SQL 解密完成' : '没有可解密内容');
  } else {
    cryptoOutput.value = '';
    setCryptoStatus('error', result?.error || 'SQL 解密失败');
  }
};

const selectSqlDecryptSource = async () => {
  const result = await window.electronAPI?.selectSqlDecryptSource?.();
  if (!result) return;
  sqlDecryptFileForm.value = result;
  setCryptoStatus('success', '已选择 SQL 文件');
};

const selectSqlDecryptOutput = async () => {
  const outputPath = await window.electronAPI?.selectSqlDecryptOutput?.(sqlDecryptFileForm.value.outputPath);
  if (outputPath) sqlDecryptFileForm.value.outputPath = outputPath;
};

const runSqlDecryptFile = async () => {
  if (!window.electronAPI?.sqlDecryptFile) return setCryptoStatus('error', 'SQL 文件解密功能不可用');
  if (!sqlDecryptFileForm.value.sourcePath) return setCryptoStatus('warning', '请先选择加密 SQL 文件');

  const result = await window.electronAPI.sqlDecryptFile({ ...sqlDecryptFileForm.value });
  if (result?.success) {
    sqlDecryptFileForm.value.outputPath = result.outputPath;
    cryptoOutput.value = result.outputPath;
    setCryptoStatus('success', `SQL 文件解密完成，共 ${result.count || 0} 行`);
  } else {
    setCryptoStatus('error', result?.error || 'SQL 文件解密失败');
  }
};

const copyCryptoResult = async () => {
  if (!cryptoOutput.value) return setCryptoStatus('warning', '没有可复制的结果');
  try {
    await navigator.clipboard.writeText(cryptoOutput.value);
    setCryptoStatus('success', '已复制');
  } catch {
    setCryptoStatus('error', '复制失败，请手动复制');
  }
};

const clearCryptoTool = () => {
  cryptoInput.value = '';
  cryptoOutput.value = '';
  cryptoStatus.value = null;
  sqlDecryptFileForm.value = { sourcePath: '', outputPath: '' };
};

watch(
  () => props.mode,
  (mode) => {
    localMode.value = mode;
  },
);

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
  margin-bottom: 15px;
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

.shared-log-button {
  min-width: 56px;
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 4px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &.success {
    background: #4caf50;
  }

  &.danger {
    background: #ff6b6b;
  }
}

.shared-log-body {
  min-height: 0;
  flex: 1;
  overflow: auto;
}

.shared-log-line {
  padding: 3px 0;
  line-height: 1.65;
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

.shared-crypto-tool {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid #e4e7f2;
  border-radius: 8px;
  background: #f8f9fc;
}

.shared-crypto-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;

  label {
    color: #333;
    font-size: 13px;
    font-weight: 700;
  }

  textarea {
    width: 100%;
    min-height: 110px;
    resize: none;
    padding: 12px;
    border: 1px solid #d9ddeb;
    border-radius: 6px;
    background: white;
    color: #222;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    line-height: 1.5;
    box-sizing: border-box;
    outline: none;

    &:focus {
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.12);
    }
  }
}

.shared-crypto-output-field {
  flex: 1;

  textarea {
    flex: 1;
    min-height: 110px;
  }
}

.shared-crypto-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;

  button {
    padding: 8px 18px;
    border: none;
    border-radius: 6px;
    color: white;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .primary {
    background: #667eea;
  }

  .teal {
    background: #00a6a6;
  }

  .purple {
    background: #7c5cff;
  }
}

.shared-crypto-status {
  color: #666;
  font-size: 13px;
  font-weight: 600;

  &.success {
    color: #2e7d32;
  }

  &.warning {
    color: #f57c00;
  }

  &.error {
    color: #d32f2f;
  }
}

.shared-sql-file {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px dashed #d9ddeb;
  border-radius: 6px;
  background: #fff;
}

.shared-sql-file-row {
  display: flex;
  gap: 8px;

  input {
    min-width: 0;
    flex: 1;
    padding: 8px 10px;
    border: 1px solid #d9ddeb;
    border-radius: 6px;
    color: #222;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 12px;
    outline: none;
  }

  button {
    flex: 0 0 78px;
    border: none;
    border-radius: 6px;
    color: #fff;
    background: #667eea;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
  }
}

.shared-sql-file-submit {
  height: 32px;
  border: none;
  border-radius: 6px;
  color: #fff;
  background: #7c5cff;
  font-weight: 700;
  cursor: pointer;
}
</style>
