import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

document.addEventListener('DOMContentLoaded', init3D);

function init3D() {
  // 1. 获取 DOM 元素 (UI 控制)
  const tempSlider = document.getElementById('temp-slider');
  const coolSlider = document.getElementById('cool-slider');
  const tempDisplayMiddle = document.getElementById('temp-display-middle');
  const coolDisplayMiddle = document.getElementById('cool-display-middle');
  const tempDisplayMonitor = document.getElementById('kiln-temp');
  const coolDisplayMonitor = document.getElementById('cool-rate');
  const generateBtn = document.getElementById('generate-btn');
  const container = document.getElementById('canvas-container');

  // 2. 初始化 Three.js 基础场景
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight || 1, 0.1, 100);
  camera.position.set(0, 2, 5);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  // 初始设置大小，后面交给 ResizeObserver 管理
  renderer.setSize(container.clientWidth || 300, container.clientHeight || 300);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制最高像素比优化性能
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2;
  controls.maxDistance = 8;

  // 3. 设置光照
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xfff0dd, 1);
  directionalLight.position.set(5, 5, 2);
  scene.add(directionalLight);
  const backLight = new THREE.DirectionalLight(0xaabbff, 0.8);
  backLight.position.set(-5, 3, -5);
  scene.add(backLight);

  // 4. 生成冰裂纹贴图
  function createProceduralCrack(density) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    const segments = density === 'sparse' ? 5 : (density === 'medium' ? 10 : 20);
    const step = 512 / segments;
    const points = [];

    for (let y = 0; y <= segments; y++) {
      const row = [];
      for (let x = 0; x <= segments; x++) {
        let jx = (x === 0 || x === segments) ? 0 : (Math.random() - 0.5) * step * 0.9;
        let jy = (y === 0 || y === segments) ? 0 : (Math.random() - 0.5) * step * 0.9;
        row.push({ x: x * step + jx, y: y * step + jy });
      }
      points.push(row);
    }

    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = density === 'sparse' ? 2 : (density === 'medium' ? 1.5 : 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 1;

    ctx.beginPath();
    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const p1 = points[y][x];
        const p2 = points[y][x + 1];
        const p3 = points[y + 1][x];

        if (Math.random() > 0.1) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }
        if (Math.random() > 0.1) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y); }
        if (Math.random() > 0.6) {
          const p4 = points[y + 1][x + 1];
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p4.x, p4.y);
        }
      }
    }

    for (let i = 0; i < segments; i++) {
      ctx.moveTo(points[i][segments].x, points[i][segments].y);
      ctx.lineTo(points[i + 1][segments].x, points[i + 1][segments].y);
      ctx.moveTo(points[segments][i].x, points[segments][i].y);
      ctx.lineTo(points[segments][i + 1].x, points[segments][i + 1].y);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3);
    return texture;
  }

  const crackTextures = {
    sparse: createProceduralCrack('sparse'),
    medium: createProceduralCrack('medium'),
    dense: createProceduralCrack('dense')
  };

  // 5. 创建陶瓷材质
  const ceramicMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x98b8b8,
    metalness: 0.1,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    map: crackTextures.medium,
    side: THREE.DoubleSide
  });

  let activeMesh; // 记录当前展示的模型

  // 默认创建一个替代用的半球体(碗)
  const fallbackGeometry = new THREE.SphereGeometry(1.5, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const fallbackMesh = new THREE.Mesh(fallbackGeometry, ceramicMaterial);
  fallbackMesh.rotation.x = Math.PI;
  fallbackMesh.position.y = 0.5;
  scene.add(fallbackMesh);
  activeMesh = fallbackMesh;

  // 尝试加载真实模型
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('./models/ceramic.glb', (gltf) => {
    scene.remove(fallbackMesh); // 移除替代圆球
    const ceramicMesh = gltf.scene;
    ceramicMesh.traverse((child) => {
      if (child.isMesh) child.material = ceramicMaterial;
    });
    ceramicMesh.scale.set(1, 1, 1);
    ceramicMesh.position.set(0, -1, 0);
    scene.add(ceramicMesh);
    activeMesh = ceramicMesh; // 更新当前激活的模型
  }, undefined, (error) => {
    console.log("未找到真实的GLB模型，继续使用备用半球体。");
  });

  // 7. 更新UI和材质
  function updateCeramicEffect() {
    const temp = parseInt(tempSlider.value);
    const cool = parseInt(coolSlider.value);

    tempDisplayMiddle.textContent = temp + '° C';
    coolDisplayMiddle.textContent = cool + '° C/h';
    tempDisplayMonitor.textContent = temp + '° C';
    coolDisplayMonitor.textContent = cool + '° C/h';

    if (cool < 100) ceramicMaterial.map = crackTextures.sparse;
    else if (cool >= 100 && cool < 160) ceramicMaterial.map = crackTextures.medium;
    else ceramicMaterial.map = crackTextures.dense;

    const colorLow = new THREE.Color(0x6b8e8e);
    const colorHigh = new THREE.Color(0xcce6e6);
    const tempRatio = (temp - 900) / 400;
    ceramicMaterial.color.lerpColors(colorLow, colorHigh, tempRatio);
    ceramicMaterial.clearcoatRoughness = 0.3 - (tempRatio * 0.25);
    ceramicMaterial.needsUpdate = true;
  }

  tempSlider.addEventListener('input', updateCeramicEffect);
  coolSlider.addEventListener('input', updateCeramicEffect);

  generateBtn.addEventListener('click', () => {
    const targetScale = 0.1;
    // 缩放动画
    activeMesh.scale.set(targetScale, targetScale, targetScale);

    setTimeout(() => {
      tempSlider.value = Math.floor(Math.random() * (1300 - 900) + 900);
      coolSlider.value = Math.floor(Math.random() * (200 - 50) + 50);
      updateCeramicEffect();
      // 恢复大小
      activeMesh.scale.set(1, 1, 1);
    }, 300);
  });

  // 【核心修复】使用 ResizeObserver 完美解决 Flexbox 导致 Canvas 初始大小为 0 的问题
  const resizeObserver = new ResizeObserver(entries => {
    for (let entry of entries) {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    }
  });
  resizeObserver.observe(container);

  // 下载图片逻辑
  const downloadBtn = document.getElementById('download-btn');
  downloadBtn.addEventListener('click', () => {
    const kilnContainer = document.querySelector('.kiln-container');
    const bgImg = document.querySelector('.kiln-bg');
    const webglCanvas = document.querySelector('#canvas-container canvas');

    if (!bgImg.complete) {
      alert("背景图片还在加载中，请稍后再试！");
      return;
    }

    const compCanvas = document.createElement('canvas');
    const width = kilnContainer.clientWidth;
    const height = kilnContainer.clientHeight;
    const dpr = window.devicePixelRatio || 1;
    compCanvas.width = width * dpr;
    compCanvas.height = height * dpr;

    const ctx = compCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const imgW = bgImg.naturalWidth;
    const imgH = bgImg.naturalHeight;
    const scale = Math.min(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

    const canvasW = width * 0.6;
    const canvasH = height * 0.6;
    const canvasX = (width / 2) - (canvasW * 0.5);
    const canvasY = (height / 2) - (canvasH * 0.4);

    renderer.render(scene, camera);
    ctx.drawImage(webglCanvas, canvasX, canvasY, canvasW, canvasH);

    try {
      const dataURL = compCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      const tempVal = tempSlider.value;
      link.download = `秩序陶瓷-冰裂纹-${tempVal}度.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("导出图片失败:", e);
      alert("导出失败，可能是因为跨域问题。请在本地服务器环境（如 Live Server）下运行。");
    }
  });

  // 渲染循环
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }

  // 立即初始化
  updateCeramicEffect();
  animate();
}