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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

export function useThreeModel() {
  const mapContainer = ref(null);
  const map = ref(null);
  const scene = ref(null);
  const camera = ref(null);
  const renderer = ref(null);
  const cssRenderer = ref(null);
  const controller = ref(null);
  const mapCenter = [118.767413, 32.041544];
  const mapSize = 90;
  const cameraPosArr = [{ x: 0, y: 0, z: 3 }];

  const projection = d3.geoMercator().center(mapCenter).scale(mapSize).translate([0, 0]);
  const markers = [];
  // 边缘发光组合器
  let outlinePass = null;
  let edgeShineComposer = ref(null);
  let outLineAnimationFrameID = null;

  const addGeometry = () => {
    loadGlb();
    loadMarkerGlb();
  };
  // 加载本地glb模型
  const loadGlb = () => {
    const loader = new GLTFLoader();
    loader.load('/public/static/Diggings/glbs/stone.glb', (gltf) => {
      gltf.scene.position.set(0, 0, 0);
      scene.value.add(gltf.scene);
      markers.push(gltf.scene);
    });
  };
  const loadMarkerGlb = () => {
    const loader = new GLTFLoader();
    loader.load('/public/static/Diggings/glbs/flower.glb', (gltf) => {
      const group = new THREE.Group(); // 创建一个新的group
      gltf.scene.position.set(0, 0.42, 0);
      // 将模型1的大小设置为原始大小的2倍
      gltf.scene.scale.set(0.01, 0.01, 0.01);

      group.add(gltf.scene);
      group.name = 'flowerGroup';

      scene.value.add(group);
      markers.push(group);
    });
  };
  const addlabelDiv = (position, text) => {
    const div = document.createElement('div');
    const labelDiv = document.createElement('div');
    labelDiv.className = 'labelDiv';
    labelDiv.textContent = text;
    const label = new CSS2DObject(labelDiv);
    label.position.set(0, 0.5, 0);
    scene.value.add(label);
  };

  // 坐标轴辅助线
  const axisHelper = () => {
    const axesHelper = new THREE.AxesHelper(150);
    scene.value.add(axesHelper);
  };
  const onPointerMove = (event) => {
    //给监听到的几何体增加边框发光特效
    const pointer = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera.value);
    const intersects = raycaster.intersectObjects(markers);
    //被射线穿过的几何体为一个集合，越排在前面说明其位置离端点越近，所以直接取[0]就是被监听到的几何体

    if (intersects.length > 0) {
      for (let i = 0; i < outlinePass.selectedObjects?.length; i++) {
        const item = outlinePass.selectedObjects[i];
        if (item.name === intersects[0].object.name) {
          return;
        } else {
          outlinePass.selectedObjects = [];
          edgeShineComposer.removePass(outlinePass);
        }
      }
      outlinePass.selectedObjects = [intersects[0].object]; // 更新需要显示轮廓的对象
      edgeShineComposer.addPass(outlinePass);
    } else {
      //若没有几何体被监听到，可以做一些取消操作
    }
  };
  const raycasterInit = () => {
    const width = mapContainer.value.clientWidth;
    const height = mapContainer.value.clientHeight;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    // mapContainer.value.addEventListener(
    //   'click',
    //   (event) => {
    //     const px = event.offsetX;
    //     const py = event.offsetY;
    //     //屏幕坐标px、py转WebGL标准设备坐标x、y
    //     const x = (px / width) * 2 - 1;
    //     const y = -(py / height) * 2 + 1;
    //     // 计算射线 形象点说就是在点击位置创建一条射线，射线穿过的模型代表选中
    //     raycaster.setFromCamera(new THREE.Vector2(x, y), camera.value);
    //     const intersects = raycaster.intersectObjects(markers);
    //     if (intersects.length > 0) {
    //       addlabelDiv(intersects[0].object.position, intersects[0].object.name);
    //     }
    //   },
    //   false
    // );

    mapContainer.value.addEventListener('pointermove', onPointerMove);
  };
  const composerInit = () => {
    outlinePass = new OutlinePass(new THREE.Vector2(window.innerWidth, window.innerHeight), toRaw(scene.value), camera.value, []);
    outlinePass.edgeStrength = 4;
    outlinePass.edgeGlow = 2;
    outlinePass.usePatternTexture = false;
    outlinePass.edgeThickness = 2;
    outlinePass.downSampleRatio = 2;
    outlinePass.pulsePeriod = 2;
    outlinePass.visibleEdgeColor.set(parseInt('0xff0000'));
    outlinePass.hiddenEdgeColor = new THREE.Color(0, 0, 0);
    outlinePass.clear = true;

    const pixelRatio = renderer.value.getPixelRatio(); //获取设备像素比
    const smaaPass = new SMAAPass(mapContainer.value.clientWidth * pixelRatio, mapContainer.value.clientHeight * pixelRatio);

    // 创建一个EffectComposer（效果组合器）对象，然后在该对象上添加后期处理通道。
    edgeShineComposer = new EffectComposer(renderer.value);
    // 新建一个场景通道  为了覆盖到原理来的场景上
    let renderPass = new RenderPass(toRaw(scene.value), camera.value);
    edgeShineComposer.addPass(renderPass);
    edgeShineComposer.addPass(smaaPass);
  };
  // 灯光效果初始化
  const lightInit = () => {
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.value.add(ambientLight);
  };
  // 控制器初始化
  const controllerInit = () => {
    controller.value = new OrbitControls(camera.value, cssRenderer.value.domElement);
  };
  // 渲染器初始化
  const rendererInit = () => {
    renderer.value = new THREE.WebGLRenderer();
    renderer.value.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight);
    renderer.value.setPixelRatio(window.devicePixelRatio);

    cssRenderer.value = new CSS2DRenderer();
    cssRenderer.value.setSize(mapContainer.value.clientWidth, mapContainer.value.clientHeight);
    cssRenderer.value.domElement.style.position = 'absolute';
    cssRenderer.value.domElement.style.top = 0;

    mapContainer.value.appendChild(renderer.value.domElement);
    mapContainer.value.appendChild(cssRenderer.value.domElement);
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
    scene.value.background = new THREE.Color('rgb(110, 141, 54)');
  };
  const animate = () => {
    if (outLineAnimationFrameID) {
      cancelAnimationFrame(outLineAnimationFrameID);
    }
    outLineAnimationFrameID = requestAnimationFrame(animate);

    renderer.value.render(toRaw(scene.value), camera.value);
    cssRenderer.value.render(toRaw(scene.value), camera.value);
    edgeShineComposer.render();
  };
  const init = () => {
    mapContainer.value = document.getElementById('TContainer');
    sceneInit();
    cameraInit();
    rendererInit();
    controllerInit();
    addGeometry();
    axisHelper();
    lightInit();
    raycasterInit();
    composerInit();

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
