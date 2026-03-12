document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('weaveCanvas');
  const ctx = canvas.getContext('2d');

  const textInput = document.getElementById('textInput');
  const binaryOutput = document.getElementById('binaryOutput');
  const hueSlider = document.getElementById('hueSlider');
  const patternBtns = document.querySelectorAll('.pat-btn');
  const startBtn = document.getElementById('startBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  let config = {
    text: textInput.value,
    binary: '',
    hue: hueSlider.value,
    pattern: 'cloud',
    pixelSize: 3, // 模拟丝线的精细度，越小越细腻
    gap: 1        // 经纬线间距
  };

  // 为了高清屏渲染更好，使用双倍分辨率
  const dpr = window.devicePixelRatio || 1;
  const canvasWidth = 800;
  const canvasHeight = 600;
  canvas.width = canvasWidth * dpr;
  canvas.height = canvasHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = canvasWidth + 'px';
  canvas.style.height = canvasHeight + 'px';

  // 1. 文字转二进制 (保持不变，增加一点随机打乱的质感)
  function updateBinary() {
    let str = "";
    let displayStr = "";
    for (let i = 0; i < config.text.length; i++) {
      let code = config.text.charCodeAt(i).toString(2).padStart(16, '0');
      str += code;
      displayStr += code + " ";
    }
    // 如果文字太短，重复它以铺满纹理
    while (str.length < 1000) {
      str += str;
    }
    config.binary = str;
    binaryOutput.innerText = displayStr.substring(0, 150) + "...";
  }

  // 2. 核心数学图案生成器
  function getPatternMask(x, y, w, h, type) {
    // 归一化坐标 (-1 到 1)
    const nx = (x / w) * 2 - 1;
    const ny = (y / h) * 2 - 1;
    // 极坐标
    const r = Math.sqrt(nx * nx + ny * ny);
    const angle = Math.atan2(ny, nx);

    switch (type) {
      case 'cloud':
        // 祥云：使用重叠的圆形和正弦波模拟云纹的卷曲
        let cloudVal = Math.sin(x * 0.05 + Math.sin(y * 0.03) * 3) + Math.cos(y * 0.04);
        let cloudCircle = Math.sin(r * 15 - angle * 3); // 螺旋感
        return (cloudVal + cloudCircle) > 0.5;

      case 'dragon':
        // 传统龙纹：使用李萨如曲线和对角线波浪模拟龙身和鳞片
        let dragonBody = Math.sin(nx * 10 + ny * 5) * Math.cos(nx * 5 - ny * 10);
        let scales = Math.sin(x * 0.1) * Math.cos(y * 0.1); // 鳞片网格
        let sCurve = Math.abs(ny - Math.sin(nx * 3) * 0.5) < 0.3; // S型主干
        return (dragonBody + scales > 0.5) || (sCurve && scales > 0);

      case 'flower':
        // 花朵：数学中的玫瑰曲线 (Rose Curve)
        const petals = 6; // 6瓣
        const petalShape = Math.abs(Math.cos(angle * petals / 2));
        const flowerRadius = 0.8 + Math.sin(r * 20) * 0.1; // 花瓣边缘褶皱
        return r < petalShape * flowerRadius && r > 0.1; // 中心留空做花蕊

      case 'landscape':
        // 山水：叠加不同频率的正弦波形成远近山脉
        let mountain1 = Math.sin(x * 0.01) * 100 + Math.cos(x * 0.005) * 50 + 300;
        let mountain2 = Math.sin(x * 0.02 + 2) * 60 + Math.cos(x * 0.01) * 40 + 400;
        let waterRipple = Math.sin(x * 0.05) * Math.sin(y * 0.1) > 0.5;

        if (y > mountain1 && y < mountain2) return true; // 远山
        if (y > mountain2) return waterRipple; // 近水波纹
        return false; // 天空留白
    }
    return false;
  }

  // 3. 绘制织锦
  function draw() {
    // 画布底色（织锦的底布，深色丝绸质感）
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 绘制暗色经纬线底纹（模拟布料肌理）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < canvasWidth; i += 4) ctx.fillRect(i, 0, 1, canvasHeight);
    for (let i = 0; i < canvasHeight; i += 4) ctx.fillRect(0, i, canvasWidth, 1);

    const data = config.binary;
    if (!data) return;

    const cellSize = config.pixelSize + config.gap;
    const cols = Math.floor(canvasWidth / cellSize);
    const rows = Math.floor(canvasHeight / cellSize);

    // 设置丝线光泽（使用发光效果）
    ctx.shadowBlur = 5;
    ctx.shadowColor = `hsla(${config.hue}, 80%, 50%, 0.5)`;

    // 遍历网格“织布”
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        // 真实像素坐标
        let px = x * cellSize;
        let py = y * cellSize;

        // 1. 从文字中提取二进制位，决定基础肌理
        // 使用质数错位算法，让二进制文字均匀分布在二维画面上
        let bitIndex = (x * 73 + y * 37) % data.length;
        let isGoldThread = data[bitIndex] === '1';

        // 2. 获取数学轮廓遮罩
        let inPattern = getPatternMask(px, py, canvasWidth, canvasHeight, config.pattern);

        // 3. 编织逻辑
        if (inPattern) {
          if (isGoldThread) {
            // 主图纹理：亮色丝线（受色相控制）
            // 增加一点随机亮度模拟丝绸反光
            let lightness = 50 + Math.random() * 20;
            ctx.fillStyle = `hsl(${config.hue}, 70%, ${lightness}%)`;
            // 模拟“挑针”：横向或纵向的小矩形
            if ((x + y) % 2 === 0) {
              ctx.fillRect(px, py, config.pixelSize * 1.5, config.pixelSize - 1);
            } else {
              ctx.fillRect(px, py, config.pixelSize - 1, config.pixelSize * 1.5);
            }
          } else {
            // 主图中不亮的点：暗金色过渡
            ctx.fillStyle = `hsl(${config.hue}, 30%, 20%)`;
            ctx.fillRect(px, py, config.pixelSize, config.pixelSize);
          }
        } else {
          // 背景区域：如果不属于图案，偶尔闪烁几颗文字数据点，形成暗纹
          if (isGoldThread && Math.random() > 0.92) {
            ctx.fillStyle = `hsla(${config.hue}, 40%, 30%, 0.3)`;
            ctx.fillRect(px, py, config.pixelSize, config.pixelSize);
          }
        }
      }
    }

    // 关掉发光避免影响下次绘制
    ctx.shadowBlur = 0;
  }

  // --- 交互事件绑定 ---
  textInput.addEventListener('input', (e) => {
    config.text = e.target.value || "锦绣"; // 防止为空
    updateBinary();
    draw();
  });

  hueSlider.addEventListener('input', (e) => {
    config.hue = e.target.value;
    draw();
  });

  patternBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      patternBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      config.pattern = btn.dataset.type;
      draw();
    });
  });

  // 开始编织动画（从上到下模拟织布机）
  startBtn.addEventListener('click', () => {
    const backupHue = config.hue;
    let step = 0;
    startBtn.disabled = true;
    startBtn.innerHTML = "编织中...";

    let interval = setInterval(() => {
      config.hue = (parseInt(backupHue) + step * 5) % 360; // 颜色渐变流转
      draw();

      // 绘制一条扫描线，模拟织布机的梭子
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillRect(0, step * (canvasHeight / 20), canvasWidth, 2);

      step++;
      if (step > 20) {
        clearInterval(interval);
        config.hue = backupHue;
        draw(); // 恢复正常
        startBtn.disabled = false;
        startBtn.innerHTML = `<span class="icon">▷</span> 开始编织`;
      }
    }, 50);
  });

  // 下载图片
  downloadBtn.addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `digital_brocade_${config.pattern}.png`;
    a.click();
  });

  // 初始化
  updateBinary();
  draw();
});