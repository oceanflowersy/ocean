<template>
  <div class="sql-tool tool-page">
    <div class="function-switch">
      <button :class="['mode-button', 'tool-action-button', 'tool-action-mix', { active: mode === 'convert' }]" @click="mode = 'convert'">
        🗄️ SQL 文件转换
      </button>
      <button :class="['mode-button', 'tool-action-button', 'tool-action-green', { active: mode === 'sync' }]" @click="mode = 'sync'">
        🔄 数据库同步
      </button>
    </div>

    <template v-if="mode === 'convert'">
      <div class="convert-layout">
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
            <el-form-item label="Python 3.7"><el-input v-model="pythonPath" readonly /></el-form-item>
          </el-form>
          <div class="file-summary">
            <div><el-icon><Document /></el-icon><span>输入文件</span><strong>{{ sourceFileName || '未选择' }}</strong></div>
            <div><el-icon><FolderOpened /></el-icon><span>输出文件</span><strong>{{ outputFileName || '未设置' }}</strong></div>
          </div>
          <div class="action-row">
            <button class="tool-action-button tool-action-sunset" :disabled="converting" @click="convertSql">
              <el-icon><RefreshRight /></el-icon>{{ converting ? '转换中...' : '开始转换' }}
            </button>
            <button class="tool-action-button tool-action-green" @click="showOutput">
              <el-icon><FolderOpened /></el-icon>定位输出文件
            </button>
          </div>
        </section>
        <LogPanel :logs="logs" @clear="clearLogs" />
      </div>
    </template>

    <template v-else>
      <section class="current-connection-bar">
        <div>
          <span>当前连接</span>
          <strong>{{ activeConnection?.name || '未选择' }}</strong>
          <em v-if="activeConnection">{{ connectionAddress(activeConnection) }}</em>
        </div>
        <div class="current-actions">
          <button class="header-button" @click="focusConnectionList">切换</button>
          <button class="header-button primary" @click="openConnectionDialog()">新增连接</button>
        </div>
      </section>

      <div class="database-workspace">
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
          <div class="connection-list-actions">
            <button :disabled="!activeConnection" @click="openConnectionDialog(activeConnection)">编辑</button>
            <button :disabled="!activeConnection" class="danger" @click="deleteConnection">删除</button>
          </div>
        </aside>

        <main class="tool-card execution-card">
          <div class="panel-header">
            <h2 class="tool-card-title"><el-icon class="title-icon"><Promotion /></el-icon>执行区域</h2>
            <button class="test-button" :disabled="!activeConnection || testing" @click="testConnection">
              {{ testing ? '测试中...' : '测试连接' }}
            </button>
          </div>

          <el-tabs v-model="executionMode" class="execution-tabs">
            <el-tab-pane label="执行脚本" name="script">
              <el-form label-width="88px" hide-required-asterisk>
                <el-form-item label="SQL 脚本">
                  <div class="file-input-row">
                    <el-input v-model="fileForm.sourcePath" readonly placeholder="请选择需要执行的 SQL 脚本" />
                    <button class="browse-button" type="button" @click="selectSource">浏览...</button>
                  </div>
                </el-form-item>
                <el-form-item label="执行选项">
                  <el-checkbox v-model="convertBeforeExecute">执行前先转换 SQL</el-checkbox>
                </el-form-item>
                <el-form-item v-if="convertBeforeExecute" label="转换输出">
                  <div class="file-input-row">
                    <el-input v-model="fileForm.outputPath" readonly />
                    <button class="browse-button" type="button" @click="selectOutput">浏览...</button>
                  </div>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="手写 SQL" name="manual">
              <el-input
                v-model="manualSql"
                type="textarea"
                :rows="13"
                resize="none"
                placeholder="请输入需要执行的 SQL 语句"
                class="sql-editor"
              />
            </el-tab-pane>
          </el-tabs>

          <button class="execute-button tool-action-button tool-action-sunset" :disabled="executing || !activeConnection" @click="executeSql">
            <el-icon><Promotion /></el-icon>{{ executing ? '执行中...' : '执行 SQL' }}
          </button>
        </main>

        <LogPanel :logs="logs" @clear="clearLogs" />
      </div>
    </template>

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
      </el-form>
      <template #footer>
        <el-button @click="connectionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConnection">保存连接</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, defineComponent, h, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElButton, ElMessage, ElMessageBox } from 'element-plus';
import { Connection, DataAnalysis, Document, FolderOpened, Promotion, RefreshRight } from '@element-plus/icons-vue';

const LogPanel = defineComponent({
  props: { logs: { type: Array, required: true } },
  emits: ['clear'],
  setup(props, { emit }) {
    return () => h('section', { class: 'tool-card log-card' }, [
      h('div', { class: 'log-header' }, [
        h('h2', { class: 'tool-card-title bar-title' }, '执行信息'),
        h(ElButton, { type: 'danger', size: 'small', onClick: () => emit('clear') }, () => '清空'),
      ]),
      h('div', { class: 'tool-log' }, props.logs.map((log, index) =>
        h('div', { key: index, class: ['log-line', `level-${log.level.toLowerCase()}`] }, `[${log.timestamp}] ${log.message}`),
      )),
    ]);
  },
});

const pythonPath = 'E:\\Software\\Anaconda\\envs\\64V3.7\\python.exe';
const mode = ref('convert');
const executionMode = ref('script');
const fileForm = reactive({ sourcePath: '', outputPath: '' });
const connections = ref([]);
const activeConnectionId = ref('');
const connectionListRef = ref(null);
const connectionDialogVisible = ref(false);
const editingConnectionId = ref('');
const connectionDraft = reactive({ name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', database: '' });
const manualSql = ref('');
const convertBeforeExecute = ref(true);
const converting = ref(false);
const testing = ref(false);
const executing = ref(false);
const logs = ref([]);

const activeConnection = computed(() => connections.value.find((item) => item.id === activeConnectionId.value) || null);
const sourceFileName = computed(() => fileForm.sourcePath.split(/[\\/]/).pop());
const outputFileName = computed(() => fileForm.outputPath.split(/[\\/]/).pop());
const connectionAddress = (connection) => `${connection.host}:${connection.port}/${connection.database}`;
const addLog = (message, level = 'INFO') => logs.value.push({ level, message, timestamp: new Date().toLocaleString() });
const appendIpcLog = (log) => logs.value.push(log);
const clearLogs = () => { logs.value = []; };

const selectSource = async () => {
  const result = await window.electronAPI?.selectSqlSource?.();
  if (!result) return;
  Object.assign(fileForm, result);
  addLog(`已选择 SQL: ${result.sourcePath}`);
};
const selectOutput = async () => {
  const outputPath = await window.electronAPI?.selectSqlOutput?.(fileForm.outputPath);
  if (outputPath) fileForm.outputPath = outputPath;
};

const convertSql = async () => {
  if (!fileForm.sourcePath || !fileForm.outputPath) return ElMessage.warning('请选择输入和输出 SQL 文件');
  converting.value = true;
  try {
    const result = await window.electronAPI?.convertSqlFile?.({ ...fileForm });
    if (result?.canceled) return;
    if (!result?.success) return ElMessage.error(result?.error || 'SQL 转换失败');
    result.logs?.forEach((message) => addLog(message));
    fileForm.outputPath = result.outputPath;
    ElMessage.success('SQL 文件转换完成');
  } finally { converting.value = false; }
};
const showOutput = async () => {
  const result = await window.electronAPI?.showSqlOutput?.(fileForm.outputPath);
  if (!result?.success) ElMessage.error(result?.error || '无法定位输出文件');
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
const focusConnectionList = () => connectionListRef.value?.scrollIntoView({ behavior: 'smooth', block: 'center' });
const openConnectionDialog = (connection = null) => {
  editingConnectionId.value = connection?.id || '';
  Object.assign(connectionDraft, connection || { name: '', host: '127.0.0.1', port: 3306, user: 'root', password: '', database: '' });
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
const executeSql = async () => {
  if (!activeConnection.value) return ElMessage.warning('请先选择连接');
  if (executionMode.value === 'script' && !fileForm.sourcePath) return ElMessage.warning('请选择 SQL 脚本');
  if (executionMode.value === 'manual' && !manualSql.value.trim()) return ElMessage.warning('请输入 SQL');
  executing.value = true;
  try {
    const result = await window.electronAPI?.executeMysqlScript?.({
      connection: { ...activeConnection.value },
      sourcePath: executionMode.value === 'script' ? fileForm.sourcePath : '',
      outputPath: fileForm.outputPath,
      convertBeforeExecute: executionMode.value === 'script' && convertBeforeExecute.value,
      sqlText: executionMode.value === 'manual' ? manualSql.value : '',
    });
    if (result?.canceled) return;
    result?.success ? ElMessage.success('数据库同步完成') : ElMessage.error(result?.error || '执行失败');
  } finally { executing.value = false; }
};

onMounted(async () => {
  const settings = await window.electronAPI?.getSqlToolSettings?.();
  connections.value = Array.isArray(settings?.connections) ? settings.connections : [];
  activeConnectionId.value = settings?.activeConnectionId || connections.value[0]?.id || '';
  window.electronAPI?.onSqlToolLog?.(appendIpcLog);
});
onUnmounted(() => window.electronAPI?.removeSqlToolLogListeners?.());
</script>

<style scoped lang="scss">
.sql-tool { display: flex; flex-direction: column; gap: var(--tool-gap-lg); }
.function-switch { display: flex; justify-content: center; gap: 28px; }
.mode-button { width: 260px; opacity: 0.72; &.active { opacity: 1; outline: 2px solid rgba(255,255,255,.9); outline-offset: 2px; } }
.convert-layout { display: grid; grid-template-columns: minmax(0,1.05fr) minmax(0,.95fr); gap: var(--tool-gap-lg); }
.current-connection-bar { display: flex; align-items: center; justify-content: space-between; padding: 14px 18px; border-radius: 8px; background: rgba(255,255,255,.95); box-shadow: var(--tool-shadow); }
.current-connection-bar div:first-child { display: flex; align-items: center; gap: 12px; }
.current-connection-bar span { color: var(--tool-muted); font-weight: 700; }
.current-connection-bar strong { font-size: 16px; }
.current-connection-bar em { color: #6574e8; font-style: normal; }
.current-actions { display: flex; gap: 10px; }
.header-button,.test-button,.connection-list-actions button,.icon-button { border: 0; border-radius: 6px; cursor: pointer; font-weight: 700; }
.header-button { padding: 8px 15px; color: #4f63d8; background: #eef0ff; &.primary { color: #fff; background: #667eea; } }
.database-workspace { display: grid; grid-template-columns: 220px minmax(440px,1fr) minmax(360px,.78fr); gap: var(--tool-gap-lg); min-height: 590px; }
.connection-list-card,.execution-card,.operation-card,.log-card { display: flex; min-width: 0; flex-direction: column; }
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
.test-button { padding: 8px 14px; color: #fff; background: #42b883; }
.execution-tabs { flex: 1; min-height: 0; }
.file-input-row { display: flex; width: 100%; gap: 12px; :deep(.el-input) { min-width: 0; flex: 1; } }
.browse-button { flex: 0 0 82px; border: 0; border-radius: 6px; color: #fff; background: #667eea; font-weight: 700; cursor: pointer; }
.sql-editor :deep(.el-textarea__inner) { font-family: Consolas, monospace; line-height: 1.65; }
.execute-button { width: 100%; margin-top: 16px; }
.file-summary { display: grid; gap: 12px; margin-top: 14px; padding: 16px; border: 1px solid #e0e4ec; border-radius: 8px; background: #f8f9fd; }
.file-summary div { display: grid; grid-template-columns: 22px 72px minmax(0,1fr); gap: 8px; align-items: center; }
.file-summary .el-icon,.file-summary strong { color: #6574e8; }
.action-row { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 16px; margin-top: auto; padding-top: 22px; }
:deep(.bar-title::before) { content: ''; width: 4px; height: 22px; border-radius: 2px; background: #c4a7f3; }
:deep(.tool-log) { min-height: 0; flex: 1; }
:deep(.log-line) { white-space: pre-wrap; }
:deep(.level-success) { color: #4ade80; }
:deep(.level-error) { color: #ff8a8a; }
:deep(.el-form-item) { margin-bottom: 18px; }
:deep(.el-form-item__label) { color: #374151; font-weight: 700; }
:deep(.el-input-number) { width: 100%; }
@media (max-width: 1100px) { .database-workspace { grid-template-columns: 190px minmax(0,1fr); } .database-workspace .log-card { grid-column: 1 / -1; min-height: 300px; } }
@media (max-width: 760px) { .convert-layout,.database-workspace { grid-template-columns: 1fr; } .function-switch { flex-direction: column; } .mode-button { width: 100%; } .current-connection-bar { align-items: flex-start; flex-direction: column; gap: 12px; } }
</style>
