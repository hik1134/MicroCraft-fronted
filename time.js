document.addEventListener('DOMContentLoaded', () => {

  // --- 获取 DOM 元素 ---
  const navItems = document.querySelectorAll('.nav-item');
  const timelineItems = document.querySelectorAll('.timeline-item');
  const slider = document.getElementById('rustRange');
  const sliderFill = document.getElementById('sliderFill');
  const percentDisplay = document.getElementById('rustPercent');
  const bronzeImg = document.getElementById('bronzeImage');
  const rustOverlay = document.getElementById('rustOverlay');

  // 注意：HTML中存在ID重复问题，这里分别通过ID和Class获取区分
  const simulateBtn = document.getElementById('simulateBtn'); // 获取第一个匹配ID的元素(模拟按钮)
  const downloadBtn = document.querySelector('.btn-download'); // 通过类名获取下载按钮

  const acidRainToggle = document.getElementById('acidRainToggle');
  const phValue = document.getElementById('phValue');

  // --- 状态变量 ---
  let currentRustLevel = 0;
  let isSimulating = false;

  // --- 1. 顶部导航切换 ---
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除所有激活状态
      navItems.forEach(nav => nav.classList.remove('active'));
      // 激活当前
      item.classList.add('active');

      // UI 切换演示
      console.log(`Switched to tab: ${item.dataset.tab}`);
    });
  });

  // --- 2. 时间轴切换 ---
  timelineItems.forEach(item => {
    item.addEventListener('click', () => {
      // UI 更新
      timelineItems.forEach(t => {
        t.classList.remove('active');
        const dot = t.querySelector('.dot');
        dot.textContent = '○';
      });
      item.classList.add('active');
      item.querySelector('.dot').textContent = '●';

      // 逻辑更新：根据朝代设置一个基础锈蚀值（模拟）
      const era = item.dataset.era;
      let baseRust = 0;
      switch (era) {
        case 'shang': baseRust = 80; break;
        case 'qin': baseRust = 60; break;
        case 'tang': baseRust = 30; break;
        case 'modern': baseRust = 0; break;
      }

      // 更新滑动条和视觉
      updateRustVisuals(baseRust);
    });
  });

  // --- 3. 锈蚀模拟逻辑 (核心) ---

  // 监听滑动条输入
  slider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    updateRustVisuals(val);
  });

  // 统一更新视觉效果的函数
  function updateRustVisuals(value) {
    currentRustLevel = value;

    // 1. 更新文字
    percentDisplay.textContent = `${value}%`;

    // 2. 更新滑动条填充条
    slider.value = value;
    sliderFill.style.width = `${value}%`;

    // 3. 更新图片滤镜 (算法模拟)
    const sepiaVal = value * 0.5;
    const contrastVal = 100 - (value * 0.2);

    bronzeImg.style.filter = `
            sepia(${sepiaVal}%) 
            contrast(${contrastVal}%)
        `;

    // 4. 更新覆盖层透明度 (模拟铜绿)
    const opacity = (value / 100) * 0.8;
    rustOverlay.style.opacity = opacity;
  }

  // --- 4. 模拟动画 ---
  simulateBtn.addEventListener('click', () => {
    if (isSimulating) return;
    isSimulating = true;
    simulateBtn.textContent = "模拟中...";
    simulateBtn.style.opacity = "0.7";

    // 从当前值开始，动画到 100%
    let start = currentRustLevel;
    if (start >= 100) start = 0; // 如果已经是100，重置重来

    const duration = 2000; // 2秒完成
    const startTime = performance.now();

    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1); // 0 到 1

      // 缓动计算当前值
      const currentVal = Math.floor(start + (100 - start) * progress);

      updateRustVisuals(currentVal);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        isSimulating = false;
        simulateBtn.textContent = "模拟时间流逝";
        simulateBtn.style.opacity = "1";
      }
    }

    requestAnimationFrame(animate);
  });

  // --- 5. 环境互动 ---
  acidRainToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
      phValue.textContent = "4.5"; // 酸雨 pH 值
      phValue.style.color = "#ff6b6b";
      // 如果开启酸雨，增加锈蚀程度
      if (currentRustLevel < 90) {
        updateRustVisuals(currentRustLevel + 10);
      }
    } else {
      phValue.textContent = "7.2";
      phValue.style.color = "var(--text-grey)"; // 这里需确保CSS变量有效，或者直接写颜色代码
      if (phValue.style.color === "") phValue.style.color = "#888";
    }
  });

  // --- 6. 下载合成图片功能 (新增) ---
  downloadBtn.addEventListener('click', () => {
    // 创建一个临时的 Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 确保图片已加载
    if (!bronzeImg.complete) {
      alert("图片尚未加载完成，请稍后再试");
      return;
    }

    // 设置 Canvas 尺寸为图片的原始尺寸 (确保高清下载)
    canvas.width = bronzeImg.naturalWidth;
    canvas.height = bronzeImg.naturalHeight;

    // 1. 绘制底层图片并应用滤镜
    // 计算当前滤镜值
    const sepiaVal = currentRustLevel * 0.5;
    const contrastVal = 100 - (currentRustLevel * 0.2);

    // 设置 Canvas 滤镜
    ctx.filter = `sepia(${sepiaVal}%) contrast(${contrastVal}%)`;

    // 将图片绘制到 Canvas 上
    ctx.drawImage(bronzeImg, 0, 0, canvas.width, canvas.height);

    // 2. 绘制锈蚀遮罩层
    // 重置滤镜，以免影响遮罩颜色
    ctx.filter = 'none';

    // 获取 CSS 中设置的遮罩层背景色 (如果CSS未加载，默认为青绿色)
    const overlayStyle = window.getComputedStyle(rustOverlay);
    const overlayColor = overlayStyle.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? overlayStyle.backgroundColor
      : '#546c56'; // 默认铜绿色兜底

    // 设置透明度
    const overlayOpacity = (currentRustLevel / 100) * 0.8;

    ctx.globalAlpha = overlayOpacity;
    ctx.fillStyle = overlayColor;

    // 绘制覆盖整个画布的矩形
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. 触发下载
    try {
      const dataURL = canvas.toDataURL('image/png');
      const link = document.createElement('a');

      // 生成带时间戳的文件名
      const date = new Date();
      const timeStr = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate()}`;
      link.download = `青铜锈蚀模拟_${timeStr}_Lv${currentRustLevel}.png`;

      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("图片下载失败，可能是跨域问题:", err);
      alert("下载失败：无法合成图片（请确保在本地服务器或支持的环境中运行）");
    }
  });

  // 初始化
  updateRustVisuals(0);
});