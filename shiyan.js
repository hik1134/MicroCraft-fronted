// --- START OF FILE shiyan.js ---

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const appState = {
  carrier: '',
  texture: '',
  currentProgress: 0,
  material: { fusion: 50, metal: 30, rough: 50, emit: 0 }
};

let scene, camera, renderer, controls;
let currentModel = null;
let requestID;

const MODEL_PATHS = {
  keyboard: './models/keyboard.glb',
  sneaker: './models/sneaker.glb',
  speaker: './models/speaker.glb',
  car: './models/car.glb'
};

const BASE_TEXTURE_PATH = './素材补充/黑色贴图背景.png';

const TEXTURE_PATHS = {
  ice: './素材补充/陶瓷纹理.png',
  gold: './素材补充/织绣图案.png',
  rust: './素材补充/锈迹纹理.png',
  ink: './素材补充/墨迹纹理.png'
};

const textureLoader = new THREE.TextureLoader();

document.addEventListener('DOMContentLoaded', () => {
  initThreeJS();
  updateFlowchart(0);
});

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

function exportPoster() {
  if (!appState.carrier || !appState.texture) {
    alert("请先完成载体和纹理的选择！");
    return;
  }
  updateFlowchart(4);
  // 海报生成逻辑不变，保留你原有的逻辑
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

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a0aec0';
    ctx.font = '28px "Microsoft YaHei"';
    let startY = canvas.height - 350;

    ctx.fillText(`重构载体 / CARRIER :  ${carrierName}`, 100, startY);
    ctx.fillText(`赋能纹理 / TEXTURE :  ${textureName}`, 100, startY + 50);

    ctx.font = '24px "Courier New", monospace';
    ctx.fillStyle = '#718096';
    ctx.fillText(`[FUSION: ${appState.material.fusion}%]  [METAL: ${appState.material.metal}%]`, 100, startY + 110);
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
    link.download = `共生纹理重构_${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  img.src = modelImgUrl;
}

window.selectCarrier = selectCarrier;
window.selectTexture = selectTexture;
window.filterTextures = filterTextures;
window.updateSlider = updateSlider;
window.setSeal = setSeal;
window.exportPoster = exportPoster;

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

function initThreeJS() {
  const container = document.getElementById('vp-model-display');
  if (!container) return;

  scene = new THREE.Scene();
  scene.background = null;

  camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight || 1, 0.1, 100);
  camera.position.set(0, 2, 6);

  renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true
  });
  // 初始时虽然容器宽高可能是0，但我们在 loadModel 中会修复它
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

  // 切换UI显示
  placeholder.style.display = 'none';
  container.classList.remove('hidden');

  // 🔴【核心修复】：因为容器一开始是 display:none，Threejs 画布尺寸是 0
  // 取消隐藏后，强制触发一次 resize 重新计算渲染器和相机的尺寸，模型就能立刻显示出来了！
  setTimeout(() => {
    onWindowResize();
  }, 50);

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
      console.warn('模型加载失败，使用备用几何体');
      loadFallbackGeometry(carrierId);
    }
  );
}

function setupModel(model) {
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const maxDim = Math.max(box.getSize(new THREE.Vector3()).x, box.getSize(new THREE.Vector3()).y, box.getSize(new THREE.Vector3()).z);
  const scale = 3 / maxDim;
  model.scale.set(scale, scale, scale);
  model.position.sub(center.multiplyScalar(scale));
  model.position.y = 0;

  scene.add(model);

  model.traverse((child) => {
    if (child.isMesh && !child.userData.isOverlay) {
      child.material = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.8, metalness: 0.2
      });

      const overlayMesh = new THREE.Mesh(child.geometry, new THREE.MeshStandardMaterial({
        transparent: true, opacity: 0,
        polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
      }));
      overlayMesh.userData.isOverlay = true;
      child.add(overlayMesh);
    }
  });

  loadBaseTexture(model);

  if (appState.texture) {
    applyTextureToModel(appState.texture);
  }
}

function loadBaseTexture(model) {
  textureLoader.load(
    BASE_TEXTURE_PATH,
    (baseTexture) => {
      baseTexture.colorSpace = THREE.SRGBColorSpace;
      baseTexture.wrapS = THREE.RepeatWrapping;
      baseTexture.wrapT = THREE.RepeatWrapping;
      baseTexture.repeat.set(4, 4);
      baseTexture.flipY = false;

      model.traverse((child) => {
        if (child.isMesh && !child.userData.isOverlay) {
          child.material.map = baseTexture;
          child.material.color = new THREE.Color(0xffffff);
          child.material.needsUpdate = true;
        }
      });
    },
    undefined,
    () => { console.warn("未找到底层黑色素材图片。"); }
  );
}

function applyTextureToModel(type) {
  if (!currentModel) return;
  const imgUrl = TEXTURE_PATHS[type];
  if (!imgUrl) return;

  textureLoader.load(
    imgUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(5, 5);
      texture.flipY = false;

      let matParams = {};
      switch (type) {
        case 'ice': matParams = { metalness: 0.2, roughness: 0.1 }; break;
        case 'gold': matParams = { metalness: 0.8, roughness: 0.3 }; break;
        case 'rust': matParams = { metalness: 0.4, roughness: 0.8 }; break;
        case 'ink': matParams = { metalness: 0.0, roughness: 0.9 }; break;
      }

      currentModel.traverse((child) => {
        if (child.isMesh && child.userData.isOverlay) {
          child.material.map = texture;
          child.material.transparent = true;
          child.material.opacity = 1.0;
          child.material.metalness = matParams.metalness;
          child.material.roughness = matParams.roughness;
          child.material.needsUpdate = true;
        }
      });
      updateModelMaterial();
    }
  );
}

function updateModelMaterial() {
  if (!currentModel) return;
  const m = appState.material;

  currentModel.traverse((child) => {
    if (child.isMesh && child.userData.isOverlay && child.material.map) {
      child.material.metalness = m.metal / 100;
      child.material.roughness = m.rough / 100;
      child.material.opacity = 0.2 + (m.fusion / 100) * 0.8;

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
  setupModel(currentModel);
}

function onWindowResize() {
  const container = document.getElementById('vp-model-display');
  if (!container) return;

  // 如果容器尺寸为0（如初始隐藏状态），使用父容器的尺寸
  let width = container.clientWidth;
  let height = container.clientHeight;

  if (width === 0 || height === 0) {
    const parent = container.parentElement;
    if (parent) {
      width = parent.clientWidth;
      height = parent.clientHeight;
    }
  }

  // 如果仍然为0，使用默认值避免除零错误
  if (width === 0) width = 400;
  if (height === 0) height = 400;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function animate() {
  requestID = requestAnimationFrame(animate);
  controls.update();
  if (currentModel) {
    currentModel.rotation.y += 0.003;
  }
  renderer.render(scene, camera);
}