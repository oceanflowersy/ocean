<template>
  <div class="container">
    <div id="TContainer"></div>
  </div>
</template>

<script setup>
import { useThreeModel } from './index';

const TModel = reactive(useThreeModel());

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
#TContainer {
  position: absolute;
  width: 100%;
  height: 100%;
}
</style>
