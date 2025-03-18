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
  const cameraPosArr = [{ x: 5, y: 5, z: 5 }];
  // const cameraPosArr = [{ x: 0.8, y: 0.5, z: 1 }];

  const projection = d3.geoMercator().center(mapCenter).scale(mapSize).translate([0, 0]);
  const markers = [];
  // 边缘发光组合器
  let outlinePass = null;
  let edgeShineComposer = ref(null);
  let outLineAnimationFrameID = null;

  const addGeometry = () => {
    loadProtectGlb();
    loadGlb();
    // loadMarkerGlb();
    addMarker();
  };

  let model = null;
  let curve = null;
  let progress = 0; // 物体运动时在运动路径的初始位置，范围0~1
  const velocity = 0.001; // 影响运动速率的一个值，范围0~1，需要和渲染频率结合计算才能得到真正的速率
  const loadProtectGlb = () => {
    // 地面
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.value.add(mesh);

    const loader = new GLTFLoader();
    loader.load('/public/static/Diggings/glbs/protect.glb', (gltf) => {
      gltf.scene.scale.set(1, 1, 1);
      gltf.scene.position.set(0, 0, 0);
      gltf.scene.traverse(function (object) {
        if (object.isMesh) {
          object.castShadow = true; //阴影
          object.receiveShadow = true; //接受别人投的阴影
        }
      });
      model = gltf.scene;
      scene.value.add(gltf.scene);
    });
    makeCurve();
  };
  const makeCurve = () => {
    // Create a closed circular path around the stone
    const radius = 5; // 半径，控制曲线的大小
    const segments = 50; // 曲线分段数量
    const center = new THREE.Vector3(0, 0, 0); // stone的位置，假设stone在原点

    const points = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2; // 环绕路径的角度
      const x = radius * Math.cos(angle); // X坐标
      const z = radius * Math.sin(angle); // Z坐标
      points.push(new THREE.Vector3(x, 0, z)); // 根据半径计算每个点的坐标
    }

    curve = new THREE.CatmullRomCurve3(points); // 创建曲线
    curve.curveType = 'catmullrom';
    curve.closed = true; // 让路径闭合

    // 通过曲线创建一个Line对象作为参考线显示
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0x000000 });
    const curveObject = new THREE.Line(geometry, material);

    scene.value.add(curveObject);
  };
  // 物体沿线移动方法
  const moveOnCurve = () => {
    if (curve == null || model == null) {
      console.log('Loading');
    } else {
      if (progress <= 1 - velocity) {
        const point = curve.getPointAt(progress); // 获取当前点
        const pointBox = curve.getPointAt(progress + velocity); // 获取下一个点

        if (point && pointBox) {
          model.position.set(point.x, point.y, point.z); // 设置模型位置

          // 计算目标朝向
          var targetPos = pointBox;
          var mtx = new THREE.Matrix4();
          mtx.lookAt(model.position, targetPos, model.up); // 设置朝向
          model.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(mtx), 0.2); // 旋转朝向
        }

        progress += velocity;
      } else {
        progress = 0; // 循环回到起始位置
      }
    }
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
  const addMarker = () => {
    const texture = new THREE.TextureLoader().load('/public/static/Diggings/images/office_base.png');
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture //设置精灵纹理贴图
    });
    // 创建精灵模型对象，不需要几何体geometry参数
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.set(0, 0.5, 0); //设置位置，要考虑sprite尺寸影响
    sprite.scale.set(0.2, 0.2, 0.2);
    scene.value.add(sprite);
    markers.push(sprite);
  };
  const TooltipLabelData = {
    label: null,
    line: null
  };
  const addlabelDiv = (position, text) => {
    // 创建真实dom用于挂载数据（此div在最外层仅起到标点作用）
    const div = document.createElement('div');
    // 添加类名，方便书写css(写到这里，如果你前面没有添加css2D的渲染器，那么需要回到setRenderer中添加)
    div.className = 'Tooltip-label';
    // 创建真实dom，用于真正的渲染，位置用css控制
    const contentDiv = document.createElement('div');
    contentDiv.className = 'Tooltip-lable-content';
    contentDiv.textContent = text;
    // 设置背景
    contentDiv.style.backgroundImage = 'url(/public/static/Diggings/images/label/1.png)';
    div.appendChild(contentDiv);

    // 将dom创建为mesh
    const label = new CSS2DObject(div);
    // 设置位置
    const vector = new THREE.Vector3(0, 0.5, 0);
    label.position.set(vector.x + 0.5, vector.y + 0.2, 0.5);
    // label.position.set(0, 0.5, 0);
    label.visible = true;

    // 添加线模型（如果需要修改线和div的相对位置，到css中修改）
    const lineGeometry = new THREE.BufferGeometry();
    // 设置点
    lineGeometry.setFromPoints([
      { x: vector.x, y: vector.y, z: vector.z + 0.05 },
      { x: vector.x + 0.2, y: vector.y + 0.2, z: 0.5 },
      { x: vector.x + 0.5, y: vector.y + 0.2, z: 0.5 }
    ]);
    // 设置线的颜色
    const lineMaterial = new THREE.LineBasicMaterial({
      color: '#6ebd24'
    });
    // 生成线
    const line = new THREE.Line(lineGeometry, lineMaterial);
    // 将生成的线和label保存下来，方便后续修改
    TooltipLabelData.label = label;
    TooltipLabelData.line = line;
    scene.value.add(label);
    scene.value.add(line);
  };

  // 坐标轴辅助线
  const axisHelper = () => {
    const axesHelper = new THREE.AxesHelper(20);
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
    mapContainer.value.addEventListener(
      'click',
      (event) => {
        const px = event.offsetX;
        const py = event.offsetY;
        //屏幕坐标px、py转WebGL标准设备坐标x、y
        const x = (px / width) * 2 - 1;
        const y = -(py / height) * 2 + 1;
        // 计算射线 形象点说就是在点击位置创建一条射线，射线穿过的模型代表选中
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera.value);
        const intersects = raycaster.intersectObjects(markers);
        if (intersects.length > 0) {
          addlabelDiv(intersects[0].object.position, intersects[0].object.name);
        }
      },
      false
    );

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
    // const ambientLight = new THREE.AmbientLight(0x404040, 1);
    // scene.value.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 10, 0);
    scene.value.add(hemiLight);

    // 创建一个虚拟的球形网格 Mesh 的辅助对象来模拟 半球形光源 HemisphereLight.
    const hemiLighthelper = new THREE.HemisphereLightHelper(hemiLight, 5);
    scene.value.add(hemiLighthelper);

    // 平行光
    // const directionalLight = new THREE.DirectionalLight(0xffffff);
    // directionalLight.castShadow = true;
    // directionalLight.shadow.camera.near = 0.5;
    // directionalLight.shadow.camera.far = 50;
    // directionalLight.shadow.camera.left = -10;
    // directionalLight.shadow.camera.right = 10;
    // directionalLight.shadow.camera.top = 10;
    // directionalLight.shadow.camera.bottom = -10;
    // directionalLight.position.set(0, 5, 5);
    // scene.value.add(directionalLight);

    // // // 用于模拟场景中平行光 DirectionalLight 的辅助对象. 其中包含了表示光位置的平面和表示光方向的线段.
    // const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    // scene.value.add(directionalLightHelper);
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
    // scene.value.background = new THREE.Color('rgb(110, 141, 54)');
  };
  const animate = () => {
    if (outLineAnimationFrameID) {
      cancelAnimationFrame(outLineAnimationFrameID);
    }
    outLineAnimationFrameID = requestAnimationFrame(animate);
    moveOnCurve();
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
