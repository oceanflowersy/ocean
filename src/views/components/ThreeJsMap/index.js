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
import { ref, onMounted, onUnmounted, toRaw } from 'vue';

export function useThreeMap() {
  const mapContainer = ref(null);
  const map = ref(null);
  const scene = ref(null);
  const camera = ref(null);
  const renderer = ref(null);
  const controller = ref(null);

  // 地图配置
  const mapCenter = [118.7, 32]; // 使用Vue2版本的中心点坐标
  const mapSize = 90;
  const mapConfig = {
    deep: 0.1
  };
  const cameraPosArr = [{ x: 0, y: -5, z: 1 }]; // 使用Vue2版本的相机位置

  // UV贴图调整参数 - 从Vue2版本迁移
  const gui = {
    offsetX: 0,
    offsetY: 0.5,
    repeatX: 0.35,
    repeatY: 0.35,
    rotation: 6.3,
    centerX: 0.25,
    centerY: 0.2,
    RepeatWrapping: false
  };

  // 存储材质引用，用于UV调整
  let mapMaterial = null;

  // 墨卡托投影
  const projection = d3.geoMercator().center(mapCenter).scale(mapSize).translate([0, 0]);

  // 加载地图数据
  const loadMapData = () => {
    const loader = new THREE.FileLoader();
    loader.load('/data/nanjing.json', (data) => {
      const jsondata = JSON.parse(data);
      addMapGeometry(jsondata);
    });
  };

  // 地图模型 - 参考Vue2版本的实现
  const addMapGeometry = (jsondata) => {
    // 创建地图表面贴图
    const texture = new THREE.TextureLoader().load('/data/topbackground.jpg');
    const sidetexture = new THREE.TextureLoader().load('/data/sidetexture.png');

    // 关闭 matrixAutoUpdate 属性，方便后面对贴图进行矩阵转换
    texture.matrixAutoUpdate = false;

    // 初始化一个地图对象
    map.value = new THREE.Object3D();

    jsondata.features.forEach((feature) => {
      const province = new THREE.Object3D(); // 定义一个省份3D对象
      const coordinates = feature.geometry.coordinates; // 每块区域坐标的数组

      coordinates.forEach((multiPolygon) => {
        multiPolygon.forEach((polygon) => {
          const shape = new THREE.Shape();
          const lineMaterial = new THREE.LineBasicMaterial({
            color: '#ffffff'
          });
          const lineGeometry = new THREE.BufferGeometry();
          const pointsArray = [];

          for (let i = 0; i < polygon.length; i++) {
            const [x, y] = GetCoordinate(polygon[i]);
            if (i === 0) {
              shape.moveTo(x, -y);
            }
            shape.lineTo(x, -y);
            pointsArray.push(new THREE.Vector3(x, -y, mapConfig.deep));
          }

          lineGeometry.setFromPoints(pointsArray);

          // 添加立体效果 - 参考Vue2版本
          const extrudeSettings = {
            depth: mapConfig.deep,
            bevelEnabled: false
          };
          // 定义形状的厚度
          const bodyExtrudeSettings = {
            depth: mapConfig.deep - 0.005,
            bevelEnabled: false
          };
          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          const bodyGeometry = new THREE.ExtrudeGeometry(shape, bodyExtrudeSettings);

          // 创建材质
          const material = new THREE.MeshPhongMaterial({
            color: '#ffffff',
            transparent: true,
            opacity: 1,
            side: THREE.FrontSide,
            map: texture
          });

          // 存储材质引用，用于后续UV调整
          if (!mapMaterial) {
            mapMaterial = material;
          }

          const materialAside = new THREE.MeshLambertMaterial({
            color: '#1ad1ff',
            transparent: true,
            opacity: 1,
            side: THREE.FrontSide
            // wireframe: true
          });

          const mesh = new THREE.Mesh(geometry, [material, materialAside]);
          const bodymesh = new THREE.Mesh(bodyGeometry, [material, materialAside]);

          const line = new THREE.Line(lineGeometry, lineMaterial);
          province.add(line);
          province.add(mesh);
          province.add(bodymesh);
        });
      });
      map.value.add(province);
    });
    scene.value.add(map.value);

    // 调用UV贴图调整
    updateUV();
  };
  const GetCoordinate = (data) => {
    return projection([data[0], data[1]]); //将地理坐标（经纬度）转换为平面坐标
  };

  // 调整地图贴图 - 从Vue2版本迁移
  const updateUV = () => {
    if (!mapMaterial || !mapMaterial.map) return;

    mapMaterial.map.matrix
      .identity() // 矩阵重置
      .translate(-gui.centerX, -gui.centerY) // 设置中心点
      .rotate(gui.rotation) // 旋转
      .scale(gui.repeatX, gui.repeatY) // 缩放
      .translate(gui.centerX, gui.centerY) // 设置中心点
      .translate(gui.offsetX, gui.offsetY); // 偏移
  };

  // 场景初始化 - 参考Vue2版本
  const sceneInit = () => {
    scene.value = new THREE.Scene();
    // 设置背景 - 可选
    // const TextureLoader = new THREE.TextureLoader();
    // const backgroundTexture = TextureLoader.load('/data/border.png');
    // scene.value.background = backgroundTexture;
  };

  // 相机初始化 - 参考Vue2版本
  const cameraInit = () => {
    camera.value = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.value.position.set(cameraPosArr[0].x, cameraPosArr[0].y, cameraPosArr[0].z);
    camera.value.lookAt(new THREE.Vector3(0, 0, 0));
  };

  // 渲染器初始化 - 参考Vue2版本
  const rendererInit = () => {
    renderer.value = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.value.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight);
    renderer.value.setPixelRatio(window.devicePixelRatio);
    mapContainer.value.appendChild(renderer.value.domElement);
  };

  // 控制器初始化 - 参考Vue2版本
  const controllerInit = () => {
    controller.value = new OrbitControls(camera.value, renderer.value.domElement);
    controller.value.minDistance = 2;
    controller.value.maxDistance = 5.5;

    // 限制旋转角度
    controller.value.minAzimuthAngle = -Math.PI / 4;
    controller.value.maxAzimuthAngle = Math.PI / 4;
    controller.value.minPolarAngle = 1;
    controller.value.maxPolarAngle = Math.PI - 0.1;
  };

  // 灯光效果初始化 - 参考Vue2版本
  const lightInit = () => {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
    scene.value.add(ambientLight);

    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    scene.value.add(directionalLight);

    // 点光源
    const pointLight = new THREE.PointLight('#ffffff', 1.8, 20);
    pointLight.position.set(1, -7, 7);
    scene.value.add(pointLight);
  };

  // 坐标轴辅助线 - 参考Vue2版本
  const axisHelper = () => {
    const axesHelper = new THREE.AxesHelper(150);
    scene.value.add(axesHelper);

    // 网格辅助线
    const gridHelper = new THREE.GridHelper(100, 30, 0x2c2c2c, 0x888888);
    scene.value.add(gridHelper);
  };
  // 动画循环
  const animate = () => {
    requestAnimationFrame(animate); // 采用系统时间间隔，保持最佳绘制效率
    renderer.value.render(toRaw(scene.value), camera.value);
  };

  // 窗口大小变化处理
  const onWindowResize = () => {
    if (!camera.value || !renderer.value || !mapContainer.value) return;

    camera.value.aspect = mapContainer.value.clientWidth / mapContainer.value.clientHeight;
    camera.value.updateProjectionMatrix();
    renderer.value.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight);
  };

  // 初始化函数
  const init = () => {
    mapContainer.value = document.getElementById('TMapContainer');
    if (!mapContainer.value) {
      console.error('找不到地图容器元素');
      return;
    }

    sceneInit();
    cameraInit();
    rendererInit();
    controllerInit();
    // axisHelper();
    lightInit();
    loadMapData();

    // 添加窗口大小变化监听
    window.addEventListener('resize', onWindowResize);

    // 开启渲染
    animate();
  };

  // 清理函数
  const dispose = () => {
    window.removeEventListener('resize', onWindowResize);
    if (controller.value) {
      controller.value.dispose();
    }
    if (renderer.value) {
      renderer.value.dispose();
    }
  };

  onMounted(() => {
    init();
  });

  onUnmounted(() => {
    dispose();
  });

  return {
    mapContainer,
    scene,
    camera,
    renderer,
    map,
    // UV调整相关
    gui,
    updateUV
  };
}
