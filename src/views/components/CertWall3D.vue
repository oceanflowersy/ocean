<template>
  <section class="cert-3d-wrapper">
    <div class="scene">
      <!-- 中间主视觉图-->
      <div class="green-circle">
        <img class="bottom-circle" :src="utils.baseImgFormat('/img/water/main.png')" alt="" />
      </div>

      <!-- 环绕照片墙（绕中间 main 公转） -->
      <div class="swiper-box">
        <div v-for="(item, index) in list" :key="`img-${index}`" class="loop-item" :style="getItemStyle(index)" @click="openViewer(index)">
          <div class="img-box">
            <img class="alarm-img" :src="item" alt="" />
          </div>
        </div>
      </div>
    </div>

    <teleport to="body">
      <el-image-viewer v-if="showViewer" :url-list="list" :initial-index="currentIndex" @close="showViewer = false" />
    </teleport>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import { ElImageViewer } from 'element-plus'; // 确保已在 main 里引入 element-plus 样式

import { useUtils } from '@/utils/util/utils';

const utils = useUtils();
const props = defineProps({
  list: {
    type: Array,
    required: false
  }
});

// 图片列表
const list = computed(() => props.list || []);

// 预览相关
const showViewer = ref(false);
const currentIndex = ref(0);

const openViewer = (index) => {
  currentIndex.value = index;
  showViewer.value = true;
};

// 环的半径
const RADIUS_VW = 13;

// 根据下标计算每个图片在圆环上的位置
const getItemStyle = (index) => {
  const len = list.value.length || 1;
  const angle = (360 / len) * index; // 每张图的角度

  return {
    transform: `
      translate(-50%, -50%)
      rotateY(${angle}deg)
      translateZ(${RADIUS_VW}vw)
    `
  };
};
</script>

<style lang="scss" scoped>
.cert-3d-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  perspective: 1200px;

  .scene {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transform: rotateX(-12deg) translateY(-50px);
  }

  .green-circle {
    position: absolute;
    top: 50%;
    left: 50%;
    transform-style: preserve-3d;
    transform: translate(-50%, -50%) translateZ(8vw);

    width: 100%;
    height: 100%;
    pointer-events: none;

    .bottom-circle {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  }

  .swiper-box {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;

    animation: three-dimensions-circle 30s linear infinite;

    .loop-item {
      position: absolute;
      top: 50%;
      left: 50%;
      cursor: pointer;
      text-align: center;
      transform-style: preserve-3d;
    }
  }
}

.img-box {
  padding: 2px;
  background: linear-gradient(135deg, #60fcef, #1f92ef);
  box-shadow:
    0 0 12px rgba(96, 252, 239, 0.7),
    0 0 20px rgba(31, 146, 239, 0.4);
  display: inline-block;
}

.alarm-img {
  width: 200px;
  aspect-ratio: 3 / 4;
  display: block; // 去掉基线空隙
  object-fit: cover;
}

@keyframes three-dimensions-circle {
  0% {
    transform: rotateY(0deg);
  }
  100% {
    transform: rotateY(-360deg);
  }
}
</style>
<style lang="scss">
.el-image-viewer__wrapper {
  z-index: 999999 !important;
  position: fixed !important;
  inset: 0 !important;
}
</style>
