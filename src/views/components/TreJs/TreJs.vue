<template>
  <div>
    <TresCanvas window-size preset="realistic" @created="onCanvasCreated">
      <TresPerspectiveCamera :position="[3, 3, 3]" :look-at="[0, 0, 0]" />
      <TresMesh>
        <TresTorusGeometry :args="[1, 0.5, 16, 32]" />
        <TresMeshBasicMaterial color="orange" />
      </TresMesh>
      <TresAmbientLight :intensity="1" />
      <TresOrbitControls v-if="state.renderer" :args="[state.camera, state.renderer?.domElement]" />
    </TresCanvas>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { TresCanvas, useRenderLoop } from '@tresjs/core';
import { OrbitControls } from 'three/addons/controls/OrbitControls';

// 状态管理
const state = reactive({
  renderer: null,
  camera: null,
  controls: null,
  scene: null,
  isInitialized: false,
  frameId: null
});

// 帧率控制
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;
let lastFrameTime = 0;

// 渲染循环
const { onLoop } = useRenderLoop();

// 初始化场景
const onCanvasCreated = ({ renderer, camera, scene }) => {
  state.renderer = renderer;
  state.camera = camera;
  state.scene = scene;

  // 初始化 OrbitControls
  state.controls = new OrbitControls(camera, renderer.domElement);
  state.controls.enableDamping = true; // 启用阻尼效果
  state.controls.dampingFactor = 0.05; // 阻尼系数

  // 启动渲染循环
  startRenderLoop();
  state.isInitialized = true;
};

// 启动渲染循环
const startRenderLoop = () => {
  onLoop(({ delta }) => {
    const now = performance.now();
    if (now - lastFrameTime >= frameInterval) {
      state.controls.update(); // 更新控制器
      state.renderer.render(state.scene, state.camera);
      lastFrameTime = now;
    }
  });
};

// 清理资源
const cleanup = () => {
  if (state.controls) {
    state.controls.dispose(); // 销毁控制器
  }
  if (state.renderer) {
    state.renderer.dispose(); // 销毁渲染器
  }
  state.isInitialized = false;
};

// 组件卸载时清理
onUnmounted(() => {
  cleanup();
});

// 错误处理
onMounted(() => {
  if (!state.isInitialized) {
    console.error('Failed to initialize 3D scene.');
  }
});
</script>

<style lang="scss" scoped>
div {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
