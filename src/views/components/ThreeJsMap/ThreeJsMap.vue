<template>
  <div class="container">
    <div id="TMapContainer"></div>
  </div>
</template>

<script setup>
import { useThreeMap } from './index';

const TMap = reactive(useThreeMap());

const initMap = (params) => {};
onMounted(() => {
  initMap();
});
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100%;
}
#TMapContainer {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
