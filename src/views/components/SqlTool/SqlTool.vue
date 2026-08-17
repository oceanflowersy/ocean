<template>
  <div class="sql-tool tool-page tool-fill-page">
    <div class="sql-workspace tool-viewport-layout">
      <aside ref="connectionListRef" class="tool-card connection-list-card">
        <div class="panel-header">
          <h2 class="tool-card-title"><el-icon class="title-icon"><Connection /></el-icon>连接列表</h2>
          <button class="icon-button" title="新增连接" @click="openConnectionDialog()">+</button>
        </div>
        <div class="connection-list">
          <button
            v-for="connection in connections"
            :key="connection.id"
            :class="['connection-item', { active: connection.id === activeConnectionId }]"
            @click="selectConnection(connection.id)"
          >
            <span class="status-dot"></span>
            <span class="connection-copy">
              <strong>{{ connection.name }}</strong>
              <small>{{ connectionAddress(connection) }}</small>
            </span>
          </button>
          <div v-if="connections.length === 0" class="empty-connections">暂无连接配置</div>
        </div>
        <button class="test-button" :disabled="!activeConnection || testing" @click="testConnection">
          {{ testing ? '测试中...' : '测试连接' }}
        </button>
        <div class="connection-list-actions">
          <button :disabled="!activeConnection" @click="openConnectionDialog(activeConnection)">编辑</button>
          <button :disabled="!activeConnection" class="danger" @click="deleteConnection">删除</button>
        </div>
      </aside>

      <main class="sql-main tool-left-stack">
        <section class="tool-card operation-card">
          <h2 class="tool-card-title"><el-icon class="title-icon"><DataAnalysis /></el-icon>服务器 SQL 转换</h2>
          <el-form label-width="94px" hide-required-asterisk>
            <el-form-item label="原始 SQL">
              <div class="file-input-row">
                <el-input v-model="fileForm.sourcePath" readonly placeholder="请选择服务器导出的 SQL 文件" />
                <button class="browse-button" type="button" @click="selectSource">浏览...</button>
              </div>
            </el-form-item>
            <el-form-item label="输出 SQL">
              <div class="file-input-row">
                <el-input v-model="fileForm.outputPath" readonly placeholder="请选择转换后的 SQL 文件位置" />
                <button class="browse-button" type="button" @click="selectOutput">浏览...</button>
              </div>
            </el-form-item>
          </el-form>
          <div v-if="cleanProgress.visible" class="progress-box">
            <span>清洗进度</span>
            <el-progress :percentage="cleanProgress.percent" />
          </div>
        </section>

        <section class="tool-card convert-summary-card">
          <div class="file-summary">
            <div><el-icon><Document /></el-icon><span>输入文件</span><strong>{{ sourceFileName || '未选择' }}</strong></div>
            <div><el-icon><FolderOpened /></el-icon><span>输出文件</span><strong>{{ outputFileName || '未设置' }}</strong></div>
            <div><el-icon><Connection /></el-icon><span>当前连接</span><strong>{{ activeConnection?.name || '未选择' }}</strong></div>
          </div>
          <div v-if="syncProgress.visible" class="progress-box import-progress">
            <span>{{ syncProgress.label }}</span>
            <el-progress :percentage="syncProgress.percent" />
            <small>{{ syncProgress.detail }}</small>
          </div>
        </section>

        <section class="tool-card action-card">
          <div class="action-row tool-action-row">
            <button class="tool-action-button tool-action-sunset" :disabled="converting" @click="convertSql">
              <el-icon><RefreshRight /></el-icon>{{ converting ? '清洗中...' : '清洗 SQL' }}
            </button>
            <button class="tool-action-button tool-action-green" @click="showOutput">
              <el-icon><FolderOpened /></el-icon>定位输出文件
            </button>
            <button class="tool-action-button tool-action-mix" :disabled="updating || !activeConnection" @click="openUpdateDialog">
              <el-icon><UploadFilled /></el-icon>{{ updating ? '更新中...' : '更新数据库' }}
            </button>
            <button class="tool-action-button stop-action" :disabled="!updating" @click="stopSqlTask">
              终止
            </button>
          </div>
        </section>
      </main>

      <ToolLogPanel :logs="logs" class="log-card tool-log-fill" @clear="clearLogs" />
    </div>

    <el-dialog v-model="updateDialogVisible" title="更新数据库" width="500px">
      <el-form label-width="88px" hide-required-asterisk>
        <el-form-item label="SQL 文件">
          <el-input :model-value="updateSqlPath" readonly />
        </el-form-item>
        <el-form-item label="目标连接">
          <el-select v-model="updateConnectionId" placeholder="请选择数据库连接" class="full-width">
            <el-option
              v-for="connection in connections"
              :key="connection.id"
              :label="`${connection.name}  ${connectionAddress(connection)}`"
              :value="connection.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="更新选项">
          <el-checkbox v-model="backupBeforeUpdate">更新前备份当前数据库</el-checkbox>
        </el-form-item>
      </el-form>
      <el-alert
        v-if="backupBeforeUpdate"
        title="备份文件将生成在当前 SQL 文件的同一目录"
        type="info"
        :closable="false"
        show-icon
      />
      <template #footer>
        <el-button @click="updateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updating" @click="updateDatabase">开始更新</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="connectionDialogVisible" :title="editingConnectionId ? '编辑连接' : '新增连接'" width="520px" destroy-on-close>
      <el-form label-width="78px" hide-required-asterisk>
        <el-form-item label="连接名称"><el-input v-model="connectionDraft.name" placeholder="例如：本地测试库" /></el-form-item>
        <el-row :gutter="14">
          <el-col :span="16"><el-form-item label="主机"><el-input v-model="connectionDraft.host" /></el-form-item></el-col>
          <el-col :span="8"><el-form-item label="端口" label-width="52px"><el-input-number v-model="connectionDraft.port" :min="1" :max="65535" controls-position="right" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="用户名"><el-input v-model="connectionDraft.user" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="connectionDraft.password" type="password" show-password /></el-form-item>
        <el-form-item label="数据库"><el-input v-model="connectionDraft.database" /></el-form-item>
        <el-form-item label="mysql.exe"><el-input v-model="connectionDraft.mysqlPath" placeholder="例如：D:\\Program Files\\MySQL\\mysql-5.7.30-winx64\\bin\\mysql.exe" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="connectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConnection">保存连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Connection, DataAnalysis, Document, FolderOpened, RefreshRight, UploadFilled } from '@element-plus/icons-vue';
import ToolLogPanel from '../common/ToolLogPanel.vue';

const fileForm = reactive({ sourcePath: '', outputPath: '' });
const connections = ref([]);
const activeConnectionId = ref('');
const connectionListRef = ref(null);
const connectionDialogVisible = ref(false);
const updateDialogVisible = ref(false);
const updateConnectionId = ref('');
const backupBeforeUpdate = ref(false);
const editingConnectionId = ref('');
const DEFAULT_MYSQL_PATH = 'D:\\Program Files\\MySQL\\mysql-5.7.30-winx64\\bin\\mysql.exe';
const emptyConnection = () => ({ name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', database: '', mysqlPath: DEFAULT_MYSQL_PATH });
const connectionDraft = reactive(emptyConnection());
const converting = ref(false);
const testing = ref(false);
const updating = ref(false);
const logs = ref([]);
const cleanProgress = reactive({ visible: false, percent: 0 });
const syncProgress = reactive({ visible: false, percent: 0, label: '导入进度', detail: '' });

const activeConnection = computed(() => connections.value.find((item) => item.id === activeConnectionId.value) || null);
const sourceFileName = computed(() => fileForm.sourcePath.split(/[\\/]/).pop());
const outputFileName = computed(() => fileForm.outputPath.split(/[\\/]/).pop());
const updateSqlPath = computed(() => fileForm.outputPath || fileForm.sourcePath);
const connectionAddress = (connection) => `${connection.host}:${connection.port}/${connection.database}`;
const addLog = (message, level = 'INFO') => logs.value.push({ level, message, timestamp: new Date().toLocaleString() });
const appendIpcLog = (log) => logs.value.push(log);
const clearLogs = () => { logs.value = []; };
const formatSize = (bytes = 0) => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
};
const appendIpcProgress = (progress = {}) => {
  if (progress.scope === 'clean') {
    cleanProgress.visible = true;
    cleanProgress.percent = progress.percent || 0;
    syncProgress.visible = true;
    syncProgress.percent = progress.percent || 0;
    syncProgress.label = '清洗进度';
    syncProgress.detail = `${formatSize(progress.readTotal)} / ${formatSize(progress.total)}`;
    return;
  }
  if (progress.scope === 'import') {
    syncProgress.visible = true;
    syncProgress.percent = progress.percent || 0;
    syncProgress.label = '导入进度';
    syncProgress.detail = `${formatSize(progress.readTotal)} / ${formatSize(progress.total)}${progress.speed ? ` | ${formatSize(progress.speed)}/s` : ''}`;
  }
};

const selectSource = async () => {
  const result = await window.electronAPI?.selectSqlSource?.();
  if (!result) return;
  fileForm.sourcePath = result.sourcePath;
  fileForm.outputPath = '';
  cleanProgress.visible = false;
  cleanProgress.percent = 0;
  addLog(`已选择 SQL: ${result.sourcePath}`);
};
const selectOutput = async () => {
  const outputPath = await window.electronAPI?.selectSqlOutput?.(fileForm.outputPath);
  if (outputPath) fileForm.outputPath = outputPath;
};

const convertSql = async () => {
  if (!fileForm.sourcePath) return ElMessage.warning('请选择输入 SQL 文件');
  converting.value = true;
  cleanProgress.visible = true;
  cleanProgress.percent = 0;
  try {
    const result = await window.electronAPI?.cleanSqlFile?.({ ...fileForm });
    if (result?.canceled) return;
    if (!result?.success) return ElMessage.error(result?.error || 'SQL 清洗失败');
    result.logs?.forEach((message) => addLog(message));
    fileForm.outputPath = result.outputPath;
    cleanProgress.percent = 100;
    ElMessage.success('SQL 文件清洗完成');
  } finally { converting.value = false; }
};
const showOutput = async () => {
  const result = await window.electronAPI?.showSqlOutput?.(fileForm.outputPath);
  if (!result?.success) ElMessage.error(result?.error || '无法定位输出文件');
};

const openUpdateDialog = () => {
  if (!updateSqlPath.value) return ElMessage.warning('请先选择 SQL 文件');
  if (!activeConnection.value) return ElMessage.warning('请先新增并选择数据库连接');
  updateConnectionId.value = activeConnectionId.value;
  backupBeforeUpdate.value = false;
  updateDialogVisible.value = true;
};

const updateDatabase = async () => {
  const connection = connections.value.find((item) => item.id === updateConnectionId.value);
  if (!connection) return ElMessage.warning('请选择数据库连接');
  updating.value = true;
  updateDialogVisible.value = false;
  syncProgress.visible = true;
  syncProgress.percent = 0;
  syncProgress.label = '导入进度';
  syncProgress.detail = '';
  try {
    const result = await window.electronAPI?.updateDatabaseFromSql?.({
      connection: { ...connection },
      sqlPath: updateSqlPath.value,
      backupBeforeUpdate: backupBeforeUpdate.value,
    });
    if (result?.canceled) return;
    if (!result?.success) return ElMessage.error(result?.error || '数据库更新失败');
    if (result.backupPath) addLog(`数据库备份文件: ${result.backupPath}`, 'SUCCESS');
    syncProgress.percent = 100;
    ElMessage.success('数据库更新完成');
  } finally {
    updating.value = false;
  }
};

const stopSqlTask = async () => {
  const result = await window.electronAPI?.stopSqlToolTask?.();
  if (!result?.success) ElMessage.info('当前没有正在导入的 SQL');
};

const persistConnections = async () => {
  await window.electronAPI?.saveSqlToolSettings?.({
    connections: connections.value.map((item) => ({ ...item })),
    activeConnectionId: activeConnectionId.value,
  });
};
const selectConnection = async (id) => {
  activeConnectionId.value = id;
  await persistConnections();
};
const openConnectionDialog = (connection = null) => {
  editingConnectionId.value = connection?.id || '';
  Object.assign(connectionDraft, emptyConnection(), connection || {});
  connectionDraft.mysqlPath = connectionDraft.mysqlPath || DEFAULT_MYSQL_PATH;
  connectionDialogVisible.value = true;
};
const saveConnection = async () => {
  if (!connectionDraft.name || !connectionDraft.host || !connectionDraft.user || !connectionDraft.database) {
    return ElMessage.warning('请完整填写连接名称、主机、用户名和数据库');
  }
  const data = { ...connectionDraft, id: editingConnectionId.value || `mysql_${Date.now()}` };
  const index = connections.value.findIndex((item) => item.id === data.id);
  if (index >= 0) connections.value[index] = data;
  else connections.value.push(data);
  activeConnectionId.value = data.id;
  await persistConnections();
  connectionDialogVisible.value = false;
  ElMessage.success('连接配置已保存');
};
const deleteConnection = async () => {
  if (!activeConnection.value) return;
  try {
    await ElMessageBox.confirm(`确定删除连接“${activeConnection.value.name}”？`, '删除连接', { type: 'warning' });
  } catch {
    return;
  }
  connections.value = connections.value.filter((item) => item.id !== activeConnectionId.value);
  activeConnectionId.value = connections.value[0]?.id || '';
  await persistConnections();
};
const testConnection = async () => {
  if (!activeConnection.value) return ElMessage.warning('请先选择连接');
  testing.value = true;
  try {
    const result = await window.electronAPI?.testMysqlConnection?.({ ...activeConnection.value });
    result?.success ? ElMessage.success('MySQL 连接成功') : ElMessage.error(result?.error || '连接失败');
  } finally { testing.value = false; }
};
onMounted(async () => {
  const settings = await window.electronAPI?.getSqlToolSettings?.();
  connections.value = Array.isArray(settings?.connections) ? settings.connections : [];
  activeConnectionId.value = settings?.activeConnectionId || connections.value[0]?.id || '';
  window.electronAPI?.onSqlToolLog?.(appendIpcLog);
  window.electronAPI?.onSqlToolProgress?.(appendIpcProgress);
});
onUnmounted(() => {
  window.electronAPI?.removeSqlToolLogListeners?.();
  window.electronAPI?.removeSqlToolProgressListeners?.();
});
</script>

<style scoped lang="scss">
.sql-tool { position: relative; display: flex; flex-direction: column; gap: var(--tool-gap-lg); }
.sql-workspace { display: grid; grid-template-columns: 240px minmax(440px,1fr) minmax(360px,.72fr); gap: var(--tool-gap-lg); min-height: 0; }
.sql-main { min-width: 0; min-height: 0; }
.test-button,.connection-list-actions button,.icon-button { border: 0; border-radius: 6px; cursor: pointer; font-weight: 700; }
.connection-list-card,.operation-card,.log-card,.convert-summary-card,.action-card { display: flex; min-width: 0; flex-direction: column; }
.panel-header,:deep(.log-header) { display: flex; align-items: center; justify-content: space-between; }
.title-icon { color: #6574e8; }
.icon-button { width: 30px; height: 30px; color: #fff; background: #667eea; font-size: 20px; }
.connection-list { display: flex; flex: 1; flex-direction: column; gap: 8px; overflow: auto; }
.connection-item { display: flex; width: 100%; gap: 9px; align-items: center; padding: 11px 10px; border: 1px solid transparent; border-radius: 6px; background: #f7f8fc; text-align: left; cursor: pointer; }
.connection-item.active { border-color: #667eea; background: #eef0ff; }
.status-dot { width: 8px; height: 8px; flex: 0 0 8px; border-radius: 50%; background: #42b883; }
.connection-copy { display: flex; min-width: 0; flex-direction: column; gap: 3px; }
.connection-copy strong,.connection-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.connection-copy small { color: var(--tool-muted); }
.empty-connections { padding: 30px 0; color: var(--tool-muted); text-align: center; }
.connection-list-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
.connection-list-actions button { padding: 8px; color: #4f63d8; background: #eef0ff; }
.connection-list-actions button.danger { color: #d95359; background: #fff0f1; }
.connection-list-actions button:disabled { cursor: not-allowed; opacity: .45; }
.test-button { width: 100%; margin-top: 12px; padding: 9px 14px; color: #fff; background: #42b883; }
.test-button:disabled { cursor: not-allowed; opacity: .45; }
.file-input-row { display: flex; width: 100%; gap: 12px; :deep(.el-input) { min-width: 0; flex: 1; } }
.browse-button { flex: 0 0 82px; border: 0; border-radius: 6px; color: #fff; background: #667eea; font-weight: 700; cursor: pointer; }
.progress-box { display: grid; gap: 8px; margin-top: 12px; padding: 12px; border: 1px solid #e0e4ec; border-radius: 8px; background: #f8f9fd; }
.progress-box span { color: #374151; font-weight: 700; }
.progress-box small { color: var(--tool-muted); font-family: Consolas, monospace; }
.import-progress { margin-top: 12px; }
.convert-summary-card { min-height: 0; justify-content: flex-start; }
.file-summary { display: grid; gap: 12px; padding: 16px; border: 1px solid #e0e4ec; border-radius: 8px; background: #f8f9fd; }
.file-summary div { display: grid; grid-template-columns: 22px 72px minmax(0,1fr); gap: 8px; align-items: center; }
.file-summary .el-icon,.file-summary strong { color: #6574e8; }
.action-row { --tool-action-columns: 4; }
.stop-action { color: #fff; background: linear-gradient(135deg, #ef4444, #fb7185); }
.stop-action:disabled { cursor: not-allowed; opacity: .45; }
.full-width { width: 100%; }
:deep(.bar-title::before) { content: ''; width: 4px; height: 22px; border-radius: 2px; background: #c4a7f3; }
:deep(.tool-log) { min-height: 0; flex: 1; }
:deep(.log-line) { white-space: pre-wrap; }
:deep(.level-success) { color: #4ade80; }
:deep(.level-error) { color: #ff8a8a; }
:deep(.el-form-item) { margin-bottom: 18px; }
:deep(.el-form-item__label) { color: #374151; font-weight: 700; }
:deep(.el-input-number) { width: 100%; }
@media (max-width: 1100px) { .sql-workspace { grid-template-columns: 210px minmax(0,1fr); } .sql-workspace .log-card { grid-column: 1 / -1; min-height: 300px; } }
@media (max-width: 760px) { .sql-workspace { grid-template-columns: 1fr; } }
</style>
