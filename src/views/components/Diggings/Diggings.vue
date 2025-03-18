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

.Tooltip-label {
  width: 0px;
  height: 0px;
  position: relative;
}
.Tooltip-lable-content {
  width: 200px;
  height: 35px;
  line-height: 35px;
  text-align: center;
  color: white;
  position: absolute;
  top: -4px;
  left: -4px;
  background-size: contain;
  background-repeat: no-repeat;
}
</style>
