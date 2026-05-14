<template>
  <div class="node-wrap">{{ text }}</div>
</template>

<script setup>
const text = ref('测试节点');
const node = inject('getNode')();
const graph = inject('getGraph')();

node.on('change:data', ({ current }) => {
  const { progress } = current;
  text.value = progress;
});
</script>

<style lang="scss" scoped>
.node-wrap {
  height: 80px;
  width: 192px;
  background: #fff;
}
</style>
