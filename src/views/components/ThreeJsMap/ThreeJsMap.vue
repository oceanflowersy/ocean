<template>
  <div class="container">
    <div id="TMapContainer"></div>

    <!-- UV贴图调整控制面板 -->
    <div class="uv-controls" v-if="showUVControls">
      <h4>UV贴图调整</h4>
      <div class="control-group">
        <label>X偏移:</label>
        <input type="range" v-model="gui.offsetX" min="-1" max="1" step="0.01" @input="updateUV" />
        <span>{{ gui.offsetX }}</span>
      </div>
      <div class="control-group">
        <label>Y偏移:</label>
        <input type="range" v-model="gui.offsetY" min="-1" max="1" step="0.01" @input="updateUV" />
        <span>{{ gui.offsetY }}</span>
      </div>
      <div class="control-group">
        <label>X缩放:</label>
        <input type="range" v-model="gui.repeatX" min="0.1" max="1" step="0.01" @input="updateUV" />
        <span>{{ gui.repeatX }}</span>
      </div>
      <div class="control-group">
        <label>Y缩放:</label>
        <input type="range" v-model="gui.repeatY" min="0.1" max="1" step="0.01" @input="updateUV" />
        <span>{{ gui.repeatY }}</span>
      </div>
      <div class="control-group">
        <label>旋转:</label>
        <input type="range" v-model="gui.rotation" min="0" max="6.28" step="0.01" @input="updateUV" />
        <span>{{ ((gui.rotation * 180) / Math.PI).toFixed(1) }}°</span>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="controls">
      <div class="control-btn" @click="showUVControls = !showUVControls">UV</div>
      <div class="control-btn">+</div>
      <div class="control-btn">-</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useThreeMap } from './index';

// 控制面板显示状态
const showUVControls = ref(false);

// 使用组合式API
const { mapContainer, scene, camera, renderer, map, gui, updateUV } = useThreeMap();

// 这里可以暴露一些方法供父组件调用
defineExpose({
  scene,
  camera,
  renderer,
  map,
  gui,
  updateUV
});
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
  background: url(/public/bg.png);
}

#TMapContainer {
  position: absolute;
  width: 100%;
  height: 100%;
}

// UV控制面板样式
.uv-controls {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 8px;
  padding: 15px;
  color: white;
  z-index: 100;

  h4 {
    margin: 0 0 15px 0;
    color: #fff;
    text-align: center;
  }

  .control-group {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    gap: 10px;

    label {
      width: 60px;
      font-size: 12px;
      color: #ccc;
    }

    input[type='range'] {
      flex: 1;
      height: 20px;
      background: #333;
      border-radius: 10px;
      outline: none;

      &::-webkit-slider-thumb {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
      }

      &::-moz-range-thumb {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #007bff;
        cursor: pointer;
        border: none;
      }
    }

    span {
      width: 50px;
      font-size: 11px;
      color: #ccc;
      text-align: right;
    }
  }
}

.controls {
  position: absolute;
  bottom: 50px;
  left: 50px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10;

  .control-btn {
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.4);
    }
  }
}
</style>
