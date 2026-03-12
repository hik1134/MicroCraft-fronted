document.addEventListener('DOMContentLoaded', function () {
  // 1. 获取 DOM 元素
  const tempSlider = document.getElementById('temp-slider');
  const coolSlider = document.getElementById('cool-slider');

  // 获取中间显示的数值元素
  const tempDisplayMiddle = document.getElementById('temp-display-middle');
  const coolDisplayMiddle = document.getElementById('cool-display-middle');

  // 获取底部监控的数值元素
  const tempDisplayMonitor = document.getElementById('kiln-temp');
  const coolDisplayMonitor = document.getElementById('cool-rate');

  const crackPattern = document.getElementById('crack-pattern');
  const generateBtn = document.getElementById('generate-btn');

  // 2. 定义素材路径 
  // 请确保这里使用透明背景的裂纹PNG图，否则会重影
  // const crackAssets = {
  //   // 假设你有不同的裂纹图，如果没有，暂时用同一个测试，但必须是透明底
  //   sparse: './秩序陶瓷页面素材/秩序陶瓷页面素材/陶瓷素材/裂纹1.png',
  //   medium: './秩序陶瓷页面素材/秩序陶瓷页面素材/陶瓷素材/裂纹2.png',
  //   dense: './秩序陶瓷页面素材/秩序陶瓷页面素材/陶瓷素材/裂纹3.png'
  // };

  // 3. 核心逻辑：更新裂纹状态及数值显示
  function updateCracks() {
    const temp = parseInt(tempSlider.value); // 获取温度
    const cool = parseInt(coolSlider.value); // 获取冷却速度

    // --- A. 更新数值显示 ---

    // 更新滑块中间的数值
    tempDisplayMiddle.textContent = temp + '° C';
    coolDisplayMiddle.textContent = cool + '° C/h';

    // 更新底部监控器的数值
    tempDisplayMonitor.textContent = temp + '° C';
    coolDisplayMonitor.textContent = cool + '° C/h';

    // --- B. 决定使用哪张裂纹图 ---
    let currentImage = '';
    if (cool < 100) {
      currentImage = crackAssets.sparse;
    } else if (cool >= 100 && cool < 160) {
      currentImage = crackAssets.medium;
    } else {
      currentImage = crackAssets.dense;
    }
    crackPattern.style.backgroundImage = `url('${currentImage}')`;

    // --- C. 决定裂纹的视觉效果 (透明度与滤镜) ---
    // 计算透明度: 冷却越快/温度越高 -> 裂纹越明显
    const opacityBase = 0.3;
    const coolFactor = (cool - 50) / 150 * 0.4;
    const tempFactor = (temp - 900) / 400 * 0.2;
    const finalOpacity = opacityBase + coolFactor + tempFactor;

    crackPattern.style.opacity = finalOpacity;

    // 滤镜效果: 高温发色
    if (temp > 1200) {
      crackPattern.style.filter = 'contrast(1.2) sepia(0.4)';
    } else {
      crackPattern.style.filter = 'contrast(1.0) sepia(0)';
    }
  }

  // 4. 事件监听
  tempSlider.addEventListener('input', updateCracks);
  coolSlider.addEventListener('input', updateCracks);

  // 5. “重新生成”按钮逻辑
  generateBtn.addEventListener('click', function () {
    crackPattern.style.opacity = 0;

    setTimeout(() => {
      // 随机生成数值
      const randTemp = Math.floor(Math.random() * (1300 - 900) + 900);
      const randCool = Math.floor(Math.random() * (200 - 50) + 50);

      tempSlider.value = randTemp;
      coolSlider.value = randCool;

      updateCracks();
    }, 300);
  });

  // 6. 初始化
  updateCracks();
});








// 3D模型部分
// 引入 Three.js
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
  // 背景透明，这样就能看到后面的窑炉图片
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2, 5); // 摄像机位置 (稍微俯视)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true // 关键：允许将 canvas 内容导出为图片
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // 添加轨道控制器 (允许用户鼠标拖拽旋转查看碗)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 3;
  controls.maxDistance = 8;

  // 3. 设置光照 (陶瓷非常需要光照来表现釉面的反光)
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 环境光
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xfff0dd, 1); // 主光源(暖色)
  directionalLight.position.set(5, 5, 2);
  scene.add(directionalLight);

  const backLight = new THREE.DirectionalLight(0xaabbff, 0.8); // 边缘冷光
  backLight.position.set(-5, 3, -5);
  scene.add(backLight);

  // =========================================================
  // 4. 纯代码生成“冰裂纹”贴图 (替代真实的图片)
  // =========================================================
  function createProceduralCrack(density) {
    // 创建一个不可见的画布
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // 背景涂成纯白 (作为透明的底)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // 根据滑块密度(稀疏/中等/密集)设定网格切分数量
    const segments = density === 'sparse' ? 5 : (density === 'medium' ? 10 : 20);
    const step = 512 / segments;

    // 算法：生成带有随机偏移的网格顶点
    const points = [];
    for (let y = 0; y <= segments; y++) {
      const row = [];
      for (let x = 0; x <= segments; x++) {
        // 边缘的点不偏移，保证生成的贴图上下左右能无缝拼接
        let jx = (x === 0 || x === segments) ? 0 : (Math.random() - 0.5) * step * 0.9;
        let jy = (y === 0 || y === segments) ? 0 : (Math.random() - 0.5) * step * 0.9;
        row.push({ x: x * step + jx, y: y * step + jy });
      }
      points.push(row);
    }

    // 设置画笔：模拟汝窑开片的铁线/暗灰纹理
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = density === 'sparse' ? 2 : (density === 'medium' ? 1.5 : 0.8);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 增加一点极微弱的阴影，让裂纹看起来像在釉面的下方
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 1;

    ctx.beginPath();
    // 遍历顶点，随机连接它们，形成不规则的“冰裂多边形”
    for (let y = 0; y < segments; y++) {
      for (let x = 0; x < segments; x++) {
        const p1 = points[y][x];
        const p2 = points[y][x + 1];
        const p3 = points[y + 1][x];

        // 随机画横线或竖线
        if (Math.random() > 0.1) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); }
        if (Math.random() > 0.1) { ctx.moveTo(p1.x, p1.y); ctx.lineTo(p3.x, p3.y); }

        // 偶尔加入斜线交叉，增加碎裂感
        if (Math.random() > 0.6) {
          const p4 = points[y + 1][x + 1];
          ctx.moveTo(p1.x, p1.y); ctx.lineTo(p4.x, p4.y);
        }
      }
    }

    // 强制闭合最右侧和最下方的边界线
    for (let i = 0; i < segments; i++) {
      ctx.moveTo(points[i][segments].x, points[i][segments].y);
      ctx.lineTo(points[i + 1][segments].x, points[i + 1][segments].y);
      ctx.moveTo(points[segments][i].x, points[segments][i].y);
      ctx.lineTo(points[segments][i + 1].x, points[segments][i + 1].y);
    }
    ctx.stroke();

    // 将画好的 Canvas 直接转换为 Three.js 的材质贴图！
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3, 3); // 贴图在模型上重复多少次 (可以根据实际模型大小微调)

    // 因为裂纹需要混合到底色上，这里必须设置为使用贴图的黑色部分
    return texture;
  }

  // 立即生成三张不同的裂纹贴图存入内存
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
    map: crackTextures.medium
  });

  let ceramicMesh;

  // =========================================================
  // 6. 加载 3D 模型
  // =========================================================
  /* 
   * 【真实情况】：如果你有真实模型，取消下面这段注释，修改路径即可 
   */

  const gltfLoader = new GLTFLoader();
  gltfLoader.load('./models/taoci.glb', (gltf) => {
    ceramicMesh = gltf.scene;

    // 遍历模型的所有网格，赋予我们写的陶瓷材质
    ceramicMesh.traverse((child) => {
      if (child.isMesh) {
        child.material = ceramicMaterial;
      }
    });

    // 调整模型大小和位置
    ceramicMesh.scale.set(1, 1, 1);
    ceramicMesh.scale.set(8, 8, 8);
    ceramicMesh.position.set(-1, -1, 0);
    scene.add(ceramicMesh);
  });




  // 7. 响应滑块改变材质的逻辑
  function updateCeramicEffect() {
    const temp = parseInt(tempSlider.value);
    const cool = parseInt(coolSlider.value);

    // --- A. 更新 UI 数值 ---
    tempDisplayMiddle.textContent = temp + '° C';
    coolDisplayMiddle.textContent = cool + '° C/h';
    tempDisplayMonitor.textContent = temp + '° C';
    coolDisplayMonitor.textContent = cool + '° C/h';

    // --- B. 改变 3D 材质属性 ---

    // 1. 根据冷却速度改变裂纹纹理 (越快裂纹越密)
    if (cool < 100) {
      ceramicMaterial.map = crackTextures.sparse;
    } else if (cool >= 100 && cool < 160) {
      ceramicMaterial.map = crackTextures.medium;
    } else {
      ceramicMaterial.map = crackTextures.dense;
    }

    // 2. 根据温度改变瓷器底色 (高温偏青白，低温偏灰绿)
    // 使用 lerpColor 平滑过渡颜色
    const colorLow = new THREE.Color(0x6b8e8e); // 低温灰绿
    const colorHigh = new THREE.Color(0xcce6e6); // 高温青白
    const tempRatio = (temp - 900) / 400; // 0 到 1 之间
    ceramicMaterial.color.lerpColors(colorLow, colorHigh, tempRatio);

    // 3. 动态控制裂纹清晰度 (通过改变贴图的影响力)
    // ThreeJS中无法直接给 map 设置 opacity，但可以通过改变基础色和环境光的反应来模拟
    // 这里我们改变 clearcoatRoughness，温度越高，釉面融化越好，越光滑
    ceramicMaterial.clearcoatRoughness = 0.3 - (tempRatio * 0.25);

    ceramicMaterial.needsUpdate = true;
  }

  // 8. 绑定事件
  tempSlider.addEventListener('input', updateCeramicEffect);
  coolSlider.addEventListener('input', updateCeramicEffect);

  generateBtn.addEventListener('click', () => {
    // 添加一个简单的缩放动画模拟“重新生成”
    const targetScale = 0.1;
    ceramicMesh.scale.set(targetScale, targetScale, targetScale);

    setTimeout(() => {
      tempSlider.value = Math.floor(Math.random() * (1300 - 900) + 900);
      coolSlider.value = Math.floor(Math.random() * (200 - 50) + 50);
      updateCeramicEffect();

      // 恢复大小
      ceramicMesh.scale.set(1, 1, 1);
    }, 300);
  });


  // =========================================================
  // 新增：下载合并图片的逻辑
  // =========================================================
  const downloadBtn = document.getElementById('download-btn');

  downloadBtn.addEventListener('click', () => {
    // 获取需要的DOM元素
    const kilnContainer = document.querySelector('.kiln-container');
    const bgImg = document.querySelector('.kiln-bg');
    const webglCanvas = document.querySelector('#canvas-container canvas');

    // 如果背景图还没加载完，直接返回（正常情况下点击时肯定加载完了）
    if (!bgImg.complete) {
      alert("背景图片还在加载中，请稍后再试！");
      return;
    }

    // 1. 创建一个隐藏的 2D Canvas 用于合成
    const compCanvas = document.createElement('canvas');
    const width = kilnContainer.clientWidth;
    const height = kilnContainer.clientHeight;

    // 获取设备的像素比，确保下载的图片在高分屏（如Retina）上也是清晰的
    const dpr = window.devicePixelRatio || 1;
    compCanvas.width = width * dpr;
    compCanvas.height = height * dpr;

    const ctx = compCanvas.getContext('2d');
    // 缩放上下文，这样后面的绘制就可以直接使用 CSS 像素尺寸
    ctx.scale(dpr, dpr);

    // 绘制一个深色底色（防止有透明部分变成黑色）
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // 2. 绘制背景图片 (模拟 CSS 的 object-fit: contain 和 absolute 居中)
    const imgW = bgImg.naturalWidth;
    const imgH = bgImg.naturalHeight;
    const scale = Math.min(width / imgW, height / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const drawX = (width - drawW) / 2;
    const drawY = (height - drawH) / 2;

    ctx.drawImage(bgImg, drawX, drawY, drawW, drawH);

    // 3. 绘制 3D 模型 (模拟 CSS 中的宽高和 translate 偏移)
    // 根据 order.css，.porcelain 的 width 60%, height 60%
    const canvasW = width * 0.6;
    const canvasH = height * 0.6;

    // 根据 order.css，top 50%, left 50%, transform: translate(-50%, -40%)
    const canvasX = (width / 2) - (canvasW * 0.5);
    const canvasY = (height / 2) - (canvasH * 0.4);

    // 强制 Three.js 渲染最新的一帧，确保截到的是当前画面
    renderer.render(scene, camera);

    // 将 3D canvas 绘制到 2D canvas 上
    ctx.drawImage(webglCanvas, canvasX, canvasY, canvasW, canvasH);

    // 4. 将合成后的 Canvas 转换为图片并触发下载
    try {
      const dataURL = compCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      // 设置下载的文件名，加上当前的温度参数显得更专业
      const tempVal = document.getElementById('temp-slider').value;
      link.download = `秩序陶瓷-冰裂纹-${tempVal}度.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("导出图片失败:", e);
      alert("导出失败，可能是因为图片跨域问题。请确保在本地服务器环境（如 Live Server）下运行。");
    }
  });



  // 9. 处理窗口缩放
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // 10. 动画循环 (渲染帧)
  function animate() {
    requestAnimationFrame(animate);
    controls.update(); // 更新控制器
    renderer.render(scene, camera);
  }

  // 初始化首次效果并开始渲染
  updateCeramicEffect();
  animate();
}


init3D

