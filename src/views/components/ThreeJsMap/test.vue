<template>
  <div class="test-container">
    <h2>Three.js 3D地图测试</h2>
    <ThreeJsMap />
  </div>
</template>

<script setup>
import ThreeJsMap from './ThreeJsMap.vue';
</script>

<style scoped>
.test-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

h2 {
  padding: 10px;
  margin: 0;
  background: #333;
  color: white;
  text-align: center;
}
</style>
