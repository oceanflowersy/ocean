<template>
  <div>
    <Carousel :images="images" :showNumber="3" :autoPlay="true" :autoPlayInterval="2000" />
  </div>
</template>

<script setup>
import Carousel from './components/Carousel/Carousel.vue';

const images = ref(['/public/images/scenery/01.jpg', 'public/images/scenery/02.jpg', 'public/images/scenery/03.jpg', 'public/images/scenery/04.jpg', 'public/images/scenery/05.jpg']);
</script>

<style lang="scss" scoped></style>
