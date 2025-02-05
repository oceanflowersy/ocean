<template>
  <div id="map_canvas" style="width: 600px; height: 500px"></div>
</template>

<script setup>
const BMapGLLib = window.BMapGLLib;
var map = new BMapGL.Map('map_canvas');
var poi = new BMapGL.Point(116.307852, 40.057031);
console.log(BMapGLLib.InfoBox);
</script>

<style lang="scss" scoped>
.map-body {
  position: relative;
  height: 500px;
  border: 1px solid #dcdfe6;
}
</style>
