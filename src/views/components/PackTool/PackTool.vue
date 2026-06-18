<template>
  <div class="pack-tool-container">
    <!-- <header class="header">
      <h1>🚀 WingPack 项目打包工具</h1>
    </header> -->

    <main class="main-content">
      <!-- 左侧：配置区域 -->
      <div class="left-panel" :class="{ 'is-building': isBuilding }">
        <!-- 项目选择器 -->
        <section class="profile-selector">
          <div class="selector-group">
            <div class="select-wrapper">
              <label>📂 当前项目:</label>
              <select v-model="currentProfileId" @change="switchProfile" class="profile-select">
                <option v-for="profile in profiles" :key="profile.id" :value="profile.id">
                  {{ profile.name }}
                </option>
              </select>
            </div>
            <div class="profile-actions">
              <button @click="showCreateDialog" class="btn-action btn-new" title="新增项目">
                ➕ 新增
              </button>
              <button @click="duplicateCurrentProfile" class="btn-action btn-copy" title="复制当前项目">
                📋 复制
              </button>
              <button @click="deleteCurrentProfile" class="btn-action btn-delete" title="删除当前项目">
                🗑️ 删除
              </button>
            </div>
          </div>
        </section>

        <!-- 配置表单 -->
        <section class="config-section">
          <div class="form-row">
            <div class="form-group half-width">
              <label>项目名称:</label>
              <div class="input-group">
                <input
                  type="text"
                  v-model="currentConfig.name"
                  placeholder="输入项目名称"
                />
              </div>
            </div>

            <div class="form-group half-width">
              <label>War包输出路径:</label>
              <div class="input-group">
                <input
                  type="text"
                  v-model="currentConfig.outputPath"
                  placeholder="选择最终产物输出目录"
                  readonly
                />
                <button @click="selectDirectory('outputPath')">浏览...</button>
              </div>
            </div>
          </div>

          <div class="form-group">
            <div class="label-with-nvm">
              <label>前台项目路径 (Vue3):</label>
              <div :class="['nvm-badge', nvmSwitchStatus ? nvmSwitchStatus.type : '']" :title="nvmSwitchStatus ? nvmSwitchStatus.msg : 'Node.js 版本 (nvm)'">
                <span class="nvm-badge-prefix">NVM</span>
                <select
                  v-model="selectedNvmVersion"
                  class="nvm-badge-select"
                  @change="switchNvmVersion"
                  :disabled="nvmLoading"
                >
                  <option v-if="nvmVersions.length === 0" value="">加载中...</option>
                  <option
                    v-for="ver in nvmVersions"
                    :key="ver.version"
                    :value="ver.version"
                  >{{ ver.version }}{{ ver.current ? ' ✓' : '' }}</option>
                </select>
                <span v-if="nvmLoading" class="nvm-badge-spinner">⟳</span>
              </div>
            </div>
            <div class="input-group">
              <input
                type="text"
                v-model="currentConfig.frontendPath"
                placeholder="选择 Vue3 项目根目录 (含 package.json)"
                readonly
              />
              <button @click="selectDirectory('frontendPath')">浏览...</button>
            </div>
          </div>

          <div class="form-group">
            <label>后台项目路径 (Maven):</label>
            <div class="input-group">
              <input
                type="text"
                v-model="currentConfig.backendPath"
                placeholder="选择 Maven 项目根目录 (含 pom.xml)"
                readonly
              />
              <button @click="selectDirectory('backendPath')">浏览...</button>
            </div>
          </div>

          <div class="form-group">
            <label>Maven 路径:</label>
            <div class="input-group">
              <input
                type="text"
                v-model="currentConfig.mavenPath"
                placeholder="选择 Maven 安装目录 (留空使用系统默认)"
                readonly
              />
              <button @click="selectDirectory('mavenPath')">浏览...</button>
            </div>
          </div>

          <!-- 配置文件替换 -->
          <div class="form-group">
            <!-- 配置文件替换标题行：label + 启用 + 套tabs + 操作 -->
            <div class="replace-sets-bar">
              <label>配置文件替换:</label>
              <button
                :class="['btn-replace-toggle', currentConfig.replaceEnabled !== false ? 'is-on' : 'is-off']"
                @click="currentConfig.replaceEnabled = currentConfig.replaceEnabled === false ? true : false"
                :title="currentConfig.replaceEnabled !== false ? '点击关闭替换' : '点击开启替换'"
              >{{ currentConfig.replaceEnabled !== false ? '● 已启用' : '○ 已禁用' }}</button>
              <div class="replace-sets-tabs">
                <button
                  v-for="set in currentConfig.replaceSets"
                  :key="set.id"
                  :class="['set-tab', { 'is-active': set.id === currentConfig.activeReplaceSetId }]"
                  @click="switchReplaceSet(set.id)"
                >
                  <span class="set-tab-name">{{ set.name }}</span>
                  <span class="set-tab-actions">
                    <span class="set-tab-btn set-tab-btn-rename" @click.stop="openRenameSetDialog(set)" title="重命名">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
                    </span>
                    <span class="set-tab-btn set-tab-btn-delete" @click.stop="deleteSet(set.id)" title="删除" v-if="currentConfig.replaceSets.length > 1">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
                    </span>
                  </span>
                </button>
                <button class="set-tab set-tab-add" @click="openAddSetDialog" title="新增配置套">＋</button>
              </div>
            </div>
            <div class="replace-files-container">
              <div class="replace-files-tags">
                <button
                  v-for="file in currentReplaceSet.files"
                  :key="file.id"
                  :class="['file-tag', { 'active': isFileConfigured(file), 'inactive': !isFileConfigured(file) }]"
                  @click="editReplaceFile(file)"
                  :title="getFileTooltip(file)"
                >
                  <span class="file-name">{{ file.fileName }}</span>
                  <span v-if="isFileConfigured(file)" class="check-icon">✓</span>
                  <span class="remove-icon" @click.stop="removeReplaceFile(file.id)">×</span>
                </button>
                <button class="file-tag add-tag" @click="addReplaceFile">
                  <span class="add-icon">+</span>
                  <span>添加</span>
                </button>
              </div>
            </div>
          </div>

          <div class="form-group" style="margin-top: auto;margin-bottom: 0;">
            <button class="btn-primary" @click="saveCurrentProfile">💾 保存当前项目配置</button>
          </div>
        </section>

        <!-- 打包操作 -->
        <section class="build-section">
          <div class="button-group">
            <button class="btn-build btn-frontend" @click="buildFrontend">
              📦 打包前台
            </button>
            <button class="btn-build btn-backend" @click="buildBackend">
              🔧 打包后台
            </button>
            <button class="btn-build btn-all" @click="buildAll">
              🚀 全部打包
            </button>
            <button class="btn-build btn-replace" @click="replaceConfigInWar">
              🔄 更换配置
            </button>
          </div>
        </section>
      </div>

      <!-- 右侧：日志输出和War包管理 -->
      <div class="right-panel">
        <!-- 日志输出区域 -->
        <section class="log-section">
          <div class="log-header">
            <div class="log-title-group">
              <h3>{{ rightToolMode === 'log' ? '日志输出' : 'AES 加解密' }}</h3>
              <div class="right-tool-tabs">
                <button
                  :class="{ active: rightToolMode === 'log' }"
                  @click="rightToolMode = 'log'"
                >日志</button>
                <button
                  :class="{ active: rightToolMode === 'crypto' }"
                  @click="rightToolMode = 'crypto'"
                >AES</button>
              </div>
            </div>
            <div v-if="rightToolMode === 'log'" class="log-actions">
              <button class="btn-stop" @click="stopBuild">终止</button>
              <button class="btn-clear" @click="clearLogs">清空</button>
            </div>
            <div v-else class="log-actions">
              <button class="btn-copy-result" @click="copyCryptoResult">复制结果</button>
              <button class="btn-clear" @click="clearCryptoTool">清空</button>
            </div>
          </div>
          <div v-if="rightToolMode === 'log'" class="log-container" ref="logContainer">
            <div
              v-for="(log, index) in logs"
              :key="index"
              :class="['log-item', `log-${log.type}`]"
            >
              {{ log.message }}
            </div>
          </div>
          <div v-else class="crypto-tool">
            <div class="crypto-field">
              <label>输入</label>
              <textarea
                v-model="cryptoInput"
                placeholder="输入明文进行加密，或输入 Base64 密文进行解密"
              ></textarea>
            </div>
            <div class="crypto-actions">
              <button class="btn-encrypt" @click="runAesEncrypt">加密</button>
              <button class="btn-decrypt" @click="runAesDecrypt">解密</button>
              <span v-if="cryptoStatus" :class="['crypto-status', cryptoStatus.type]">
                {{ cryptoStatus.message }}
              </span>
            </div>
            <div class="crypto-field crypto-output-field">
              <label>结果</label>
              <textarea
                v-model="cryptoOutput"
                readonly
                placeholder="加密或解密结果会显示在这里"
              ></textarea>
            </div>
          </div>
        </section>

        <!-- War包管理区域 -->
        <section class="war-files-section">
          <div class="war-files-header">
            <h3>📦 打包产物</h3>
            <div class="war-files-actions">
              <button class="btn-refresh" @click="refreshWarFiles" title="刷新列表">
                🔄
              </button>
              <button class="btn-open-folder" @click="openOutputFolder" title="打开文件夹">
                📁 打开文件夹
              </button>
            </div>
          </div>
          <div class="war-files-container" v-if="currentConfig.outputPath">
            <div v-if="warFiles.length === 0" class="empty-hint">
              <p>📭 暂无打包产物</p>
              <p class="hint-text">打包完成后，war/jar文件会显示在这里</p>
            </div>
            <div v-else class="war-files-grid">
              <div
                v-for="file in warFiles"
                :key="file.path"
                :class="['war-file-card', { 'is-latest': file.path === latestWarFile, 'is-selected-for-replace': file.path === selectedWarForReplace }]"
                :title="file.path === selectedWarForReplace ? '已选为替换目标，再次点击取消' : '点击选为替换目标'"
                :draggable="true"
                @click="toggleSelectWarForReplace(file)"
                @dragstart="handleFileDragStart(file, $event)"
                @contextmenu.prevent="showFileContextMenu(file, $event)"
              >
                <div class="file-info">
                  <div class="file-name" :title="file.name">{{ file.name }}</div>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                    <span class="file-time">{{ formatFileTime(file.mtime) }}</span>
                  </div>
                </div>
                <div v-if="file.path === selectedWarForReplace" class="selected-badge"></div>
                <div v-else-if="file.path === latestWarFile" class="latest-badge">最新</div>
              </div>
            </div>
          </div>
          <div v-else class="config-hint">
            <p>⚠️ 请先配置War包输出路径</p>
          </div>
        </section>
      </div>
    </main>

    <!-- 配置文件替换弹窗 -->
    <div v-if="showReplaceFileDialog" class="dialog-overlay" @click.self="closeReplaceFileDialog">
      <div class="dialog replace-file-dialog">
        <h3>配置文件替换-{{ editingReplaceFile ? '编辑' : '添加' }}</h3>
        
        <div class="form-group">
          <label>war/jar 中的路径:</label>
          <div class="input-group">
            <input
              v-model="replaceFileForm.pathInArchive"
              type="text"
              placeholder="例如: WEB-INF/classes/config/wing.properties"
              class="dialog-input"
            />
            <!-- <button @click="searchFilesInProject" :disabled="!currentConfig.backendPath" class="btn-search">
              🔍
            </button> -->
          </div>
        </div>

        <div class="form-group">
          <label>替换文件:</label>
          <div class="input-group">
            <input
              v-model="replaceFileForm.replacementPath"
              type="text"
              class="dialog-input"
              readonly
            />
            <button @click="selectReplacementFile" class="btn-browse">📁</button>
          </div>
          <div v-if="replaceFileForm.fileName" class="file-name-hint">
            文件名: {{ replaceFileForm.fileName }}
          </div>
        </div>

        <div class="dialog-actions">
          <button @click="saveReplaceFile" class="btn-confirm">{{ editingReplaceFile ? '保存' : '确定' }}</button>
          <button v-if="editingReplaceFile" @click="deleteCurrentReplaceFile" class="btn-delete-inline">删除</button>
          <button @click="closeReplaceFileDialog" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>

    <!-- 新增项目对话框 -->
    <div v-if="showDialog" class="dialog-overlay" @click.self="closeDialog">
      <div class="dialog">
        <h3>新增项目</h3>
        <input
          v-model="newProfileName"
          type="text"
          placeholder="输入项目名称"
          class="dialog-input"
          @keyup.enter="createNewProfile"
        />
        <div class="dialog-actions">
          <button @click="createNewProfile" class="btn-confirm">确定</button>
          <button @click="closeDialog" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>
    <!-- 新增配置套对话框 -->
    <div v-if="showAddSetDialog" class="dialog-overlay" @click.self="showAddSetDialog = false">
      <div class="dialog">
        <h3>新增配置套</h3>
        <input
          v-model="newSetName"
          type="text"
          placeholder="输入配置套名称"
          class="dialog-input"
          @keyup.enter="confirmAddSet"
        />
        <div class="dialog-actions">
          <button @click="confirmAddSet" class="btn-confirm">确定</button>
          <button @click="showAddSetDialog = false" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>

    <!-- 重命名配置套对话框 -->
    <div v-if="showRenameSetDialog" class="dialog-overlay" @click.self="showRenameSetDialog = false">
      <div class="dialog">
        <h3>重命名配置套</h3>
        <input
          v-model="renameSetName"
          type="text"
          placeholder="输入新名称"
          class="dialog-input"
          @keyup.enter="confirmRenameSet"
        />
        <div class="dialog-actions">
          <button @click="confirmRenameSet" class="btn-confirm">确定</button>
          <button @click="showRenameSetDialog = false" class="btn-cancel">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, toRaw } from 'vue';

// 项目列表和当前项目
const profiles = ref([]);
const currentProfileId = ref('');
const currentConfig = ref({
  id: '',
  name: '',
  frontendPath: '',
  backendPath: '',
  outputPath: '',
  mavenPath: '',
  nvmVersion: '21.0.0', // Node.js 版本
  replaceEnabled: true, // 是否启用配置文件替换
  replaceSets: [{ id: 'set_default', name: '默认', files: [] }], // 配置套列表
  activeReplaceSetId: 'set_default' // 当前激活的配置套
});

// 当前激活的配置套
const currentReplaceSet = computed(() => {
  const sets = currentConfig.value.replaceSets;
  if (!sets || sets.length === 0) return { id: 'none', name: '默认', files: [] };
  return sets.find(s => s.id === currentConfig.value.activeReplaceSetId) || sets[0];
});

// 项目对话框
const showDialog = ref(false);
const newProfileName = ref('');

// 配置套对话框
const showAddSetDialog = ref(false);
const newSetName = ref('');
const showRenameSetDialog = ref(false);
const renameSetName = ref('');
const renamingSetId = ref('');

// 配置文件替换弹窗
const showReplaceFileDialog = ref(false);
const editingReplaceFile = ref(null); // 正在编辑的配置文件（null表示新增）
const replaceFileForm = ref({
  fileName: '',
  pathInArchive: '',
  replacementPath: '',
  enabled: true
});

// 日志
const logs = ref([]);
const logContainer = ref(null);

// 右侧工具面板
const rightToolMode = ref('log');
const cryptoInput = ref('');
const cryptoOutput = ref('');
const cryptoStatus = ref(null);

// NVM 版本管理
const nvmVersions = ref([]);
const nvmLoading = ref(false);
const nvmSwitchStatus = ref(null);

// selectedNvmVersion 直接读写 currentConfig.nvmVersion
const selectedNvmVersion = computed({
  get: () => currentConfig.value.nvmVersion || '21.0.0',
  set: (v) => { currentConfig.value.nvmVersion = v; }
});

const loadNvmVersions = async () => {
  if (!window.electronAPI?.nvmList) return;
  nvmLoading.value = true;
  try {
    const result = await window.electronAPI.nvmList();
    if (result.success) {
      nvmVersions.value = result.versions;
    }
  } catch (e) {
    console.error('加载 nvm 版本失败:', e);
  } finally {
    nvmLoading.value = false;
  }
};

// 执行 nvm use（传入版本号，默认用当前配置）
const applyNvmVersion = async (version) => {
  const ver = version || currentConfig.value.nvmVersion || '21.0.0';
  if (!window.electronAPI?.nvmUse) return;
  nvmLoading.value = true;
  nvmSwitchStatus.value = null;
  try {
    const result = await window.electronAPI.nvmUse(ver);
    if (result.success) {
      nvmSwitchStatus.value = { type: 'ok', msg: `✓ 已切换至 ${ver}` };
      addLog('success', `✓ Node 版本已切换至 ${ver}`);
      await loadNvmVersions();
    } else {
      nvmSwitchStatus.value = { type: 'err', msg: `✗ ${result.error}` };
      addLog('error', `nvm use 失败: ${result.error}`);
    }
  } catch (e) {
    nvmSwitchStatus.value = { type: 'err', msg: '✗ 切换失败' };
  } finally {
    nvmLoading.value = false;
    setTimeout(() => { nvmSwitchStatus.value = null; }, 3000);
  }
};

// 下拉选择后保存到配置并立即执行
const switchNvmVersion = () => applyNvmVersion(currentConfig.value.nvmVersion);

// 构建状态
const isBuilding = ref(false);

// War包管理
const warFiles = ref([]);
const latestWarFile = ref('');
const selectedWarForReplace = ref(''); // 用户选中的待替换 war/jar 文件路径

// 加载项目列表
const loadProfiles = async (autoNvm = false) => {
  if (window.electronAPI) {
    try {
      const { profiles: profileList, activeProfileId } = await window.electronAPI.listProfiles();
      profiles.value = profileList;
      currentProfileId.value = activeProfileId;
      await loadCurrentProfile(autoNvm);
    } catch (error) {
      addLog('error', `加载项目列表失败: ${error.message}`);
    }
  }
};

// 加载当前项目配置
const loadCurrentProfile = async (autoNvm = false) => {
  if (window.electronAPI) {
    try {
      const profile = await window.electronAPI.getActiveProfile();
      // 兼容旧格式： replaceFiles 存在就迁移（不能仅靠判断 replaceSets 是否存在，因为可能来自后端默认值注入）
      if (Array.isArray(profile.replaceFiles)) {
        const oldFiles = profile.replaceFiles;
        const defaultSetId = `set_${Date.now()}`;
        profile.replaceSets = [{ id: defaultSetId, name: '默认', files: oldFiles }];
        profile.activeReplaceSetId = defaultSetId;
        delete profile.replaceFiles;
      } else if (!profile.replaceSets || !Array.isArray(profile.replaceSets) || profile.replaceSets.length === 0) {
        profile.replaceSets = [{ id: 'set_default', name: '默认', files: [] }];
        profile.activeReplaceSetId = 'set_default';
      }
      if (!profile.activeReplaceSetId || !profile.replaceSets.find(s => s.id === profile.activeReplaceSetId)) {
        profile.activeReplaceSetId = profile.replaceSets[0].id;
      }
      // 确保 nvmVersion 有默认值
      if (!profile.nvmVersion) profile.nvmVersion = '21.0.0';
      // 确保 lastWarName 有默认值（记忆上次打包的 war/jar 文件名）
      if (!profile.lastWarName) profile.lastWarName = '';
      currentConfig.value = { ...profile };
      addLog('info', `✓ 已加载项目: ${profile.name}`);
      if (autoNvm) {
        await applyNvmVersion(profile.nvmVersion);
      }
    } catch (error) {
      addLog('error', `加载项目配置失败: ${error.message}`);
    }
  }
};

// 切换项目
const switchProfile = async () => {
  if (window.electronAPI) {
    try {
      await window.electronAPI.setActiveProfile(currentProfileId.value);
      await loadCurrentProfile(true); // 切换项目时自动执行 nvm use
      selectedWarForReplace.value = ''; // 切换项目时清空已选 war
      await loadWarFiles();
      addLog('success', '✓ 项目切换成功');
    } catch (error) {
      addLog('error', `切换项目失败: ${error.message}`);
    }
  }
};

// 保存当前项目配置
const saveCurrentProfile = async () => {
  if (window.electronAPI) {
    try {
      // 使用 toRaw 移除响应式特性，再用 JSON 序列化确保完全可克隆
      const rawConfig = JSON.parse(JSON.stringify(toRaw(currentConfig.value)));
      await window.electronAPI.updateProfile(rawConfig);
      await loadProfiles(); // 刷新列表
      addLog('success', '✓ 项目配置已保存');
    } catch (error) {
      addLog('error', `保存失败: ${error.message}`);
    }
  }
};
const setDefaultProPath = () => {
  currentConfig.value.currentWingPropertiesPath = 'WEB-INF/classes/config/wing.properties';
};
// 显示新增对话框
const showCreateDialog = () => {
  newProfileName.value = '';
  showDialog.value = true;
};

// 关闭对话框
const closeDialog = () => {
  showDialog.value = false;
};

// 创建新项目
const createNewProfile = async () => {
  if (!newProfileName.value.trim()) {
    addLog('warning', '请输入项目名称');
    return;
  }
  if (window.electronAPI) {
    try {
      const newProfile = await window.electronAPI.createProfile(newProfileName.value);
      await loadProfiles();
      currentProfileId.value = newProfile.id;
      closeDialog();
      addLog('success', `✓ 已创建项目: ${newProfile.name}`);
    } catch (error) {
      addLog('error', `创建项目失败: ${error.message}`);
    }
  }
};

// 复制当前项目
const duplicateCurrentProfile = async () => {
  if (window.electronAPI) {
    try {
      const newProfile = await window.electronAPI.duplicateProfile(currentProfileId.value);
      await loadProfiles();
      currentProfileId.value = newProfile.id;
      addLog('success', `✓ 已复制项目: ${newProfile.name}`);
    } catch (error) {
      addLog('error', `复制项目失败: ${error.message}`);
    }
  }
};

// 删除当前项目
const deleteCurrentProfile = async () => {
  if (profiles.value.length <= 1) {
    addLog('warning', '至少需要保留一个项目配置');
    return;
  }
  if (!confirm(`确定要删除项目 "${currentConfig.value.name}" 吗？`)) {
    return;
  }
  if (window.electronAPI) {
    try {
      const result = await window.electronAPI.deleteProfile(currentProfileId.value);
      await loadProfiles();
      currentProfileId.value = result.newActiveId;
      addLog('success', '✓ 项目已删除');
    } catch (error) {
      addLog('error', `删除项目失败: ${error.message}`);
    }
  }
};

// 选择目录
const selectDirectory = async (field) => {
  if (window.electronAPI) {
    const defaultPath = currentConfig.value[field] || '';
    const path = await window.electronAPI.selectDirectory(defaultPath);
    if (path) {
      currentConfig.value[field] = path;
    }
  }
};

// 判断配置文件是否已完整配置
const isFileConfigured = (file) => {
  return file.pathInArchive && file.replacementPath;
};

// 获取配置文件的提示信息
const getFileTooltip = (file) => {
  if (!isFileConfigured(file)) {
    return '未配置完整，点击编辑';
  }
  return `war/jar路径: ${file.pathInArchive}\n替换文件: ${file.replacementPath}`;
};

// 添加配置文件
const addReplaceFile = () => {
  editingReplaceFile.value = null;
  replaceFileForm.value = {
    fileName: '',
    pathInArchive: '',
    replacementPath: '',
    enabled: true
  };
  showReplaceFileDialog.value = true;
};

// 编辑配置文件
const editReplaceFile = (file) => {
  editingReplaceFile.value = file;
  replaceFileForm.value = {
    fileName: file.fileName,
    pathInArchive: file.pathInArchive,
    replacementPath: file.replacementPath,
    enabled: file.enabled !== false
  };
  showReplaceFileDialog.value = true;
};

// 删除配置文件
const removeReplaceFile = (fileId) => {
  if (confirm('确定要删除这个配置吗？')) {
    const files = currentReplaceSet.value.files;
    const index = files.findIndex(f => f.id === fileId);
    if (index !== -1) {
      files.splice(index, 1);
      addLog('info', '已删除配置文件');
    }
  }
};

// 关闭配置文件弹窗
const closeReplaceFileDialog = () => {
  showReplaceFileDialog.value = false;
  editingReplaceFile.value = null;
};

// 保存配置文件
const saveReplaceFile = () => {
  if (!replaceFileForm.value.fileName.trim()) {
    addLog('warning', '请输入文件名称');
    return;
  }
  
  if (editingReplaceFile.value) {
    // 编辑现有配置
    editingReplaceFile.value.fileName = replaceFileForm.value.fileName;
    editingReplaceFile.value.pathInArchive = replaceFileForm.value.pathInArchive;
    editingReplaceFile.value.replacementPath = replaceFileForm.value.replacementPath;
    editingReplaceFile.value.enabled = replaceFileForm.value.enabled;
    addLog('success', '配置已更新');
  } else {
    // 添加新配置
    const newFile = {
      id: `file_${Date.now()}`,
      fileName: replaceFileForm.value.fileName,
      pathInArchive: replaceFileForm.value.pathInArchive,
      replacementPath: replaceFileForm.value.replacementPath,
      enabled: replaceFileForm.value.enabled
    };
    currentReplaceSet.value.files.push(newFile);
    addLog('success', '已添加配置文件');
  }
  
  closeReplaceFileDialog();
};

// 删除当前编辑的配置文件
const deleteCurrentReplaceFile = () => {
  if (editingReplaceFile.value && confirm('确定要删除这个配置吗？')) {
    removeReplaceFile(editingReplaceFile.value.id);
    closeReplaceFileDialog();
  }
};

// ========== 配置套管理 ==========

// 切换配置套
const switchReplaceSet = (setId) => {
  currentConfig.value.activeReplaceSetId = setId;
};

// 打开新增配置套对话框
const openAddSetDialog = () => {
  newSetName.value = '';
  showAddSetDialog.value = true;
};

// 确认新增配置套
const confirmAddSet = () => {
  const name = newSetName.value.trim();
  if (!name) {
    addLog('warning', '请输入配置套名称');
    return;
  }
  const sourceFiles = currentReplaceSet.value?.files || [];
  const newSet = {
    id: `set_${Date.now()}`,
    name,
    files: sourceFiles.map(f => ({ ...f, id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}` }))
  };
  currentConfig.value.replaceSets.push(newSet);
  currentConfig.value.activeReplaceSetId = newSet.id;
  showAddSetDialog.value = false;
  addLog('success', `✓ 已创建配置套: ${name}`);
};

// 打开重命名配置套对话框
const openRenameSetDialog = (set) => {
  const target = set || currentReplaceSet.value;
  renamingSetId.value = target.id;
  renameSetName.value = target.name;
  showRenameSetDialog.value = true;
};

// 确认重命名配置套
const confirmRenameSet = () => {
  const name = renameSetName.value.trim();
  if (!name) {
    addLog('warning', '请输入配置套名称');
    return;
  }
  const target = currentConfig.value.replaceSets.find(s => s.id === renamingSetId.value);
  if (target) target.name = name;
  showRenameSetDialog.value = false;
  addLog('success', `✓ 已重命名为: ${name}`);
};

// 删除指定配置套
const deleteSet = (setId) => {
  const sets = currentConfig.value.replaceSets;
  if (sets.length <= 1) {
    addLog('warning', '至少需要保留一套配置');
    return;
  }
  const target = sets.find(s => s.id === setId);
  if (!confirm(`确定要删除配置套 "${target ? target.name : ''}" 吗？其中的文件配置将一并删除。`)) return;
  const idx = sets.findIndex(s => s.id === setId);
  sets.splice(idx, 1);
  if (currentConfig.value.activeReplaceSetId === setId) {
    currentConfig.value.activeReplaceSetId = sets[Math.max(0, idx - 1)].id;
  }
  addLog('success', '✓ 配置套已删除');
};

// 搜索项目中的配置文件
const searchFilesInProject = async () => {
  if (!currentConfig.value.backendPath) {
    addLog('warning', '请先选择后台项目路径');
    return;
  }
  
  if (window.electronAPI) {
    try {
      // 搜索指定文件名的配置文件
      const fileName = replaceFileForm.value.fileName || '*.properties';
      const files = await window.electronAPI.searchWingProperties(currentConfig.value.backendPath, fileName);
      
      if (files.length > 0) {
        addLog('info', `找到 ${files.length} 个文件`);
        // 如果只有一个，自动填充
        if (files.length === 1) {
          replaceFileForm.value.pathInArchive = files[0].displayPath;
        } else {
          // 多个文件让用户选择（这里简化为使用第一个）
          replaceFileForm.value.pathInArchive = files[0].displayPath;
          addLog('info', '找到多个文件，已自动选择第一个');
        }
      } else {
        addLog('warning', `未找到 ${fileName} 文件`);
      }
    } catch (error) {
      addLog('error', `搜索失败: ${error.message}`);
    }
  }
};

// 选择替换文件
const selectReplacementFile = async () => {
  if (window.electronAPI) {
    const path = await window.electronAPI.selectFile();
    if (path) {
      replaceFileForm.value.replacementPath = path;
      // 自动提取文件名
      const fileName = path.split(/[/\\]/).pop();
      replaceFileForm.value.fileName = fileName;
    }
  }
};


// 选择新的 wing.properties 文件
const selectNewWingProperties = async () => {
  if (window.electronAPI) {
    const path = await window.electronAPI.selectFile();
    if (path) {
      currentConfig.value.newWingPropertiesPath = path;
    }
  }
};

// 更换配置文件（从已打包的 war 包中）
const replaceConfigInWar = async () => {
  if (currentConfig.value.replaceEnabled === false) {
    addLog('warning', '配置文件替换已禁用，跳过替换');
    return;
  }

  if (!currentConfig.value.outputPath) {
    addLog('warning', '请先配置 War 包输出路径');
    return;
  }

  if (!currentReplaceSet.value.files || currentReplaceSet.value.files.length === 0) {
    addLog('warning', '请先配置要替换的文件');
    return;
  }

  // 检查哪些文件已完整配置且已启用
  const configuredFiles = currentReplaceSet.value.files.filter(f => isFileConfigured(f) && f.enabled !== false);
  if (configuredFiles.length === 0) {
    addLog('warning', '没有已启用且完整配置的替换文件');
    return;
  }

  if (window.electronAPI && window.electronAPI.replaceConfigInWar) {
    try {
      // 确定目标 war 文件：优先使用用户手动选中的，否则取列表第一个（最新），否则报错提示
      let targetWarPath = selectedWarForReplace.value;
      if (!targetWarPath && warFiles.value.length > 0) {
        targetWarPath = warFiles.value[0].path;
      }
      if (!targetWarPath) {
        addLog('warning', '未找到可替换的 war/jar 文件，请先打包或在右侧列表中点击选择目标文件');
        return;
      }

      addLog('info', `开始替换配置文件: ${targetWarPath.split(/[\\/]/).pop()}...`);

      // 转换为纯 JavaScript 对象，避免 IPC 序列化错误
      const plainConfiguredFiles = JSON.parse(JSON.stringify(toRaw(configuredFiles)));

      // 传递具体 war 文件路径，避免多项目共用输出目录时误选旧产物
      const result = await window.electronAPI.replaceConfigInWar(targetWarPath, plainConfiguredFiles);

      if (result.success) {
        addLog('success', '✓ 配置文件替换完成！');
        result.results.forEach(r => {
          if (r.success) {
            addLog('success', `  ✓ ${r.fileName}`);
          } else {
            addLog('error', `  ✗ ${r.fileName}: ${r.error}`);
          }
        });
      } else {
        addLog('error', `✗ 替换失败: ${result.error}`);
      }
    } catch (error) {
      addLog('error', `替换配置失败: ${error.message}`);
    }
  } else {
    addLog('error', '该功能不可用，请更新应用');
  }
};

// 打包操作
const buildFrontend = () => {
  if (window.electronAPI) {
    isBuilding.value = true;
    const rawConfig = JSON.parse(JSON.stringify(toRaw(currentConfig.value)));
    window.electronAPI.buildFrontend(rawConfig);
  }
};

const buildBackend = () => {
  if (window.electronAPI) {
    isBuilding.value = true;
    const rawConfig = JSON.parse(JSON.stringify(toRaw(currentConfig.value)));
    window.electronAPI.buildBackend(rawConfig);
  }
};

const buildAll = () => {
  if (window.electronAPI) {
    isBuilding.value = true;
    const rawConfig = JSON.parse(JSON.stringify(toRaw(currentConfig.value)));
    window.electronAPI.buildAll(rawConfig);
  }
};

// 日志管理
const addLog = (type, message) => {
  logs.value.push({ type, message });
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight;
    }
  });
};

const clearLogs = () => {
  logs.value = [];
};

const setCryptoStatus = (type, message) => {
  cryptoStatus.value = { type, message };
  setTimeout(() => {
    cryptoStatus.value = null;
  }, 2500);
};

const runAesEncrypt = async () => {
  if (!window.electronAPI?.aesEncrypt) {
    setCryptoStatus('error', 'AES 功能不可用');
    return;
  }

  cryptoOutput.value = await window.electronAPI.aesEncrypt(cryptoInput.value);
  setCryptoStatus('success', cryptoOutput.value ? '加密完成' : '输入为空');
};

const runAesDecrypt = async () => {
  if (!window.electronAPI?.aesDecrypt) {
    setCryptoStatus('error', 'AES 功能不可用');
    return;
  }

  cryptoOutput.value = await window.electronAPI.aesDecrypt(cryptoInput.value);
  setCryptoStatus(
    cryptoOutput.value ? 'success' : 'warning',
    cryptoOutput.value ? '解密完成' : '解密失败或输入无效'
  );
};

const copyCryptoResult = async () => {
  if (!cryptoOutput.value) {
    setCryptoStatus('warning', '没有可复制的结果');
    return;
  }

  try {
    await navigator.clipboard.writeText(cryptoOutput.value);
    setCryptoStatus('success', '已复制');
  } catch (e) {
    setCryptoStatus('error', '复制失败，请手动复制');
  }
};

const clearCryptoTool = () => {
  cryptoInput.value = '';
  cryptoOutput.value = '';
  cryptoStatus.value = null;
};

// 终止打包
const stopBuild = async () => {
  if (window.electronAPI && window.electronAPI.stopBuild) {
    addLog('warning', '⏹ 正在终止打包任务...');
    const result = await window.electronAPI.stopBuild();
    if (result.success) {
      addLog('success', result.message);
      isBuilding.value = false;
    } else {
      addLog('error', result.message);
    }
  }
};

// ========== War 包管理 ==========

// 加载War包列表
const loadWarFiles = async () => {
  if (!window.electronAPI || !currentConfig.value.outputPath) {
    warFiles.value = [];
    return;
  }
  
  try {
    const files = await window.electronAPI.getWarFiles(currentConfig.value.outputPath);
    warFiles.value = files;
    // 优先按记忆的 war 名称自动选中
    if (currentConfig.value.lastWarName) {
      const remembered = files.find(f => f.name === currentConfig.value.lastWarName);
      if (remembered) {
        selectedWarForReplace.value = remembered.path;
        return;
      }
    }
    // 若当前选中的 war 不在最新列表中（如切换了项目），则自动清空
    if (selectedWarForReplace.value && !files.some(f => f.path === selectedWarForReplace.value)) {
      selectedWarForReplace.value = '';
    }
  } catch (error) {
    console.error('加载War包列表失败:', error);
    warFiles.value = [];
  }
};

// 点击 war 文件卡片，选为替换目标（再次点击取消选中）
const toggleSelectWarForReplace = (file) => {
  selectedWarForReplace.value = selectedWarForReplace.value === file.path ? '' : file.path;
};

// 打包后记忆 war 包名称（若名称变化则更新并保存到 profile）
const rememberWarName = async (warPath) => {
  const newName = warPath.split(/[\\/]/).pop();
  if (!newName) return;
  selectedWarForReplace.value = warPath;
  if (currentConfig.value.lastWarName !== newName) {
    if (currentConfig.value.lastWarName) {
      addLog('info', `📝 war 包名称已更新: ${currentConfig.value.lastWarName} → ${newName}`);
    }
    currentConfig.value.lastWarName = newName;
    if (window.electronAPI) {
      try {
        const rawConfig = JSON.parse(JSON.stringify(toRaw(currentConfig.value)));
        await window.electronAPI.updateProfile(rawConfig);
      } catch (e) {
        console.error('保存 lastWarName 失败:', e);
      }
    }
  }
};

// 刷新War包列表
const refreshWarFiles = async () => {
  await loadWarFiles();
  addLog('info', `✓ 已刷新，共 ${warFiles.value.length} 个文件`);
};

// 打开输出文件夹
const openOutputFolder = async () => {
  if (!currentConfig.value.outputPath) {
    addLog('warning', '请先配置War包输出路径');
    return;
  }
  
  if (window.electronAPI && window.electronAPI.openOutputFolder) {
    try {
      const result = await window.electronAPI.openOutputFolder(currentConfig.value.outputPath);
      if (!result.success) {
        addLog('error', result.error);
      }
    } catch (error) {
      addLog('error', `打开文件夹失败: ${error.message}`);
    }
  }
};

// 在文件夹中显示文件
const showFileInFolder = async (filePath) => {
  if (window.electronAPI && window.electronAPI.showFileInFolder) {
    try {
      const result = await window.electronAPI.showFileInFolder(filePath);
      if (!result.success) {
        addLog('error', result.error);
      }
    } catch (error) {
      addLog('error', `操作失败: ${error.message}`);
    }
  }
};

// 删除War文件（带确认）
const deleteWarFileConfirm = async (file) => {
  if (!confirm(`确定要删除 "${file.name}" 吗？\n\n此操作不可恢复！`)) {
    return;
  }
  
  if (window.electronAPI && window.electronAPI.deleteWarFile) {
    try {
      const result = await window.electronAPI.deleteWarFile(file.path);
      if (result.success) {
        addLog('success', `✓ 已删除: ${file.name}`);
        await loadWarFiles();
      } else {
        addLog('error', result.error);
      }
    } catch (error) {
      addLog('error', `删除失败: ${error.message}`);
    }
  }
};

// 处理文件拖拽开始
const handleFileDragStart = (file, event) => {
  // 阻止浏览器默认 HTML5 drag，交由 Electron 原生拖拽接管
  event.preventDefault();
  
  // 在 Electron 中启动原生文件拖拽（sendSync 强同步，确保手势期间调用）
  if (window.electronAPI && window.electronAPI.startDrag) {
    window.electronAPI.startDrag(file.path);
  }
};

// 显示文件右键菜单（可选功能，暂时用按钮代替）
const showFileContextMenu = (file, event) => {
  // 右键菜单功能可以通过按钮实现，这里预留接口
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// 格式化文件时间
const formatFileTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  // 1分钟内
  if (diff < 60 * 1000) {
    return '刚刚';
  }
  
  // 1小时内
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes}分钟前`;
  }
  
  // 今天
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天 ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  
  // 今年
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
  }
  
  // 其他
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' });
};

// 页面加载
onMounted(async () => {
  await loadNvmVersions();
  await loadProfiles(true); // 初次加载时自动执行 nvm use
  await loadWarFiles();

  if (window.electronAPI) {
    // 监听打包日志
    window.electronAPI.onBuildLog((log) => {
      addLog(log.type, log.message);
    });

    // 监听打包完成
    window.electronAPI.onBuildComplete(async () => {
      addLog('success', '✓ 打包完成！');
      isBuilding.value = false;
      // 打包完成后刷新War包列表
      setTimeout(async () => {
        await loadWarFiles();
        if (warFiles.value.length > 0) {
          latestWarFile.value = warFiles.value[0].path;
          // 记忆 war 包名称（名称变化时自动更新并保存）
          await rememberWarName(warFiles.value[0].path);
          // 3秒后清除高亮（但保留选中状态）
          setTimeout(() => {
            latestWarFile.value = '';
          }, 3000);
        }
        // 自动执行一次配置文件替换
        await replaceConfigInWar();
      }, 500);
    });

    // 监听打包错误
    window.electronAPI.onBuildError((error) => {
      addLog('error', `✗ ${error}`);
      isBuilding.value = false;
    });

    // 监听War文件生成事件（如果后端发送）
    if (window.electronAPI.onWarFileGenerated) {
      window.electronAPI.onWarFileGenerated(async (data) => {
        await loadWarFiles();
        if (data && data.filePath) {
          latestWarFile.value = data.filePath;
          // 记忆 war 包名称（名称变化时自动更新并保存）
          await rememberWarName(data.filePath);
          setTimeout(() => {
            latestWarFile.value = '';
          }, 3000);
        }
      });
    }
  }
});
</script>

<style scoped lang="scss">
$gap: 20px;
.pack-tool-container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  height: 100vh;
  width: 100vw;
  color: #fff;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: auto;
  .header {
    text-align: center;

    h1 {
      font-size: 2.5rem;
      font-weight: 700;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
    }
  }
}


.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
  overflow: hidden;

  .left-panel {
    flex: 1 0 600px;
    display: flex;
    flex-direction: column;
    gap: $gap;
    min-width: 0;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
    
    &.is-building {
      pointer-events: none;
      
      
      // 加载图标
      &::after {
        content: '⚙️';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 64px;
        z-index: 11;
        opacity: 0.8;
        animation: buildingSpin 2s linear infinite;
        filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.5));
      }
      
      * {
        opacity: 0.8;
        filter: grayscale(0.3);
      }
    }
  }

  .right-panel {
    flex: 1 0 400px;
    display: flex;
    flex-direction: column;
    gap: $gap;
    min-width: 0;
    min-height: 0;
  }
}

// 项目选择器
.profile-selector {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);

  .selector-group {
    display: flex;
    gap: 15px;
    align-items: flex-end;

    .select-wrapper {
      flex: 1;

      label {
        display: block;
        font-weight: 600;
        margin-bottom: 8px;
        color: #555;
      }

      .profile-select {
        width: 100%;
        padding: 10px 14px;
        border: 2px solid #e0e0e0;
        border-radius: 6px;
        font-size: 15px;
        background: white;
        cursor: pointer;
        transition: border-color 0.3s;

        &:focus {
          outline: none;
          border-color: #667eea;
        }
      }
    }

    .profile-actions {
      display: flex;
      gap: 10px;

      .btn-action {
        padding: 10px 16px;
        border: none;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        color: white;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        &.btn-new {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.btn-copy {
          background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
        }

        &.btn-delete {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
        }
      }
    }
  }
}
.config-section,
.build-section,
.log-section {                                                                                                                                                                                         
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #333;
}
.config-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}
// 两列布局
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;

  .form-group {
    margin-bottom: 0;
  }

  .half-width {
    flex: 1;
  }
}

.form-group {
  margin-bottom: 20px;

  label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #555;
  }

  .input-group {
    display: flex;
    gap: 10px;

    input, select {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #e0e0e0;
      border-radius: 6px;
      font-size: 14px;
      transition: border-color 0.3s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }

    button {
      padding: 10px 20px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;

      &:hover {
        background: #5568d3;
      }
      
      &:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
    }
  }
}

// 配置文件替换标签区域
// 配置套选择栏（与标题行合并为一行）
.replace-sets-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 6px;

  > label {
    font-weight: 600;
    color: #555;
    white-space: nowrap;
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .btn-replace-toggle {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 12px;
    border: 1px solid;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1.6;

    &.is-on {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
      color: #2e7d32;

      &:hover {
        background: rgba(76, 175, 80, 0.2);
      }
    }

    &.is-off {
      border-color: #bbb;
      background: #f5f5f5;
      color: #999;

      &:hover {
        background: #eee;
      }
    }
  }

  .replace-sets-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    min-width: 0;
  }

  .set-tab {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 10px;
    border: 1.5px solid #d0d0d0;
    border-radius: 6px;
    background: #f5f5f5;
    color: #666;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    .set-tab-actions {
      display: flex;
      align-items: center;
      gap: 1px;
      opacity: 0;
      transition: opacity 0.15s;
    }

    .set-tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 18px;
      height: 18px;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;

      &:hover {
        background: rgba(0, 0, 0, 0.15);
      }

      &.set-tab-btn-delete:hover {
        background: rgba(220, 50, 50, 0.18);
        color: #c62828;
      }
    }

    &:hover {
      border-color: #667eea;
      color: #667eea;
      background: rgba(102, 126, 234, 0.06);

      .set-tab-actions {
        opacity: 1;
      }
    }

    &.is-active {
      border-color: #667eea;
      background: #667eea;
      color: white;
      box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);

      .set-tab-actions {
        opacity: 1;
      }
    }

    &.set-tab-add {
      border-style: dashed;
      border-color: #667eea;
      background: transparent;
      color: #667eea;
      font-size: 16px;
      line-height: 1;
      padding: 4px 12px;

      &:hover {
        background: rgba(102, 126, 234, 0.1);
      }
    }
  }
}

.replace-files-container {
  .replace-files-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    max-height: 120px; // 约2行的高度
    overflow-y: auto;
    padding: 8px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: rgba(102, 126, 234, 0.02);

    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 3px;

      &:hover {
        background: #5568d3;
      }
    }
  }

  .file-tag {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 32px 8px 12px;
    border: 2px solid;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;

    .file-name {
      font-family: 'Consolas', 'Monaco', monospace;
    }

    .check-icon {
      color: #4caf50;
      font-weight: bold;
      font-size: 16px;
    }

    .toggle-icon {
      font-size: 12px;
      line-height: 1;
      cursor: pointer;
      color: #4caf50;
      transition: color 0.2s;
      padding: 2px;
      border-radius: 50%;

      &:hover {
        color: #e57373;
      }
    }

    .remove-icon {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-size: 16px;
      font-weight: bold;
      opacity: 0;
      transition: opacity 0.2s;

      &:hover {
        background: rgba(0, 0, 0, 0.1);
      }
    }

    &:hover .remove-icon {
      opacity: 1;
    }

    &.active {
      border-color: #4caf50;
      background: rgba(76, 175, 80, 0.1);
      color: #2e7d32;

      &:hover {
        border-color: #45a049;
        background: rgba(76, 175, 80, 0.15);
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
      }
    }

    &.inactive {
      border-color: #ccc;
      border-style: dashed;
      background: #f9f9f9;
      color: #999;

      &:hover {
        border-color: #999;
        background: #f0f0f0;
        transform: translateY(-2px);
      }
    }

    &.disabled-tag {
      border-color: #bbb;
      background: #f0f0f0;
      color: #aaa;
      opacity: 0.65;
      text-decoration: line-through;

      .disabled-icon {
        color: #e57373;
        font-size: 15px;
      }

      &:hover {
        opacity: 0.85;
        transform: translateY(-1px);
      }
    }

    &.add-tag {
      border-color: #667eea;
      border-style: dashed;
      background: rgba(102, 126, 234, 0.05);
      color: #667eea;

      .add-icon {
        font-size: 18px;
        font-weight: bold;
      }

      &:hover {
        border-style: solid;
        background: rgba(102, 126, 234, 0.1);
        transform: translateY(-2px);
      }
    }
  }
}

// wing.properties 配置区域
.wing-properties-section {
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: rgba(102, 126, 234, 0.05);

  .properties-select {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
  }
}

// NVM 胶囊徽章
.label-with-nvm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
padding-right: 92px;
  label {
    margin-bottom: 0;
  }
}

.nvm-badge {
  display: inline-flex;
  align-items: center;
  gap: 0;
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 20px;
  overflow: hidden;
  transition: border-color 0.2s, background 0.2s;
  cursor: pointer;

  &:hover {
    background: rgba(102, 126, 234, 0.14);
    border-color: #667eea;
  }

  &.ok {
    border-color: rgba(76, 175, 80, 0.5);
    background: rgba(76, 175, 80, 0.08);
    .nvm-badge-prefix { background: #4caf50; }
  }

  &.err {
    border-color: rgba(244, 67, 54, 0.5);
    background: rgba(244, 67, 54, 0.06);
    .nvm-badge-prefix { background: #f44336; }
  }

  .nvm-badge-prefix {
    padding: 2px 7px;
    background: #667eea;
    color: white;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 18px;
    border-radius: 20px 0 0 20px;
    transition: background 0.2s;
    user-select: none;
  }

  .nvm-badge-select {
    appearance: none;
    border: none;
    background: transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5' viewBox='0 0 8 5'%3E%3Cpath fill='%23667eea' d='M0 0l4 5 4-5z'/%3E%3C/svg%3E") no-repeat right 6px center;
    padding: 2px 20px 2px 7px;
    font-size: 12px;
    font-family: 'Consolas', 'Monaco', monospace;
    font-weight: 600;
    color: #445;
    cursor: pointer;
    outline: none;
    line-height: 18px;

    &:disabled { opacity: 0.55; cursor: not-allowed; }
  }

  .nvm-badge-spinner {
    padding-right: 6px;
    font-size: 13px;
    color: #667eea;
    animation: nvmSpin 0.8s linear infinite;
    line-height: 1;
  }
}

@keyframes nvmSpin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}

.button-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.btn-build {
  padding: 16px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  color: white;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }

  &.btn-frontend {
    background: linear-gradient(135deg, #42b883 0%, #35495e 100%);
  }

  &.btn-backend {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  }

  &.btn-all {
    background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  }

  &.btn-replace {
    background: linear-gradient(135deg, #f093fb 0%, #4facfe 100%);
  }
}

.log-section {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  margin-bottom: 0;
  min-height: 0;
  
  .log-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    gap: 12px;

    h3 {
      margin: 0;
      color: #333;
    }

    .log-title-group {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .right-tool-tabs {
      display: inline-flex;
      padding: 3px;
      border: 1px solid #d8dcef;
      border-radius: 8px;
      background: #f5f7ff;

      button {
        min-width: 52px;
        padding: 5px 10px;
        border: none;
        border-radius: 6px;
        background: transparent;
        color: #5b647a;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          color: #667eea;
        }

        &.active {
          background: #667eea;
          color: white;
          box-shadow: 0 2px 6px rgba(102, 126, 234, 0.25);
        }
      }
    }

    .log-actions {
      display: flex;
      gap: 10px;
    }

    .btn-stop {
      padding: 6px 12px;
      background: #ff9800;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;

      &:hover {
        background: #f57c00;
      }
    }

    .btn-clear {
      padding: 6px 12px;
      background: #ff6b6b;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;

      &:hover {
        background: #ee5a52;
      }
    }

    .btn-copy-result {
      padding: 6px 12px;
      background: #4caf50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;

      &:hover {
        background: #45a049;
      }
    }
  }

  .log-container {
    background: #1e1e1e;
    border-radius: 6px;
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
    word-break: break-all;
    white-space: pre-wrap;
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: 13px;
    color: #FFFFFF;

    &::-webkit-scrollbar {
      width: 8px;
    }

    &::-webkit-scrollbar-track {
      background: #2d2d2d;
      border-radius: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #555;
      border-radius: 4px;

      &:hover {
        background: #666;
      }
    }
  }

  .log-item {
    padding: 6px 0;
    line-height: 1.5;

    &.log-info {
      color: #61dafb;
    }

    &.log-success {
      color: #4caf50;
    }

    &.log-warning {
      color: #ff9800;
    }

    &.log-error {
      color: #f44336;
    }
  }

  .crypto-tool {
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

  .crypto-field {
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
      min-height: 120px;
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

      &[readonly] {
        background: #fff;
      }
    }
  }

  .crypto-output-field {
    flex: 1;

    textarea {
      flex: 1;
      min-height: 120px;
    }
  }

  .crypto-actions {
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
      transition: all 0.2s;

      &:hover {
        transform: translateY(-1px);
      }
    }

    .btn-encrypt {
      background: #667eea;

      &:hover {
        background: #5568d3;
      }
    }

    .btn-decrypt {
      background: #00a6a6;

      &:hover {
        background: #008f8f;
      }
    }
  }

  .crypto-status {
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
}

// War包管理区域
.war-files-section {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  color: #333;
  display: flex;
  flex-direction: column;
  flex: 0 0 180px;

  .war-files-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;

    h3 {
      margin: 0;
      color: #333;
    }

    .war-files-actions {
      display: flex;
      gap: 8px;

      button {
        padding: 6px 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.2s;
      }

      .btn-refresh {
        background: #4caf50;
        color: white;
        padding: 6px 10px;
        font-size: 16px;

        &:hover {
          background: #45a049;
          transform: rotate(90deg);
        }
      }

      .btn-open-folder {
        background: #667eea;
        color: white;

        &:hover {
          background: #5568d3;
        }
      }
    }
  }

  .war-files-container {
    flex: 1;
    overflow-y: hidden;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .empty-hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #999;

    p {
      margin: 8px 0;
    }

    p:first-child {
      font-size: 18px;
      font-weight: 600;
    }

    .hint-text {
      font-size: 14px;
      color: #bbb;
    }
  }

  .config-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
    color: #ff9800;
    font-size: 14px;
    font-weight: 600;
  }

  .war-files-grid {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 12px;
    padding: 4px;
    overflow-x: auto;
    overflow-y: hidden;
    flex: 1;
    align-items: stretch;
    min-height: 0;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: #667eea;
      border-radius: 3px;

      &:hover {
        background: #5568d3;
      }
    }
  }

  .war-file-card {
    position: relative;
    background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
    border: 2px solid #e0e0e0;
    border-radius: 10px;
    padding: 8px;
    cursor: move;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    width: fit-content;
    height: 100px;

    &:hover {
      border-color: #667eea;
      transform: translateY(-3px);
      box-shadow: 0 6px 12px rgba(102, 126, 234, 0.2);
    }

    &.is-latest {
      border-color: #4caf50;
      background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
      animation: latestPulse 2s ease-in-out;
    }

    &.is-selected-for-replace {
      border-color: #ff9800;
      background: linear-gradient(135deg, #fff8e1 0%, #ffe0b2 100%);
      box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.3);
    }

    .file-info {
      flex: 1;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      min-height: 0;

      .file-name {
        font-weight: 700;
        font-size: 15px;
        color: #333;
        margin-bottom: 8px;
        word-break: break-all;
        line-height: 1.4;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        text-align: center;
      }

      .file-meta {
        display: flex;
        flex-direction: column;
        gap: 3px;
        font-size: 13px;
        color: #666;
        align-items: center;

        .file-size {
          font-weight: 600;
          color: #667eea;
        }

        .file-time {
          color: #999;
        }
      }
    }

    .latest-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #4caf50;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(76, 175, 80, 0.3);
    }

    .selected-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      background: #ff9800;
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(255, 152, 0, 0.3);
    }


  }
}

// 对话框
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.dialog {
  background: white;
  border-radius: 12px;
  padding: 30px;
  min-width: 400px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease;

  h3 {
    margin: 0 0 20px 0;
    color: #333;
    font-size: 1.5rem;
  }

  .dialog-input {
    width: 100%;
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 15px;
    margin-bottom: 20px;
    box-sizing: border-box;

    &:focus {
      outline: none;
      border-color: #667eea;
    }
  }

  .form-group-inline {
    margin-top: 4px;
    margin-bottom: 8px;

    .checkbox-label {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      font-size: 14px;
      color: #555;

      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
        accent-color: #667eea;
      }
    }
  }

  .dialog-actions {
    justify-content: flex-end;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 10px;

    button {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    }

    .btn-cancel {
      background: #e0e0e0;
      color: #555;

      &:hover {
        background: #d0d0d0;
      }
    }

    .btn-delete-inline {
      background: #ff6b6b;
      color: white;

      &:hover {
        background: #ee5a52;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
      }
    }
  }
}

// 配置文件替换弹窗特殊样式
.replace-file-dialog {
  min-width: 500px;

  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: #555;
    }

    .input-group {
      display: flex;
      gap: 10px;

      .dialog-input {
        flex: 1;
        margin-bottom: 0;
      }

      .btn-search,
      .btn-browse {
        padding: 12px 16px;
        background: #667eea;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 16px;
        transition: background 0.3s;

        &:hover {
          background: #5568d3;
        }

        &:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      }
    }
  }

  .file-name-hint {
    margin-top: 8px;
    padding: 8px 12px;
    background: rgba(102, 126, 234, 0.1);
    border-left: 3px solid #667eea;
    border-radius: 4px;
    color: #667eea;
    font-size: 13px;
    font-weight: 500;
  }
}

// 打包动画
@keyframes buildingPulse {
  0%, 100% {
    background-position: 0% 50%;
    opacity: 1;
  }
  50% {
    background-position: 100% 50%;
    opacity: 0.85;
  }
}

@keyframes buildingSpin {
  0% {
    transform: translate(-50%, -50%) rotate(0deg) scale(1);
  }
  25% {
    transform: translate(-50%, -50%) rotate(90deg) scale(1.1);
  }
  50% {
    transform: translate(-50%, -50%) rotate(180deg) scale(1);
  }
  75% {
    transform: translate(-50%, -50%) rotate(270deg) scale(1.1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(360deg) scale(1);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateY(-50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes latestPulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(76, 175, 80, 0);
  }
}
</style>
