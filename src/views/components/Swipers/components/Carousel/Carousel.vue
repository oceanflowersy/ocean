<template>
  <div class="carousel" :style="cssVars">
    <div
      @mousedown="handleMousedown"
      @mousemove="handleMousemove"
      @mouseup="handleMouseup"
      :style="{ height: carouselHeight + (typeof carouselHeight === 'Number' && 'px') }"
      class="carousel__wrapper">
      <div @mouseenter="pauseAutoPlay" @mouseleave="resumeAutoPlay" :style="slideStyle" class="carousel__slide">
        <div class="carousel__image__container" v-for="(image, index) in showImages" :key="index">
          <el-image
            :id="index"
            :src="urlFunc(image)"
            :preview-src-list="hasPreview ? showImages.map((item) => urlFunc(item)) : []"
            :preview-teleported="true"
            :initial-index="currentPreviewIndex"
            @click="showPreview(image)"
            class="carousel__image">
            <template #error>
              <div class="image-slot">加载失败！</div>
            </template>
          </el-image>
          <slot name="image-slot" :image="image"> </slot>
        </div>
      </div>
      <div class="carousel__dots">
        <span v-for="(image, index) in images" :key="index" :class="{ active: index === currentIndex }" class="carousel__dot" />
      </div>
    </div>
    <div v-if="images.length > 1" class="carousel__control carousel__control--prev" @click="prevClick" />
    <div v-if="images.length > 1" class="carousel__control carousel__control--right" @click="nextClick" />
  </div>
</template>

<script setup>
const props = defineProps({
  // 展示的轮播图个数
  showNumber: {
    type: Number,
    default: 3
  },
  // 轮播图容器的高度
  carouselHeight: {
    tyepe: Number,
    default: 150
  },
  // 定义每张图片的宽度
  slideWidth: {
    tyepe: Number,
    default: 285
  },
  // 定义每张图片的间隔
  slideMargin: {
    tyepe: Number,
    default: 10
  },
  // 自动轮播
  autoPlay: {
    tyepe: Boolean,
    default: false
  },
  // 自动轮播间隔
  autoPlayInterval: {
    tyepe: Number,
    default: 2000
  },
  // 动画速度
  speed: {
    tyepe: Number,
    default: 0.2
  },
  hasPreview: {
    tyepe: Boolean,
    default: true
  },
  // 图片url函数
  urlFunc: {
    type: Function,
    default: (item) => {
      return item;
    }
  }
});
const images = defineModel('images', {
  type: Array,
  default: () => []
});
const slideMargin = props.showNumber > 1 ? props.slideMargin : 0;
const showImages = ref([]);
const autoPlayTimer = ref(null);
let currentIndex = ref(0);
const currentPreviewIndex = ref(0);
let slideStyle = ref({
  transform: '',
  transition: ''
});
const imgLength = images.value.length;
let startPoint = 0;
let stopPoint = 0;

const cssVars = computed(() => ({
  '--slideWidth': `${props.slideWidth}px`,
  '--slideMargin': `${slideMargin}px`,
  '--carouselHeight': `${props.carouselHeight}px`,
  '--carouselWidth': `${props.slideWidth * props.showNumber + slideMargin * (props.showNumber - 1)}px`
}));
const emits = defineEmits(['swiperClick']);
const showPreview = (image) => {
  emits('swiperClick', image);
};
const prevClick = () => {
  pauseAutoPlay();
  switchImage('prev');
};
const nextClick = () => {
  pauseAutoPlay();
  switchImage('next');
};
// 暂停和恢复自动轮播
const pauseAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
  }
};
const resumeAutoPlay = () => {
  if (props.autoPlay) {
    setAutoPlay();
  }
};

const switchImage = (direction) => {
  if (direction === 'prev') {
    currentIndex.value = currentIndex.value === 0 ? imgLength - 1 : currentIndex.value - 1;
  } else {
    currentIndex.value = currentIndex.value === imgLength - 1 ? 0 : currentIndex.value + 1;
  }
  if ((currentIndex.value === 0 && direction === 'next') || (currentIndex.value === imgLength - 1 && direction === 'prev')) {
    updateTransform(true, direction === 'prev' ? 2 : 0);
  }
  // 将updateTransform放入微队列中，下一次执行更新页面
  setTimeout(() => {
    updateTransform();
  }, 1);
};

const updateTransform = (immediate = false, step = 0) => {
  const slideIndexOffset = immediate ? currentIndex.value + step : currentIndex.value + 1;
  const slideWidth = -slideIndexOffset * (props.slideWidth + slideMargin);
  console.log('slideWidth', slideWidth, slideIndexOffset, step);
  slideStyle.value.transition = immediate ? 'none' : `transform ${props.speed}s ease-in-out`;
  slideStyle.value.transform = `translateX(${slideWidth}px)`;
};

const setAutoPlay = () => {
  autoPlayTimer.value = setInterval(() => {
    switchImage('next');
  }, props.autoPlayInterval);
};

const resetPoint = () => {
  startPoint = 0;
  stopPoint = 0;
};

const handleMousedown = (e) => {
  startPoint = e.pageX;
};

const handleMousemove = (e) => {
  stopPoint = e.pageX;
};

const handleMouseup = () => {
  if (stopPoint === 0 || startPoint - stopPoint === 0) {
    resetPoint();
  }
  if (startPoint - stopPoint > 0) {
    resetPoint();
    nextClick();
  }
  if (startPoint - stopPoint < 0) {
    resetPoint();
    prevClick();
  }
};

// 滑动切换走马灯,移动设备有效
const slideBanner = () => {
  // 选中item的盒子
  const carouselBox = document.querySelector('.carousel__wrapper');
  // 手指起点X坐标
  let startPoint = 0;
  // 手指滑动重点X坐标
  let stopPoint = 0;

  // 重置坐标
  const resetPoint = () => {
    startPoint = 0;
    stopPoint = 0;
  };
  if (carouselBox) {
    // 手指按下
    carouselBox.addEventListener('touchstart', function (e) {
      // 手指按下的时候停止自动轮播
      // 手指点击位置的X坐标
      startPoint = e.changedTouches[0].pageX;
      console.log('startPoint');
    });
    // 手指滑动
    carouselBox.addEventListener('touchmove', function (e) {
      // 手指滑动后终点位置X的坐标
      stopPoint = e.changedTouches[0].pageX;
    });
    // 当手指抬起的时候，判断图片滚动离左右的距离
    carouselBox.addEventListener('touchend', function () {
      if (stopPoint === 0 || startPoint - stopPoint === 0) {
        resetPoint();
      }
      if (startPoint - stopPoint > 0) {
        resetPoint();
        nextClick();
      }
      if (startPoint - stopPoint < 0) {
        resetPoint();
        prevClick();
      }
    });
  }
};
onMounted(() => {
  if (Array.isArray(images.value)) {
    showImages.value = images.value.slice();

    showImages.value.unshift(images.value[images.value.length - 1]);

    for (let i = 0; i < props.showNumber; i++) {
      showImages.value.push(images.value[i]);
    }
    console.log('unshift', showImages.value);
  }
  updateTransform();
  // 移动设备执行
  // slideBanner();
  if (props.autoPlay) {
    setAutoPlay();
  }
});

onBeforeUnmount(() => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
  }
});
</script>

<style lang="scss" scoped>
@mixin absolute-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
.carousel {
  position: relative;
  width: var(--carouselWidth);
  height: var(--carouselHeight);
  overflow: hidden;

  .carousel__wrapper {
    display: flex;
    height: 100%;
    // 开启硬件加速
    // transform: translate3d(0, 0, 0);
    // 动画更加流畅
    // will-change: transition;
    .carousel__slide {
      display: flex;
      .carousel__image__container {
        position: relative;
        .carousel__image {
          width: var(--slideWidth);
          height: 100%;
          margin-right: var(--slideMargin);
          cursor: pointer;
          // 穿透
          // pointer-events: none;
        }
      }
    }

    .carousel__dots {
      position: absolute;
      bottom: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;

      .carousel__dot {
        width: 10px;
        height: 10px;
        background-color: #ccc;
        border-radius: 50%;
        margin: 0 5px;
        cursor: pointer;
      }
      .carousel__dot.active {
        background-color: var(--el-color-primary);
      }
    }
  }
  .carousel__control {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    height: 45px;
    width: 45px;
    border: none;
    border-radius: 50%;
    font-size: 28px;
    color: white;
    background-color: rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }

  .carousel__control--prev {
    left: 10px;
    &::after {
      content: '\2039';
      @include absolute-center;
      top: 45%;
    }
  }

  .carousel__control--right {
    right: 10px;
    &::after {
      content: '\203A';
      @include absolute-center;
      top: 45%;
    }
  }
}
</style>
