<template>
  <div class="svgmodel-container">
    <div class="left">
      <svgModel ref="svgModelRef" :houseData="data"></svgModel>
      <div>1</div>
    </div>
    <div class="floors">
      <div class="floors-tabs">
        <div v-for="tab in tabs" :key="tab.id" :class="['tab', { active: activeTab === tab.id }]" @click="activeTab = tab.id">
          {{ tab.name }}
        </div>
      </div>
      <div class="floors-list-wrap">
        <div class="floors-list" :style="getListHeight">
          <div style="width: 50%" v-for="(floor, floorIdx) in floorData" v-key="floorIdx">
            <div class="floorName">{{ floor.floorName }}</div>
            <div class="rooms" v-for="(room, idx) in floor.rooms" v-key="idx" @click="roomDeptClick(room)">
              <div class="room-label" v-if="room.buildLabel">（{{ room.buildLabel }}）</div>
              <div class="room-label" v-else></div>
              <div class="room-typeName">{{ room.roomDeptName }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup name="SvgModel">
import data from './data/data.json';
import floorData from './data/floorData.json';
import svgModel from './components/svgModel.vue';

const svgModelRef = ref(null);
const tabs = ref([
  { name: '楼层引导图', id: 1 },
  { name: '数据汇总', id: 2 }
]);
const activeTab = ref(1);

const roomDeptClick = (room) => {
  svgModelRef.value.onSearch(room.roomDept);
};
const getListHeight = computed(() => {
  const sum = floorData.reduce((acc, floor) => acc + floor.rooms.length + 1, 0);

  const avg = sum / 2;
  let left = 0;
  let right = 0;

  for (let idx = 0; idx < floorData.length; idx++) {
    const floor = floorData[idx];
    const floorSum = floor.rooms.length + 1;
    left += floorSum;

    if (left > avg) {
      right = sum - left - floorSum;
      break;
    }
  }

  const max = Math.max(left, right);

  return {
    height: `${max * 30 + 15}px`
  };
});
const init = () => {};
onMounted(() => {
  init();
});
</script>

<style lang="scss" scoped>
.svgmodel-container {
  display: flex;
  gap: 16px;
  padding: 16px;
  height: 100%;
  background: #eaeaea;

  .left {
    flex: 1 1 70%;
  }
  .floors {
    $rowHeight: 30px;

    display: flex;
    flex-direction: column;
    flex: 1 1 30%;
    height: 100%;

    .floors-tabs {
      display: flex;
      width: 100%;
      background: #ffffff;

      .tab {
        width: 50%;
        height: 60px;
        line-height: 60px;
        text-align: center;
        color: #177973;
        cursor: pointer;
      }
      .tab.active {
        background: #177973;
        border-bottom: 1px solid #ffffff;
        color: #ffffff;
      }
    }
    .floors-list-wrap {
      display: flex;
      height: calc(100% - 60px);
      overflow: auto;
      background: #ffffff;
      .floors-list {
        display: flex;
        flex-direction: column;
        flex-wrap: wrap;
        min-height: 100%;
        width: 100%;
        background: #ffffff;

        .floorName {
          height: $rowHeight;
          padding-left: 10px;
          line-height: $rowHeight;
          color: #ffffff;
          background: #177973;
        }
        .rooms {
          display: flex;
          align-items: center;
          padding: 0 12px;
          height: $rowHeight;
          font-size: 12px;
          cursor: pointer;

          .room-label {
            width: 70px;
          }
          .room-typeName {
            flex: 1;
            white-space: nowrap;
          }
        }
      }
    }
  }
}
</style>
