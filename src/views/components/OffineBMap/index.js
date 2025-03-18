export function useBMap() {
  const apiUrl = '/public/static/offlinemap/getMapApi.js';
  const instance = ref(null); // 地图实例
  const mapZoom = ref(10.2);
  const minZoom = 10.2;
  const maxZoom = 18;
  const mapCenter = ref({ lng: 118.798677, lat: 32.031716 });
  const restrictArea = ref(null); // 限制拖动区域

  // 拖拽结束，判断地图是否在限制区域内，不在则飞回中心点
  function handleBMapDragend() {
    if (!restrictArea.value.containsBounds(instance.value.getBounds())) {
      const tilt = instance.value.getTilt();
      instance.value.flyTo(new BMapGL.Point(mapCenter.value.lng, mapCenter.value.lat), mapZoom.value, { tilt });
    }
  }
  // 初始化地图
  async function bMapInit({ map }) {
    instance.value = map;
    instance.value.displayOnMinLevel = 0;
    instance.value.displayOnMaxLevel = 0;
    // 设置地图的拖拽限制
    restrictArea.value = new BMapGL.Bounds(new BMapGL.Point(115.07, 29.03), new BMapGL.Point(122.90535010781169, 35.160813327166025));
    instance.value.restrictBounds(restrictArea.value);
  }
  return {
    apiUrl,
    instance,
    mapZoom,
    minZoom,
    maxZoom,
    mapCenter,
    bMapInit,
    handleBMapDragend
  };
}
