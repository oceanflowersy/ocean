// #region
/* 1. 报错：TypeError: 'get' on proxy: property 'modelViewMatrix' is a read-only and non-configurable data property on the proxy target but the proxy did not return its actual value (expected '#<_Matrix4>' but got '#<_Matrix4>')
Vue3的响应式原理是通过Proxy实现的，Proxy的get方法会拦截对象的读取操作，
而three.js的源码中有很多属性是只读的，比如modelViewMatrix、normalMatrix等，
这些属性在three.js的源码中是通过Object.defineProperty定义的，
所以Proxy的get方法会拦截这些属性的读取操作，导致页面渲染报错 */
// #endregion
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as d3 from 'd3';

export function useThreeMap() {
  const mapContainer = ref(null);
  const map = ref(null);
  const scene = ref(null);
  const camera = ref(null);
  const renderer = ref(null);
  const mapCenter = [118.767413, 32.041544];
  const mapSize = 90;
  const mapConfig = {
    deep: 0.1
  };
  const cameraPosArr = [{ x: 0, y: 0, z: 3 }];

  const projection = d3.geoMercator().center(mapCenter).scale(mapSize).translate([0, 0]);

  const addGeometry = () => {};

  // 加载地图数据
  const loadMapData = () => {
    const loader = new THREE.FileLoader();
    loader.load('/data/nanjing.json', (data) => {
      const jsondata = JSON.parse(data);
      addMapGeometry(jsondata);
    });
  };
  const addMapGeometry = (jsondata) => {
    map.value = new THREE.Object3D();
    jsondata.features.forEach((feature) => {
      const province = new THREE.Object3D(); // 定一个省份3D对象
      const coordinates = feature.geometry.coordinates; // 每块区域坐标的数组

      coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          const shape = new THREE.Shape();
          const lineMaterial = new THREE.LineBasicMaterial({
            color: '#ffffff'
          });
          const lineGeometry = new THREE.BufferGeometry();
          const pointsArray = new Array();

          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = GetCoordinate(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
            pointsArray.push(new THREE.Vector3(x, -y, mapConfig.deep));
          }

          lineGeometry.setFromPoints(pointsArray);
          const line = new THREE.Line(lineGeometry, lineMaterial);
          province.add(line);
        });
      });
      map.value.add(province);
    });
    scene.value.add(map.value);
  };
  const GetCoordinate = (data) => {
    return projection([data[0], data[1]]); //将地理坐标（经纬度）转换为平面坐标
  };

  // 坐标轴辅助线
  const axisHelper = () => {
    const axesHelper = new THREE.AxesHelper(150);
    scene.value.add(axesHelper);
  };
  // 灯光效果初始化
  const lightInit = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.value.add(ambientLight);
  };
  // 控制器初始化
  const controllerInit = () => {
    const controller = new OrbitControls(camera.value, renderer.value.domElement);
  };
  // 渲染器初始化
  const rendererInit = () => {
    renderer.value = new THREE.WebGLRenderer();
    renderer.value.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight);
    mapContainer.value.appendChild(renderer.value.domElement);
  };
  // 相机初始化
  const cameraInit = () => {
    camera.value = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.value.position.set(cameraPosArr[0].x, cameraPosArr[0].y, cameraPosArr[0].z);
    camera.value.lookAt(new THREE.Vector3(0, 0, 0));
  };
  // 场景初始化
  const sceneInit = () => {
    scene.value = new THREE.Scene();
    // 设置背景
    const TextureLoader = new THREE.TextureLoader();
    const backgroundTexture = TextureLoader.load('/data/border.png');
    scene.value.background = backgroundTexture;
  };
  const animate = () => {
    requestAnimationFrame(animate); // 采用系统时间间隔，保持最佳绘制效率
    renderer.value.render(toRaw(scene.value), camera.value);
  };

  const init = (params) => {
    mapContainer.value = document.getElementById('TMapContainer');
    sceneInit();
    cameraInit();
    rendererInit();
    controllerInit();
    addGeometry();
    axisHelper();
    lightInit();

    loadMapData();
    // 开启渲染
    animate();
  };

  onMounted(async () => {
    init();
  });
  return {
    mapContainer
  };
}
