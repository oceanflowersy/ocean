<template>
  <div id="bmapPage">
    <BMap
      :restrict-center="true"
      :api-url="bMap.apiUrl"
      enable-scroll-wheel-zoom
      :center="bMap.mapCenter"
      height="100%"
      :zoom="bMap.mapZoom"
      :min-zoom="bMap.minZoom"
      :max-zoom="bMap.maxZoom"
      @initd="bMap.bMapInit"
      @dragend="bMap.handleBMapDragend"
      @zoomend="bMap.handleZoomEnd">
    </BMap>
  </div>
</template>

<script setup>
import { BMap } from 'vue3-baidu-map-gl';
import { useBMap } from './index';

const bMap = reactive(useBMap());
</script>

<style lang="scss" scoped>
#bmapPage {
  height: 100%;
  width: 100%;
}
.map-body {
  position: relative;
  height: 500px;
  border: 1px solid #dcdfe6;
}
</style>
