<template>
  <div class="index-container">
    <div class="index-header">index</div>
    <component :is="currentCmp"></component>
  </div>
</template>

<script setup>
const myComponents = shallowRef({});
const currentCmp = shallowRef(null);

const defaultLeftTabs = [{ cmptitle: 'SVG平面图', cmpcode: 'SvgModel' }];
const onCmpClick = (tab) => {
  currentCmp.value = myComponents[tab.cmpcode];
};

onMounted(async () => {
  // 使用 Vite 的 import.meta.glob 动态加载所有组件
  const modules = import.meta.glob('../components/*/*.vue');

  for (const path in modules) {
    // 等待模块加载
    // const module = await modules[path]();

    // 提取组件名称
    const componentName = path.match(/\.\/components\/(.*)\/(.*)\.vue$/)[2];

    // 方案一: 普通引入
    // myComponents[componentName] = module.default;

    // 方案二: 异步组件
    // 使用 defineAsyncComponent 来注册异步组件
    myComponents[componentName] = defineAsyncComponent(modules[path]);
  }

  currentCmp.value = myComponents[defaultLeftTabs[0].cmpcode];
});
</script>

<style lang="scss" scoped>
.index-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  .index-header {
  }
}
</style>
