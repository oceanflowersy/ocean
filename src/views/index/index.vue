<template>
  <div class="index-container">
    <div ref="dragArea" class="drag-area">
      <div class="tabs" v-if="tabShow">
        <template v-for="(item, idx) in defaultLeftTabs">
          <div class="tab" @click="onCmpClick(item)">{{ item.cmpcode }}</div>
        </template>
      </div>
    </div>
    <Suspense>
      <div style="height: 100%">
        <component :is="currentCmp"></component>
      </div>
    </Suspense>
  </div>
</template>

<script setup>
const myComponents = shallowRef({});
const currentCmp = shallowRef(null);

const defaultLeftTabs = [
  { cmptitle: 'Stagehand', cmpcode: 'Stagehand' },
  { cmptitle: 'PackTool', cmpcode: 'PackTool' },
  { cmptitle: 'TreJAntvX6s', cmpcode: 'AntvX6' },
  { cmptitle: 'TreJs', cmpcode: 'TreJs' },
  { cmptitle: 'Swiper', cmpcode: 'Swipers' },
  { cmptitle: 'BMap离线地图', cmpcode: 'OffineBMap' },
  { cmptitle: '矿山可研', cmpcode: 'Diggings' },
  { cmptitle: 'ThreeJs 3D地图', cmpcode: 'ThreeJsMap' },
  { cmptitle: 'SVG平面图', cmpcode: 'SvgModel' }
];
const dragArea = ref(null);
const tabShow = ref(false);
function onCmpClick(tab) {
  currentCmp.value = myComponents[tab.cmpcode];
  tabShow.value = false;
}
function dragClick(e) {
  const target = e.target;
  if (target.className !== 'tab') {
    tabShow.value = !tabShow.value;
  }
}
function init() {
  nextTick(() => {
    let clientOffset = {}; // 用于缓存点击时的坐标
    let isDragging = false; // 标记是否正在拖动
    dragArea.value.addEventListener(
      'mousedown',
      (event) => {
        let offsetX = dragArea.value.getBoundingClientRect().left;
        let offsetY = dragArea.value.getBoundingClientRect().top;
        let innerX = event.clientX - offsetX;
        let innerY = event.clientY - offsetY;

        // 缓存鼠标点击时的位置
        clientOffset.clientX = event.clientX;
        clientOffset.clientY = event.clientY;

        // 初始化点击标记
        isDragging = false;

        // 鼠标移动事件
        document.onmousemove = function (moveEvent) {
          // 如果鼠标位移超过阈值，认为是拖动
          if (Math.abs(moveEvent.clientX - clientOffset.clientX) > 5 || Math.abs(moveEvent.clientY - clientOffset.clientY) > 5) {
            isDragging = true;
          }

          // 执行拖动
          dragArea.value.style.left = moveEvent.clientX - innerX + 'px';
          dragArea.value.style.top = moveEvent.clientY - innerY + 'px';

          let dragAreaTop = window.innerHeight - dragArea.value.getBoundingClientRect().height;
          let dragAreaLeft = window.innerWidth - dragArea.value.getBoundingClientRect().width;

          // 边界处理
          if (dragArea.value.getBoundingClientRect().left <= 0) {
            dragArea.value.style.left = '0px';
          }
          if (dragArea.value.getBoundingClientRect().left >= dragAreaLeft) {
            dragArea.value.style.left = dragAreaLeft + 'px';
          }
          if (dragArea.value.getBoundingClientRect().top <= 0) {
            dragArea.value.style.top = '0px';
          }
          if (dragArea.value.getBoundingClientRect().top >= dragAreaTop) {
            dragArea.value.style.top = dragAreaTop + 'px';
          }
        };

        // 鼠标释放事件
        document.onmouseup = function (upEvent) {
          document.onmousemove = null;
          document.onmouseup = null;

          // 如果没有拖动，则认为是点击操作
          if (!isDragging) {
            dragClick(upEvent);
          }
        };
      },
      false
    );
  });
}

function initCmp(event) {
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
}
onMounted(async () => {
  initCmp();
  init();
});
</script>

<style lang="scss" scoped>
.index-container {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  .drag-area {
    position: fixed;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    padding: 13px;
    width: 50px;
    height: 50px;
    opacity: 1;
    background-color: rgba(223, 16, 16, 0.1);
    border-radius: 8px;
    box-shadow: 0px 2px 15px 0px rgba(9, 41, 77, 0.15);
    cursor: move;
    user-select: none;
    text-align: center;
    z-index: 99999;

    .tabs {
      position: absolute;
      right: -130px;
      padding: 5px;
      width: 120px;
      background: gray;
      opacity: 0.8;
      .tab {
        height: 30px;
        line-height: 30px;
        cursor: pointer;
        &:hover {
          background: #f0f0f0;
        }
      }
    }
  }
}
</style>
