<template>
  <div
    v-loading="loading"
    class="material-repair material-layout"
    :element-loading-text="loadingText"
  >
    <div class="material-left-column">
      <section class="tool-card basic-card">
        <h2 class="tool-card-title">
          <el-icon class="title-icon"><Document /></el-icon>
          基础信息
        </h2>
        <el-form label-width="92px" hide-required-asterisk>
          <el-row :gutter="18">
            <el-col :span="6">
              <el-form-item label="填写日期">
                <el-date-picker v-model="form.fillDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="检修日期">
                <el-date-picker v-model="form.repairDate" type="date" value-format="YYYY-MM-DD" format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="开始时间">
                <el-time-select v-model="form.beginTime" start="00:00" step="00:30" end="23:30" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="结束时间">
                <el-time-select v-model="form.endTime" start="00:00" step="00:30" end="23:30" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="新版本">
                <el-input v-model="form.version" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="旧版本">
                <el-input :model-value="fields.oldVis" readonly />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="检修路径">
                <div class="file-input-row">
                  <el-input v-model="form.repairPath" readonly placeholder="请选择物资检修路径" />
                  <button class="browse-button" type="button" @click="selectDirectory('repairPath')">浏览...</button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="24">
              <el-form-item label="检修内容">
                <el-input
                  v-model="form.content"
                  type="textarea"
                  :rows="5"
                  placeholder="请输入物资管控系统检修内容"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </section>

      <section class="tool-card fields-card">
        <h2 class="tool-card-title">
          <el-icon class="title-icon"><Setting /></el-icon>
          替换字段预览
        </h2>
        <el-table :data="fieldRows" border size="small" height="205">
          <el-table-column prop="name" label="字段" width="110" />
          <el-table-column prop="description" label="格式说明" min-width="190" />
          <el-table-column prop="value" label="替换值" min-width="180" show-overflow-tooltip />
        </el-table>
      </section>

      <ToolLogPanel :logs="logs" class="material-log-panel" @clear="clearLogs" />
    </div>

    <div class="material-right-column">
      <section class="tool-card output-preview-card">
        <h2 class="tool-card-title">
          <el-icon class="title-icon"><Folder /></el-icon>
          {{ outputPreview.root }}
        </h2>
        <div class="preview-list">
          <details class="preview-group" open>
            <summary class="preview-folder">
              <el-icon class="folder-icon"><Folder /></el-icon>
              <strong>{{ outputPreview.planFolder }}</strong>
            </summary>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.planFile)">
              <span class="file-badge excel-badge">X</span>
              <strong>{{ outputPreview.planFile }}</strong>
            </div>
          </details>

          <details class="preview-group" open>
            <summary class="preview-folder">
              <el-icon class="folder-icon"><Folder /></el-icon>
              <strong>{{ outputPreview.attachmentFolder }}</strong>
            </summary>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.applyFile)">
              <span class="file-badge word-badge">W</span>
              <strong>{{ outputPreview.applyFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.requirementFile)">
              <span class="file-badge word-badge">W</span>
              <strong>{{ outputPreview.requirementFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.interfaceFile)">
              <span class="file-badge excel-badge">X</span>
              <strong>{{ outputPreview.interfaceFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.caseFile)">
              <span class="file-badge excel-badge">X</span>
              <strong>{{ outputPreview.caseFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.scopeFile)">
              <span class="file-badge excel-badge">X</span>
              <strong>{{ outputPreview.scopeFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.commitmentFile)">
              <span class="file-badge image-badge">JPG</span>
              <strong>{{ outputPreview.commitmentFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.sqlFile)">
              <span class="file-badge sql-badge">SQL</span>
              <strong>{{ outputPreview.sqlFile }}</strong>
            </div>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.databaseConfig)">
              <el-icon class="folder-icon"><Folder /></el-icon>
              <strong>{{ outputPreview.databaseConfig }}</strong>
            </div>
          </details>

          <details class="preview-group" open>
            <summary class="preview-folder">
              <el-icon class="folder-icon"><Folder /></el-icon>
              <strong>{{ outputPreview.releaseFolder }}</strong>
            </summary>
            <div class="preview-file" @click.stop="openPreviewPath(previewPaths.workOrderFile)">
              <span class="file-badge word-badge">W</span>
              <strong>{{ outputPreview.workOrderFile }}</strong>
            </div>
          </details>
        </div>
      </section>

      <div class="material-actions">
        <button class="tool-action-button tool-action-sunset" :disabled="loading" @click="generate">
          <el-icon><DocumentAdd /></el-icon>{{ generating ? '生成中...' : '生成物资检修材料' }}
        </button>
        <button class="tool-action-button tool-action-green" :disabled="loading" @click="saveSettings">
          <el-icon><Check /></el-icon>保存配置
        </button>
        <button class="tool-action-button tool-action-mix" :disabled="loading" @click="openOutput">
          <el-icon><FolderOpened /></el-icon>打开输出目录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Check, Document, DocumentAdd, Folder, FolderOpened, Setting } from '@element-plus/icons-vue';
import ToolLogPanel from '../common/ToolLogPanel.vue';
import { useToolLoading } from '../../../composables/useToolLoading';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const SETTINGS_VERSION = 2;

const nextFriday = () => {
  const date = new Date();
  const daysSinceMonday = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() + (7 - daysSinceMonday) + 4);
  return date;
};

const form = reactive({
  fillDate: formatDate(new Date()),
  repairDate: formatDate(nextFriday()),
  beginTime: '16:00',
  endTime: '18:00',
  version: 'V1.2.15',
  content: '',
  repairPath: 'E:\\工作区\\苏星\\检修',
});
const logs = ref([]);
const generating = ref(false);
const lastOutputPath = ref('');
const { loading, loadingText, runWithLoading } = useToolLoading();

const compact = (value) => String(value || '').replaceAll('-', '');
const chinese = (value) => {
  const [year, month, day] = String(value || '').split('-');
  return year && month && day ? `${year}年${month}月${day}日` : '';
};
const oldVersion = (version) => {
  const match = String(version || '').match(/^V(\d+)\.(\d+)\.(\d+)$/i);
  return match && Number(match[3]) > 0 ? `V${match[1]}.${match[2]}.${Number(match[3]) - 1}` : '';
};

const fields = computed(() => ({
  fillDate: compact(form.fillDate),
  fillDateZ: chinese(form.fillDate),
  repairDate: compact(form.repairDate),
  repairDateZ: chinese(form.repairDate),
  repairDateY: String(form.repairDate || '').replaceAll('-', '/'),
  beginTime: form.beginTime,
  endTime: form.endTime,
  oldVis: oldVersion(form.version),
  version: form.version,
  content: form.content,
}));

const outputPreview = computed(() => ({
  root: `${fields.value.fillDate}_物资管控系统-检修`,
  planFolder: '检修计划材料',
  planFile: `8、物资管控系统_互联网托管区检修计划_${fields.value.fillDate}.xlsx`,
  attachmentFolder: `${fields.value.fillDate}_物资管控系统-公司安全测试所需附件`,
  databaseConfig: '数据库配置',
  applyFile: `1、物资管控系统_安全测试申请表${fields.value.version}_${fields.value.fillDate}.doc`,
  requirementFile: `2、物资管控系统_需求文档${fields.value.version}_${fields.value.fillDate}.docx`,
  interfaceFile: `3、物资管控系统_接口设计${fields.value.version}_${fields.value.fillDate}.xlsx`,
  caseFile: `4、物资管控系统_测试案例${fields.value.version}_${fields.value.fillDate}.xlsx`,
  scopeFile: `5、物资管控系统_测试范围${fields.value.version}_${fields.value.fillDate}.xls`,
  commitmentFile: '6、安全承诺书.jpg',
  sqlFile: `update${fields.value.repairDate}00(检修).sql`,
  releaseFolder: '正式环境发包材料（检修单、脚本文件）',
  workOrderFile: `7、物资管控系统_检修工单${fields.value.version}_${fields.value.fillDate}.docx`,
}));

const outputPath = computed(() => (form.repairPath ? `${form.repairPath}\\${outputPreview.value.root}` : ''));

const previewPaths = computed(() => {
  const root = outputPath.value;
  const planDir = `${root}\\${outputPreview.value.planFolder}`;
  const attachmentDir = `${root}\\${outputPreview.value.attachmentFolder}`;
  const releaseDir = `${root}\\${outputPreview.value.releaseFolder}`;
  return {
    planFile: `${planDir}\\${outputPreview.value.planFile}`,
    databaseConfig: `${attachmentDir}\\${outputPreview.value.databaseConfig}`,
    commitmentFile: `${attachmentDir}\\${outputPreview.value.commitmentFile}`,
    interfaceFile: `${attachmentDir}\\${outputPreview.value.interfaceFile}`,
    caseFile: `${attachmentDir}\\${outputPreview.value.caseFile}`,
    scopeFile: `${attachmentDir}\\${outputPreview.value.scopeFile}`,
    sqlFile: `${attachmentDir}\\${outputPreview.value.sqlFile}`,
    applyFile: `${attachmentDir}\\${outputPreview.value.applyFile}`,
    requirementFile: `${attachmentDir}\\${outputPreview.value.requirementFile}`,
    workOrderFile: `${releaseDir}\\${outputPreview.value.workOrderFile}`,
  };
});

const fieldRows = computed(() => [
  { name: 'fillDate', description: '填写日期 YYYYMMDD', value: fields.value.fillDate },
  { name: 'fillDateZ', description: '填写日期 YYYY年MM月DD日', value: fields.value.fillDateZ },
  { name: 'repairDate', description: '检修日期 YYYYMMDD', value: fields.value.repairDate },
  { name: 'repairDateZ', description: '检修日期 YYYY年MM月DD日', value: fields.value.repairDateZ },
  { name: 'repairDateY', description: '检修日期 YYYY/MM/DD', value: fields.value.repairDateY },
  { name: 'beginTime', description: '检修开始时间 HH:mm', value: fields.value.beginTime },
  { name: 'endTime', description: '检修结束时间 HH:mm', value: fields.value.endTime },
  { name: 'oldVis', description: '旧版本', value: fields.value.oldVis },
  { name: 'version', description: '新版本', value: fields.value.version },
  { name: 'content', description: '检修内容', value: fields.value.content },
]);

const appendLogs = (items = []) => {
  logs.value.push(...items);
};
const clearLogs = () => {
  logs.value = [];
};
const selectDirectory = async (field) => {
  const selected = await window.electronAPI?.selectDirectory?.(form[field]);
  if (selected) form[field] = selected;
};
const buildSettingsPayload = () => ({
  versionTag: SETTINGS_VERSION,
  fillDate: form.fillDate,
  repairDate: form.repairDate,
  beginTime: form.beginTime,
  endTime: form.endTime,
  version: form.version,
  content: form.content,
  repairPath: form.repairPath,
});
const saveSettings = async () => {
  await runWithLoading('正在保存配置...', async () => {
    const result = await window.electronAPI?.saveMaterialRepairSettings?.(buildSettingsPayload());
    if (!result) return ElMessage.error('保存配置失败');
    ElMessage.success('物资检修配置已保存');
  });
};
const saveSettingsSilently = async () => {
  await window.electronAPI?.saveMaterialRepairSettings?.(buildSettingsPayload());
};
const validate = () => {
  if (!form.fillDate || !form.repairDate || !form.beginTime || !form.endTime) return '请填写完整日期和时间';
  if (!fields.value.oldVis) return '新版本格式必须为 Vx.x.x，且最后一段大于 0';
  if (!form.content.trim()) return '请输入检修内容';
  if (!form.repairPath) return '请选择检修路径';
  return '';
};
const generate = async () => {
  const error = validate();
  if (error) return ElMessage.warning(error);
  logs.value = [];
  await runWithLoading('正在生成物资检修材料...', async () => {
    generating.value = true;
    const result = await window.electronAPI?.generateMaterialRepair?.({ ...form });
    if (result?.canceled) return;
    if (!result?.success) return ElMessage.error(result?.error || '生成失败');
    lastOutputPath.value = result.outputPath;
    if (result.repairPath) form.repairPath = result.repairPath;
    await saveSettingsSilently();
    ElMessage.success('物资检修材料生成完成');
    generating.value = false;
  }).finally(() => {
    generating.value = false;
  });
};
const openOutput = async () => {
  await runWithLoading('正在打开输出目录...', async () => {
    const result = await window.electronAPI?.openMaterialRepairOutput?.(lastOutputPath.value || outputPath.value);
    if (!result?.success) ElMessage.error(result?.error || '输出目录不存在');
  });
};
const openPreviewPath = async (targetPath) => {
  await window.electronAPI?.openMaterialRepairOutput?.(targetPath);
};

onMounted(async () => {
  window.electronAPI?.removeMaterialRepairLogListeners?.();
  window.electronAPI?.onMaterialRepairLog?.((log) => {
    logs.value.push(log);
  });
  const settings = await window.electronAPI?.getMaterialRepairSettings?.();
  if (settings?.fillDate) form.fillDate = settings.fillDate;
  if (settings?.versionTag === SETTINGS_VERSION && settings?.repairDate) {
    form.repairDate = settings.repairDate;
  }
  if (settings?.beginTime) form.beginTime = settings.beginTime;
  if (settings?.endTime) form.endTime = settings.endTime;
  if (settings?.version) form.version = settings.version;
  if (settings?.content) form.content = settings.content;
  if (settings?.repairPath) form.repairPath = settings.repairPath;
});

onUnmounted(() => {
  window.electronAPI?.removeMaterialRepairLogListeners?.();
});
</script>

<style scoped lang="scss">
.material-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(410px, 0.9fr);
  gap: var(--tool-gap-lg);
  align-items: stretch;
  min-height: calc(100vh - 40px);
}

.material-left-column,
.material-right-column {
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  gap: var(--tool-gap-lg);
}

.basic-card,
.output-preview-card,
.fields-card {
  min-width: 0;
}

.fields-card {
  flex: 0 0 auto;
}

.output-preview-card {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.title-icon {
  color: var(--repair-title-icon-color, #5f72e8);
}

.file-input-row {
  display: flex;
  width: 100%;
  gap: 12px;

  :deep(.el-input) {
    min-width: 0;
    flex: 1;
  }
}

.browse-button {
  flex: 0 0 86px;
  border: 0;
  border-radius: 6px;
  color: #fff;
  background: #667eea;
  font-weight: 700;
  cursor: pointer;
}

.preview-list {
  display: grid;
  gap: 10px;
  min-height: 0;
  flex: 1;
  padding: 10px;
  align-content: start;
  border: 1px solid #d8deea;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.72);
  overflow: auto;
}

.preview-group {
  display: grid;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e2e7f0;
  border-radius: 8px;
  background: rgba(248, 250, 255, 0.78);

  summary {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 18px;
    align-items: center;
    gap: 8px;
    list-style: none;
    cursor: pointer;

    &::-webkit-details-marker {
      display: none;
    }

    &::after {
      content: '⌄';
      color: #6574e8;
      font-size: 16px;
      font-weight: 800;
      justify-self: end;
      transition: transform 0.2s ease;
    }
  }

  &:not([open]) summary::after {
    transform: rotate(-90deg);
  }
}

.preview-folder,
.preview-file {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 34px;
  color: #4b5563;
  font-size: 13px;

  strong {
    min-width: 0;
    color: #374151;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.preview-file {
  padding-left: 24px;
  grid-template-columns: 24px minmax(0, 1fr);
  border-radius: 6px;
  cursor: pointer;

  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
}

.folder-icon {
  color: #f2b32f;
  font-size: 20px;
}

.file-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  color: #fff;
  font-size: 11px;
  font-weight: 800;
}

.excel-badge {
  background: #35a867;
}

.sql-badge {
  background: #f59e0b;
  font-size: 9px;
}

.image-badge {
  background: #ec7c43;
  font-size: 9px;
}

.word-badge {
  background: #4f7fd9;
}

.bar-title::before {
  content: '';
  width: 4px;
  height: 22px;
  border-radius: 2px;
  background: #c4a7f3;
}

.material-log-panel {
  min-height: 0;
  flex: 1;
}

.material-actions {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  flex: 0 0 auto;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}

:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 700;
}

:deep(.el-loading-mask) {
  background-color: rgba(255, 255, 255, 0.42);
}

:deep(.el-date-editor.el-input),
:deep(.el-time-select) {
  width: 100%;
}

@media (max-width: 860px) {
  .material-layout {
    grid-template-columns: 1fr;
  }
}
</style>
