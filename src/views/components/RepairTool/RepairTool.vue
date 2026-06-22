<template>
  <div class="repair-tool tool-page">
    <div class="repair-switch">
      <button
        :class="['switch-button', 'tool-action-button', 'tool-action-green', { active: activeModule === 'cashier' }]"
        @click="activeModule = 'cashier'"
      >
        🔧 收银检修
      </button>
      <button
        :class="['switch-button', 'tool-action-button', 'tool-action-pink', { active: activeModule === 'material' }]"
        @click="activeModule = 'material'"
      >
        📦 物资检修
      </button>
    </div>

    <template v-if="activeModule === 'cashier'">
      <el-form
        ref="repairFormRef"
        :model="form"
        :rules="rules"
        hide-required-asterisk
        class="repair-form"
      >
        <div class="repair-first-row">
          <section class="tool-card info-card">
            <h2 class="tool-card-title">
              <el-icon class="title-icon"><Tickets /></el-icon>
              检修信息
            </h2>
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="工单版本" prop="version">
                  <el-input v-model="form.version" placeholder="V1.0.20" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="填写日期" prop="fillDate">
                  <el-date-picker
                    v-model="form.fillDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    format="YYYY-MM-DD"
                    placeholder="选择填写日期"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="检修日期" prop="repairDate">
                  <el-date-picker
                    v-model="form.repairDate"
                    type="date"
                    value-format="YYYY-MM-DD"
                    format="YYYY-MM-DD"
                    placeholder="选择检修日期"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="开始时间" prop="startTime">
                  <el-time-select
                    v-model="form.startTime"
                    start="00:00"
                    step="00:30"
                    end="23:30"
                    placeholder="开始时间"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="结束时间" prop="endTime">
                  <el-time-select
                    v-model="form.endTime"
                    start="00:00"
                    step="00:30"
                    end="23:30"
                    placeholder="结束时间"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </section>

          <section class="tool-card preview-card">
            <h2 class="tool-card-title">
              <el-icon class="title-icon"><View /></el-icon>
              生成预览
            </h2>
            <div class="preview-list">
              <div class="preview-item">
                <el-icon class="preview-icon"><FolderOpened /></el-icon>
                <div><label>文件夹</label><strong>{{ preview.folderName }}</strong></div>
              </div>
              <div class="preview-item">
                <el-icon class="preview-icon"><Document /></el-icon>
                <div><label>工单</label><strong>{{ preview.workOrderFileName }}</strong></div>
              </div>
              <div class="preview-item">
                <el-icon class="preview-icon"><Coin /></el-icon>
                <div><label>SQL</label><strong>{{ preview.sqlFileName }}</strong></div>
              </div>
            </div>
          </section>
        </div>

        <section class="tool-card content-card">
          <h2 class="tool-card-title bar-title">检修内容</h2>
            <el-input
              v-model="form.formalContent"
              type="textarea"
              :rows="5"
              resize="none"
              clearable
              placeholder="输入正式检修内容"
            />
        </section>

        <div class="repair-second-row">
          <div class="settings-column">
            <section class="tool-card settings-card">
              <h2 class="tool-card-title">
                <el-icon class="title-icon"><Setting /></el-icon>
                文件生成设置
              </h2>
              <el-row :gutter="16">
                <el-col :span="24">
                  <el-form-item label="输出目录" prop="outputRoot">
                    <div class="file-input-row">
                      <el-input v-model="form.outputRoot" readonly placeholder="请选择输出根目录" />
                      <button type="button" class="browse-button" @click="selectOutputRoot">浏览...</button>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item
                    label="工单目录"
                    prop="workOrderOutputDir"
                  >
                    <div class="file-input-row">
                      <el-input
                        v-model="form.workOrderOutputDir"
                        readonly
                        placeholder="请选择检修工单生成目录"
                      />
                      <button
                        type="button"
                        class="browse-button"
                        @click="selectWorkOrderOutputDir"
                      >
                        浏览...
                      </button>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="工单模板" prop="workOrderTemplatePath">
                    <div class="file-input-row">
                      <el-input v-model="form.workOrderTemplatePath" readonly placeholder="请选择工单模板 docx" />
                      <button type="button" class="browse-button" @click="selectDocx('workOrderTemplatePath')">浏览...</button>
                    </div>
                  </el-form-item>
                </el-col>
                <el-col :span="24">
                  <el-form-item label="检修说明" prop="repairDocTemplatePath">
                    <div class="file-input-row">
                      <el-input v-model="form.repairDocTemplatePath" readonly placeholder="请选择检修说明 docx" />
                      <button type="button" class="browse-button" @click="selectDocx('repairDocTemplatePath')">浏览...</button>
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-checkbox-group v-model="selectedOutputs" class="output-checkboxes">
                <el-checkbox value="workOrder">生成工单 Word</el-checkbox>
                <el-checkbox value="folder">生成检修内容文件夹</el-checkbox>
                <el-checkbox value="repairDoc">复制检修说明.docx</el-checkbox>
                <el-checkbox value="sql">生成 SQL 空文件</el-checkbox>
              </el-checkbox-group>
            </section>

            <div class="action-row">
              <button class="repair-action-button tool-action-button tool-action-sunset" :disabled="generating" @click="generateMaterials">
                <el-icon><DocumentAdd /></el-icon>
                {{ generating ? '生成中...' : '生成检修材料' }}
              </button>
              <button class="repair-action-button tool-action-button tool-action-green" @click="openOutput">
                <el-icon><FolderOpened /></el-icon>
                打开输出目录
              </button>
              <button class="repair-action-button tool-action-button tool-action-mix" @click="saveRepairSettings">
                <el-icon><Check /></el-icon>
                保存配置
              </button>
            </div>
          </div>

          <section class="tool-card log-card">
            <div class="log-header">
              <h2 class="tool-card-title bar-title">日志输出</h2>
              <el-button type="danger" size="small" @click="clearLogs">清空</el-button>
            </div>
            <div ref="logContainer" class="tool-log">
              <div
                v-for="(log, index) in logs"
                :key="index"
                :class="['repair-log-line', `level-${log.level.toLowerCase()}`]"
              >
                [{{ log.timestamp }}] {{ log.message }}
              </div>
            </div>
          </section>
        </div>
      </el-form>
    </template>

    <section v-else class="tool-card material-placeholder">
      <h2 class="tool-card-title"><el-icon class="title-icon"><Box /></el-icon>物资检修</h2>
      <p>物资检修功能预留中。</p>
    </section>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import {
  Box,
  Check,
  Coin,
  Document,
  DocumentAdd,
  FolderOpened,
  Location,
  Setting,
  Tickets,
  View,
} from '@element-plus/icons-vue';

const CASHIER_PROFILE_NAME = '职工收银平台';
const DEFAULT_OUTPUT_ROOT = 'E:\\工作区\\收银系统\\运维\\服务器更新';
const activeModule = ref('cashier');
const repairFormRef = ref(null);
const cashierProfile = ref(null);
const generating = ref(false);
const logContainer = ref(null);
const logs = ref([]);
const selectedOutputs = ref(['workOrder', 'folder', 'repairDoc', 'sql']);

const getNextThursday = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = (4 - day + 7) % 7 || 7;
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toCompactDate = (dateText) => String(dateText || '').replaceAll('-', '');
const initialRepairDate = getNextThursday();
const initialFillDate = new Date(initialRepairDate);
initialFillDate.setDate(initialRepairDate.getDate() - 1);

const form = reactive({
  systemName: CASHIER_PROFILE_NAME,
  version: 'V1.0.20',
  fillDate: formatDate(initialFillDate),
  repairDate: formatDate(initialRepairDate),
  startTime: '09:00',
  endTime: '11:00',
  formalContent: '',
  outputRoot: DEFAULT_OUTPUT_ROOT,
  workOrderOutputDir: DEFAULT_OUTPUT_ROOT,
  workOrderTemplatePath: '',
  repairDocTemplatePath: '',
});

const rules = {
  version: [{ required: true, message: '请输入工单版本', trigger: 'blur' }],
  fillDate: [{ required: true, message: '请选择填写日期', trigger: 'change' }],
  repairDate: [{ required: true, message: '请选择检修日期', trigger: 'change' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  formalContent: [{ required: true, message: '请输入正式检修内容', trigger: 'blur' }],
  outputRoot: [{ required: true, message: '请选择输出目录', trigger: 'change' }],
  workOrderOutputDir: [{ required: true, message: '请选择检修工单生成目录', trigger: 'change' }],
  workOrderTemplatePath: [{ required: true, message: '请选择工单模板', trigger: 'change' }],
  repairDocTemplatePath: [{ required: true, message: '请选择检修说明模板', trigger: 'change' }],
};

const preview = computed(() => {
  const compact = toCompactDate(form.fillDate);
  const version = form.version || 'V1.0.20';
  const systemName = form.systemName || CASHIER_PROFILE_NAME;
  const folderName = `${compact}_${systemName}检修内容`;
  const workOrderFileName = `${systemName}_检修工单${version}_${compact}.docx`;
  const sqlFileName = `update${compact}00（检修）.sql`;
  const outputPath = form.outputRoot ? `${form.outputRoot}\\${folderName}` : '';
  return { folderName, workOrderFileName, sqlFileName, outputPath };
});

watch(
  () => form.repairDate,
  (value) => {
    if (!value) return;
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() - 1);
    form.fillDate = formatDate(date);
  },
);

watch(
  () => form.outputRoot,
  async (value) => {
    if (!value || !window.electronAPI?.getRepairNextVersion) return;
    const result = await window.electronAPI.getRepairNextVersion(value);
    if (result?.version) form.version = result.version;
  },
);

const addLog = (message, level = 'INFO') => {
  logs.value.push({ level, message, timestamp: new Date().toLocaleString() });
  nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
  });
};

const appendLogs = (items = []) => {
  logs.value.push(...items);
  nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight;
  });
};

const bindCashierProfile = async () => {
  if (!window.electronAPI?.listProfiles) return;
  try {
    const result = await window.electronAPI.listProfiles();
    const profile = result?.profiles?.find((item) => item.name === CASHIER_PROFILE_NAME);
    cashierProfile.value = profile || null;
    form.systemName = profile?.name || CASHIER_PROFILE_NAME;
    const savedSettings = profile?.repairSettings;
    if (savedSettings) {
      form.outputRoot = savedSettings.outputRoot || DEFAULT_OUTPUT_ROOT;
      form.workOrderOutputDir = savedSettings.workOrderOutputDir || DEFAULT_OUTPUT_ROOT;
      form.workOrderTemplatePath = savedSettings.workOrderTemplatePath || '';
      form.repairDocTemplatePath = savedSettings.repairDocTemplatePath || '';
      if (Array.isArray(savedSettings.selectedOutputs)) {
        selectedOutputs.value = [...savedSettings.selectedOutputs];
      }
    }
  } catch (error) {
    addLog(`读取项目列表失败: ${error.message}`, 'ERROR');
  }
};

const selectOutputRoot = async () => {
  const selected = await window.electronAPI?.selectDirectory?.(form.outputRoot);
  if (selected) form.outputRoot = selected;
};

const selectWorkOrderOutputDir = async () => {
  const selected = await window.electronAPI?.selectDirectory?.(form.workOrderOutputDir);
  if (selected) form.workOrderOutputDir = selected;
};

const selectDocx = async (field) => {
  const selected = await window.electronAPI?.selectDocxFile?.();
  if (selected) form[field] = selected;
};

const clearLogs = () => {
  logs.value = [];
};

const buildPayload = () => ({
  ...form,
  generateWorkOrder: selectedOutputs.value.includes('workOrder'),
  generateFolder: selectedOutputs.value.includes('folder'),
  copyRepairDoc: selectedOutputs.value.includes('repairDoc'),
  generateSql: selectedOutputs.value.includes('sql'),
  folderName: preview.value.folderName,
  workOrderFileName: preview.value.workOrderFileName,
  sqlFileName: preview.value.sqlFileName,
});

const generateMaterials = async () => {
  if (!window.electronAPI?.generateRepairMaterials) {
    addLog('当前环境不支持检修材料生成', 'ERROR');
    return;
  }

  try {
    await repairFormRef.value?.validate();
  } catch {
    addLog('请先完善必填信息', 'ERROR');
    return;
  }

  generating.value = true;
  try {
    const result = await window.electronAPI.generateRepairMaterials(buildPayload());
    appendLogs(result?.logs || []);
    if (result?.success) addLog('所有文件生成完成', 'SUCCESS');
    else if (!result?.canceled) addLog(result?.error || '生成失败', 'ERROR');
  } finally {
    generating.value = false;
  }
};

const openOutput = async () => {
  if (!preview.value.outputPath) {
    addLog('请先选择输出目录', 'ERROR');
    return;
  }
  const result = await window.electronAPI?.openRepairOutput?.(preview.value.outputPath);
  if (!result?.success) addLog(result?.error || '打开输出目录失败', 'ERROR');
};

const saveRepairSettings = async () => {
  if (!cashierProfile.value || !window.electronAPI?.updateProfile) {
    addLog(`未找到项目配置: ${CASHIER_PROFILE_NAME}`, 'ERROR');
    return;
  }

  try {
    const updatedProfile = await window.electronAPI.updateProfile({
      id: cashierProfile.value.id,
      repairSettings: {
        outputRoot: form.outputRoot,
        workOrderOutputDir: form.workOrderOutputDir,
        workOrderTemplatePath: form.workOrderTemplatePath,
        repairDocTemplatePath: form.repairDocTemplatePath,
        selectedOutputs: [...selectedOutputs.value],
      },
    });
    cashierProfile.value = updatedProfile;
    addLog('文件生成设置已保存', 'SUCCESS');
  } catch (error) {
    addLog(`保存配置失败: ${error.message}`, 'ERROR');
  }
};

onMounted(async () => {
  await bindCashierProfile();
  addLog(`已绑定项目: ${form.systemName}`);
});
</script>

<style scoped lang="scss">
.repair-tool {
  --repair-title-icon-color: #5f72e8;
  --repair-preview-icon-color: #6574e8;
  display: flex;
  flex-direction: column;
  gap: var(--tool-gap-lg);
}

.repair-switch {
  display: flex;
  justify-content: center;
  gap: 28px;
}

.switch-button {
  width: 240px;
  height: 46px;
  padding: 0 22px;
  opacity: 0.78;
  font-size: 17px;
  font-weight: 800;

  &.active {
    opacity: 1;
    outline: 2px solid rgba(255, 255, 255, 0.92);
    outline-offset: 2px;
    box-shadow: 0 5px 16px rgba(15, 23, 42, 0.2);
  }
}

.repair-form {
  display: flex;
  flex-direction: column;
  gap: var(--tool-gap-lg);
}

.repair-first-row,
.repair-second-row {
  display: grid;
  gap: var(--tool-gap-lg);
  align-items: stretch;
}

.repair-first-row {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}

.repair-second-row {
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
}

.tool-card-title {
  min-height: 24px;
}

.title-icon,
.preview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  line-height: 1;
}

.title-icon {
  color: var(--repair-title-icon-color);
}

.preview-icon {
  color: var(--repair-preview-icon-color);
}

.bar-title::before {
  content: '';
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: #c4a7f3;
}

.content-card :deep(.el-form-item:last-child),
.settings-card :deep(.el-form-item:last-child) {
  margin-bottom: 0;
}

.content-card :deep(.el-textarea__inner) {
  min-height: 132px !important;
  padding: 12px 14px;
  line-height: 1.7;
}

.preview-card {
  min-width: 0;
}

.preview-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.preview-item {
  display: flex;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px 4px;

  > div {
    display: flex;
    min-width: 0;
    flex: 1;
    align-items: center;
    gap: 8px;
  }

  label {
    min-width: 64px;
    color: var(--tool-muted);
    font-weight: 700;
  }

  strong {
    color: #6574e8;
    word-break: break-all;
  }
}

.output-preview {
  margin-top: 4px;
  padding: 10px 12px;
  border: 1px solid #dfe3eb;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.62);
}

.settings-column,
.log-card {
  display: flex;
  min-height: 410px;
  flex-direction: column;
}

.settings-card {
  flex: 1;

  :deep(.el-row) {
    row-gap: 4px;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
}

.file-input-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 12px;

  :deep(.el-input) {
    min-width: 0;
    flex: 1;
  }
}

.browse-button {
  height: 38px;
  flex: 0 0 86px;
  border: 0;
  border-radius: 6px;
  color: #fff;
  background: #667eea;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #5568d3;
    transform: translateY(-1px);
  }
}

.output-checkboxes {
  display: grid;
  width: 100%;
  grid-template-columns: repeat(4, max-content);
  justify-content: start;
  column-gap: 30px;
  row-gap: 8px;
  padding: 2px 4px 0;

  :deep(.el-checkbox) {
    margin-right: 0;
    font-size: 13px;
  }
}

.action-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 14px;

}

.repair-action-button {
  width: 100%;

  .el-icon {
    font-size: 19px;
  }
}

.log-card {
  overflow: hidden;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .tool-card-title {
    margin-bottom: 14px;
  }
}

.tool-log {
  flex: 1;
  min-height: 0;
}

.repair-log-line {
  white-space: pre-wrap;

  &.level-success { color: #4ade80; }
  &.level-error { color: #ff8a8a; }
}

.material-placeholder {
  min-height: 300px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 700;
}

:deep(.el-date-editor.el-input),
:deep(.el-time-select) {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 6px;
  box-shadow: 0 0 0 1px #d8dce6 inset;
}

@media (max-width: 760px) {
  .repair-first-row,
  .repair-second-row {
    grid-template-columns: 1fr;
  }

  .preview-list {
    grid-template-columns: 1fr;
  }

  .output-checkboxes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
