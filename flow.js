document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('artCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const container = document.querySelector('.canvas-container');

  // UI 元素
  const opacityRange = document.getElementById('opacityRange');
  const sizeRange = document.getElementById('sizeRange');
  const opacityValue = document.getElementById('opacityValue');
  const sizeValue = document.getElementById('sizeValue');
  const clearBtn = document.getElementById('clearBtn');
  const saveBtn = document.getElementById('saveBtn');
  const strokeCountEl = document.getElementById('strokeCount');
  const pointCountEl = document.getElementById('pointCount');

  // 状态变量
  let isDrawing = false;
  // 关键：存储最近的几个点，用于计算贝塞尔曲线
  let points = [];

  // 参数配置
  let baseOpacity = 0.8;
  let baseSize = 20;

  // 平滑处理用的变量（用于避免笔触大小突变）
  let lastLineWidth = baseSize;
  let lastVelocity = 0;

  // 统计
  let strokeCount = 0;
  let totalPoints = 0;
  const PAPER_COLOR = '#F3F2EA';

  // 初始化
  function initCanvas() {
    const rect = container.getBoundingClientRect();
    // 设置两倍分辨率以支持高清屏
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';

    ctx.scale(2, 2); // 缩放坐标系
    clearCanvas();
  }

  function clearCanvas() {
    ctx.fillStyle = PAPER_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // 恢复纸张纹理（可选）
    strokeCount = 0;
    totalPoints = 0;
    updateStats();
  }

  function updateStats() {
    strokeCountEl.textContent = strokeCount;
    pointCountEl.textContent = Math.floor(totalPoints / 10); // 除以10为了数值不那么夸张
  }

  // --- 核心算法：基于贝塞尔曲线的平滑笔触 ---

  // 在两个点之间画线，参数：起点，终点，控制点（用于弯曲）
  function drawCurve(p1, p2, p3) {
    // 计算两点之间的距离
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y) + Math.hypot(p2.x - p3.x, p2.y - p3.y);

    // 计算速度 (距离 / 时间差)
    // 注意：这里简化计算，假设事件触发间隔近似，主要靠距离判断快慢
    const velocity = dist;

    // 平滑速度变化 (动量效果，让变化不那么剧烈)
    const smoothedVelocity = lastVelocity * 0.6 + velocity * 0.4;
    lastVelocity = smoothedVelocity;

    // 根据速度计算笔触宽度
    // 速度越快(smoothedVelocity大) -> 笔越细
    // 速度越慢 -> 笔越粗
    const targetWidth = Math.max(baseSize * 0.2, baseSize - smoothedVelocity * 1.5);

    // 再次平滑宽度变化
    const width = lastLineWidth * 0.7 + targetWidth * 0.3;
    lastLineWidth = width;

    // 飞白阈值：速度超过一定值，开始产生飞白
    // 这里的 10 是一个经验值，根据实际手感调整
    const isFast = smoothedVelocity > 8;

    // 贝塞尔曲线插值
    // 我们不直接画线，而是沿着曲线“撒点”
    // 步长：慢的时候步长小（致密），快的时候步长大（飞白）
    let step = 1;
    if (isFast) {
      step = Math.min(dist / 3, 6); // 飞白时的间距
    }

    // t 从 0 到 1 遍历贝塞尔曲线
    // 二次贝塞尔公式: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    for (let t = 0; t <= 1; t += (step / dist)) {
      const tt = t * t;
      const u = 1 - t;
      const uu = u * u;

      const x = uu * p1.x + 2 * u * t * p2.x + tt * p3.x;
      const y = uu * p1.y + 2 * u * t * p2.y + tt * p3.y;

      // 绘制圆点
      ctx.beginPath();

      // 随机噪点（模拟毛笔边缘）
      const rRandom = Math.random() * (width * 0.15);
      let finalRadius = (width / 2) + rRandom;

      // 飞白核心逻辑：如果速度极快，随机跳过绘制，或者减小半径
      if (isFast && Math.random() > 0.4) {
        // 模拟枯笔：偶尔不画，或者画得很淡
        continue;
      }

      ctx.arc(x, y, finalRadius, 0, Math.PI * 2);

      // 颜色：快则浅，慢则深
      let alpha = baseOpacity;
      if (isFast) alpha *= 0.6;

      ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
      ctx.fill();
      totalPoints++;
    }
    updateStats();
  }

  // --- 事件处理 ---

  function getPos(e) {
    const rect = container.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      time: Date.now()
    };
  }

  const startDrawing = (e) => {
    isDrawing = true;
    points = []; // 重置点集合
    const pos = getPos(e);
    points.push(pos); // 存入第一个点

    // 重置平滑参数
    lastLineWidth = baseSize;
    lastVelocity = 0;

    // 绘制一个初始圆点，保证点击也有墨
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, baseSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,0,0,${baseOpacity})`;
    ctx.fill();

    strokeCount++;
    updateStats();
  };

  const moveDrawing = (e) => {
    if (!isDrawing) return;
    const pos = getPos(e);
    points.push(pos);

    // 至少需要3个点才能绘制一段平滑的贝塞尔曲线
    if (points.length > 3) {
      const lastTwoPoints = points.slice(-3); // 取最后3个点
      const p0 = lastTwoPoints[0];
      const p1 = lastTwoPoints[1]; // 控制点
      const p2 = lastTwoPoints[2];

      // 核心技巧：取中点。
      // 真正的曲线起点和终点，是这些捕获点的“中点”，这样曲线才会穿过所有捕获点并保持平滑。
      const mid1 = {
        x: (p0.x + p1.x) / 2,
        y: (p0.y + p1.y) / 2
      };
      const mid2 = {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2
      };

      // 在两个中点之间，以 p1 为控制点画曲线
      drawCurve(mid1, p1, mid2);

      // 为了性能，移除太久以前的点，只保留最后几个
      points.shift();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    isDrawing = false;
    // 笔画结束时不需要特殊处理，自然的断开即可
    points = [];
  };

  // 绑定事件
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', moveDrawing);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e); }, { passive: false });
  canvas.addEventListener('touchmove', (e) => { e.preventDefault(); moveDrawing(e); }, { passive: false });
  canvas.addEventListener('touchend', stopDrawing);

  // UI 控件
  opacityRange.addEventListener('input', (e) => {
    const val = e.target.value;
    baseOpacity = val / 100;
    opacityValue.textContent = `${val}%`;
  });

  sizeRange.addEventListener('input', (e) => {
    const val = e.target.value;
    baseSize = parseInt(val);
    sizeValue.textContent = `${val}px`;
  });

  clearBtn.addEventListener('click', () => {
    clearCanvas();
  });

  saveBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `气韵书画_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  window.addEventListener('resize', initCanvas);

  // 启动
  initCanvas();
  baseOpacity = opacityRange.value / 100;
  baseSize = parseInt(sizeRange.value);
});