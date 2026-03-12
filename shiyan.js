// --- START OF FILE shiyan.js ---

// 引入 Three.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * 全局状态管理
 */
const appState = {
  carrier: '', // 当前载体ID
  texture: '', // 当前纹理类型
  currentProgress: 0, // 流程图进度
  material: {
    fusion: 50,
    metal: 30,
    rough: 50,
    emit: 0
  }
};

/**
 * Three.js 全局变量
 */
let scene, camera, renderer, controls;
let currentModel = null;
let requestID;

// ==========================================
// 1. 路径配置
// ==========================================
const MODEL_PATHS = {
  keyboard: './models/keyboard.glb',
  sneaker: './models/sneaker.glb',
  speaker: './models/speaker.glb',
  car: './models/car.glb'
};

// ⚠️ 【新增】：填入你的黑色包裹素材图片路径
const BASE_TEXTURE_PATH = './素材补充/黑色贴图背景.png'; // 请替换为实际的黑色图片路径

const TEXTURE_PATHS = {
  ice: './素材补充/陶瓷纹理.png',
  gold: './素材补充/织绣图案.png',
  rust: './素材补充/锈迹纹理.png',
  ink: './素材补充/墨迹纹理.png'
};

// 纹理加载器
const textureLoader = new THREE.TextureLoader();

/**
 * 初始化入口
 */
document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  updateFlowchart(0);
});

/* =========================================
   2. 核心交互逻辑
   ========================================= */

function selectCarrier(element) {
  document.querySelectorAll('.carrier-card').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');

  const carrierId = element.getAttribute('data-id');
  appState.carrier = carrierId;
  updateFlowchart(1);
  loadModel(carrierId);
}

function selectTexture(element, type) {
  document.querySelectorAll('.texture-card').forEach(el => el.classList.remove('selected'));
  element.classList.add('selected');

  appState.texture = type;
  updateFlowchart(2);
  unlockMaterialPanel();
  applyTextureToModel(type);
}

function filterTextures(category) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const map = { 'all': 0, 'ice': 1, 'gold': 2, 'rust': 3, 'ink': 4 };
  if (buttons[map[category]]) buttons[map[category]].classList.add('active');

  const cards = document.querySelectorAll('.texture-card');
  cards.forEach(card => {
    if (category === 'all' || card.getAttribute('data-category') === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

function updateSlider(param, value) {
  appState.material[param] = value;
  document.getElementById(`val-${param}`).innerText = value + '%';
  document.getElementById(`stat-${param}`).innerText = value + '%';

  if (appState.currentProgress < 3) {
    updateFlowchart(3);
  }
  updateModelMaterial();
}

function setSeal(text) {
  document.querySelectorAll('.btn-seal').forEach(btn => {
    btn.classList.remove('active');
    if (btn.innerText === text) btn.classList.add('active');
  });
  document.getElementById('seal-stamp').innerText = text;
}

// ==========================================
// 海报生成与下载逻辑
// ==========================================
function exportPoster() {
  if (!appState.carrier || !appState.texture) {
    alert("请先完成载体和纹理的选择！");
    return;
  }

  updateFlowchart(4);

  const rawName = document.querySelector('.input-name').value;
  const name = rawName.trim() === "" ? "无名设计师" : rawName;
  const sealText = document.getElementById('seal-stamp').innerText || "匠心";

  const carrierMap = { keyboard: '机械键盘', sneaker: '限量球鞋', speaker: '智能音箱', car: '概念跑车' };
  const textureMap = { ice: '宋代冰裂纹', gold: '汉代织锦', rust: '西周铜锈', ink: '水墨飞白' };

  const carrierName = carrierMap[appState.carrier];
  const textureName = textureMap[appState.texture];

  const threeCanvas = renderer.domElement;
  const modelImgUrl = threeCanvas.toDataURL('image/png');

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1560;
    const ctx = canvas.getContext('2d');

    const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    bgGradient.addColorStop(0, '#05070a');
    bgGradient.addColorStop(1, '#111827');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 60px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('共生·纹理重构实验室', canvas.width / 2, 160);

    ctx.fillStyle = '#65d0ea';
    ctx.font = '30px "Courier New", monospace';
    ctx.letterSpacing = '2px';
    ctx.fillText('SYMBIOSIS TEXTURE REFACTORING', canvas.width / 2, 210);

    const drawWidth = 900;
    const drawHeight = (img.height / img.width) * drawWidth;
    const drawX = (canvas.width - drawWidth) / 2;
    const drawY = 280;

    const glowGradient = ctx.createRadialGradient(canvas.width / 2, drawY + drawHeight / 2, 100, canvas.width / 2, drawY + drawHeight / 2, 500);
    glowGradient.addColorStop(0, 'rgba(79, 172, 254, 0.2)');
    glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glowGradient;
    ctx.fillRect(100, drawY, 880, drawHeight);

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a0aec0';
    ctx.font = '28px "Microsoft YaHei"';
    let startY = canvas.height - 350;

    ctx.fillText(`重构载体 / CARRIER :  ${carrierName}`, 100, startY);
    ctx.fillText(`赋能纹理 / TEXTURE :  ${textureName}`, 100, startY + 50);

    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#718096';
    ctx.fillText(`[FUSION: ${appState.material.fusion}%]  [METAL: ${appState.material.metal}%]  [ROUGH: ${appState.material.rough}%]`, 100, startY + 110);
    ctx.fillText(`TIMESTAMP : ${new Date().toLocaleString()}`, 100, startY + 150);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 36px "Microsoft YaHei"';
    ctx.fillText(`设计师 : ${name}`, canvas.width - 230, canvas.height - 150);

    const stampSize = 100;
    const stampX = canvas.width - 200;
    const stampY = canvas.height - 230;

    ctx.strokeStyle = '#d63031';
    ctx.lineWidth = 6;
    ctx.strokeRect(stampX, stampY, stampSize, stampSize);

    ctx.fillStyle = '#d63031';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 44px "SimSun", serif';

    if (sealText.length === 2) {
      ctx.fillText(sealText[0], stampX + stampSize / 2, stampY + stampSize / 3 + 5);
      ctx.fillText(sealText[1], stampX + stampSize / 2, stampY + stampSize * 2 / 3 + 5);
    } else {
      ctx.fillText(sealText, stampX + stampSize / 2, stampY + stampSize / 2 + 5);
    }

    const finalImageUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = finalImageUrl;
    link.download = `共生纹理重构_${name}_${new Date().getTime()}.png`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("✨ 海报生成成功，已开始下载！");
  };

  img.src = modelImgUrl;
}

window.selectCarrier = selectCarrier;
window.selectTexture = selectTexture;
window.filterTextures = filterTextures;
window.updateSlider = updateSlider;
window.setSeal = setSeal;
window.exportPoster = exportPoster;

/* =========================================
   3. 流程图逻辑
   ========================================= */

function updateFlowchart(level) {
  if (level > appState.currentProgress) {
    appState.currentProgress = level;
  }
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3'),
    document.getElementById('step-4')
  ];
  const lines = document.querySelectorAll('.flow-line');

  steps.forEach((el, index) => {
    if (index < appState.currentProgress) el.classList.add('active');
    else el.classList.remove('active');
  });

  lines.forEach((line, index) => {
    if (index < appState.currentProgress - 1) line.classList.add('active');
    else line.classList.remove('active');
  });
}

function unlockMaterialPanel() {
  const locked = document.getElementById('mat-locked');
  const content = document.getElementById('mat-content');
  if (locked && content) {
    locked.classList.add('hidden');
    content.classList.remove('hidden');
  }
}

/* =========================================
   4. Three.js 核心渲染与双层贴图逻辑
   ========================================= */

function initThreeJS() {
  const container = document.getElementById('vp-model-display');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2, 6);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.minDistance = 2;
  controls.maxDistance = 10;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainLight.position.set(5, 10, 7);
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xa18cd1, 0.5);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  window.addEventListener('resize', onWindowResize);
  animate();
}

function loadModel(carrierId) {
  const container = document.getElementById('vp-model-display');
  const placeholder = document.getElementById('vp-placeholder');
  placeholder.style.display = 'none';
  container.classList.remove('hidden');
  container.style.display = 'block';

  if (currentModel) {
    scene.remove(currentModel);
    currentModel = null;
  }

  const loader = new GLTFLoader();
  const path = MODEL_PATHS[carrierId];

  loader.load(
    path,
    (gltf) => {
      currentModel = gltf.scene;
      setupModel(currentModel);
    },
    undefined,
    (error) => {
      console.warn('模型加载失败，使用备用几何体', error);
      loadFallbackGeometry(carrierId);
    }
  );
}

// 📌 【核心修改 1】：创建双层网格结构
function setupModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
  const scale = 3 / maxDim;
  model.scale.set(scale, scale, scale);
  model.position.sub(center.multiplyScalar(scale));
  model.position.y = 0;

  scene.add(model);

  // 遍历模型，构建底层（黑底）和覆盖层（图案）
  model.traverse((child) => {
    if (child.isMesh && !child.userData.isOverlay) {

      // 1. 设置底层网格的基础材质 (如果图片没加载出来，保底是黑灰色)
      child.material = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.8,
        metalness: 0.2
      });

      // 2. 克隆出一个重叠的覆盖层网格
      const overlayMesh = new THREE.Mesh(child.geometry, new THREE.MeshStandardMaterial({
        transparent: true,
        opacity: 0, // 初始透明，直到选择了纹理
        polygonOffset: true,       // 解决两个模型完全重叠的闪烁问题
        polygonOffsetFactor: -1,   // 让覆盖层在渲染时往前靠一点
        polygonOffsetUnits: -1
      }));

      overlayMesh.userData.isOverlay = true; // 打个标记
      child.add(overlayMesh); // 绑定为子对象，旋转时一起动
    }
  });

  // 3. 加载底层黑色素材图片
  loadBaseTexture(model);

  // 如果状态里已经存了某种纹理，加载出来
  if (appState.texture) {
    applyTextureToModel(appState.texture);
  }
}

// 📌 【核心修改 2】：专门加载黑色底层素材
function loadBaseTexture(model) {
  textureLoader.load(
    BASE_TEXTURE_PATH,
    (baseTexture) => {
      baseTexture.colorSpace = THREE.SRGBColorSpace;
      baseTexture.wrapS = THREE.RepeatWrapping;
      baseTexture.wrapT = THREE.RepeatWrapping;
      baseTexture.repeat.set(4, 4); // 黑色底纹的平铺密度（觉得太大可以改大数字）
      baseTexture.flipY = false;

      model.traverse((child) => {
        // 只给底层赋黑色图片
        if (child.isMesh && !child.userData.isOverlay) {
          child.material.map = baseTexture;
          child.material.color = new THREE.Color(0xffffff); // 使用原图颜色
          child.material.needsUpdate = true;
        }
      });
    },
    undefined,
    () => { console.warn("未找到底层黑色素材图片，将使用纯黑材质。请检查 BASE_TEXTURE_PATH 路径。"); }
  );
}

// 📌 【核心修改 3】：将用户选择的纹理照片贴在覆盖层上
function applyTextureToModel(type) {
  if (!currentModel) return;

  const imgUrl = TEXTURE_PATHS[type];
  if (!imgUrl) return;

  textureLoader.load(
    imgUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;

      // 纹理均匀平铺
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5); // 纹理照片的平铺密度，数字越大越密集
      texture.flipY = false;

      let matParams = {};
      switch (type) {
        case 'ice': matParams = { metalness: 0.2, roughness: 0.1 }; break;
        case 'gold': matParams = { metalness: 0.8, roughness: 0.3 }; break;
        case 'rust': matParams = { metalness: 0.4, roughness: 0.8 }; break;
        case 'ink': matParams = { metalness: 0.0, roughness: 0.9 }; break;
      }

      currentModel.traverse((child) => {
        // 只把选择的照片赋给【覆盖层】
        if (child.isMesh && child.userData.isOverlay) {
          child.material.map = texture;
          child.material.transparent = true;
          child.material.opacity = 1.0; // 加载完毕，显示覆盖图案

          child.material.metalness = matParams.metalness;
          child.material.roughness = matParams.roughness;
          child.material.needsUpdate = true;
        }
      });

      updateModelMaterial();
    }
  );
}

// 📌 【核心修改 4】：面板滑动时，控制覆盖层的透明度与质感
function updateModelMaterial() {
  if (!currentModel) return;
  const m = appState.material;

  currentModel.traverse((child) => {
    // 这里我们主要控制图案覆盖层的变化，营造“融合”效果
    if (child.isMesh && child.userData.isOverlay && child.material.map) {
      child.material.metalness = m.metal / 100;
      child.material.roughness = m.rough / 100;

      // 融合度 (调整覆盖层透明度，露出下方黑底)
      // fusion 为 100% 时图案完全不透明，fusion 为 0% 时图案变成半透明幽灵状态
      child.material.opacity = 0.2 + (m.fusion / 100) * 0.8;

      // 赛博发光强度
      if (child.material.emissive !== undefined) {
        child.material.emissiveIntensity = m.emit / 50;
        if (m.emit > 0) {
          child.material.emissive = new THREE.Color(0x4facfe);
        } else {
          child.material.emissive = new THREE.Color(0x000000);
        }
      }
    }
  });
}

function loadFallbackGeometry(type) {
  let geometry;
  switch (type) {
    case 'speaker': geometry = new THREE.BoxGeometry(1.5, 2.5, 1.5); break;
    case 'sneaker': geometry = new THREE.CapsuleGeometry(0.8, 2, 4, 8); geometry.rotateZ(Math.PI / 2); break;
    case 'car': geometry = new THREE.BoxGeometry(3, 1, 1.5); break;
    default: geometry = new THREE.BoxGeometry(3, 1, 1.5);
  }
  const material = new THREE.MeshStandardMaterial({ color: 0x222222 });
  currentModel = new THREE.Mesh(geometry, material);
  setupModel(currentModel); // 使用统一配置双层的入口
}

function onWindowResize() {
  const container = document.getElementById('vp-model-display');
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
  requestID = requestAnimationFrame(animate);
  controls.update();

  // 缓慢自转
  if (currentModel) {
    currentModel.rotation.y += 0.003;
  }

  renderer.render(scene, camera);
}
// --- END OF FILE shiyan.js ---