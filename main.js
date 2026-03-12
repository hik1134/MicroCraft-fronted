// main.js - 性能优化版
// 1. 基础场景设置
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.002);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 30;

// 高性能渲染配置 + 透明背景
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 限制像素比，提升性能
document.getElementById('canvas-container').appendChild(renderer.domElement);

// 2. 创建粒子系统
const particleCount = 15000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

// 复用颜色对象，减少GC
const color1 = new THREE.Color(0x00f0ff);
const color2 = new THREE.Color(0xffd700);
const tempColor = new THREE.Color();

for (let i = 0; i < particleCount; i++) {
  const angle = Math.random() * Math.PI * 2;
  const radius = 10 + Math.random() * 5 + (Math.random() < 0.1 ? Math.random() * 10 : 0);

  const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 2;
  const y = Math.sin(angle) * radius + (Math.random() - 0.5) * 2;
  const z = (Math.random() - 0.5) * 5;

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  // 颜色混合优化
  const mixRatio = Math.random() > 0.5 ? 0.8 : 0.2;
  tempColor.copy(color1).lerp(color2, mixRatio);

  colors[i * 3] = tempColor.r;
  colors[i * 3 + 1] = tempColor.g;
  colors[i * 3 + 2] = tempColor.b;
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

// 3. 粒子材质 (优化纹理生成)
function getTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.5, 'rgba(255,255,255,0.2)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  return new THREE.CanvasTexture(canvas);
}

const material = new THREE.PointsMaterial({
  size: 0.3,
  vertexColors: true,
  map: getTexture(),
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(geometry, material);
particles.frustumCulled = true; // 视锥体剔除优化
scene.add(particles);

// 4. 鼠标交互
let mouseX = 0;
let mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
  mouseX = (event.clientX - windowHalfX);
  mouseY = (event.clientY - windowHalfY);
});

// 5. 动画循环
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // 缓动动画逻辑
  const targetX = mouseX * 0.001;
  const targetY = mouseY * 0.001;

  particles.rotation.y += 0.002;
  particles.rotation.x += 0.05 * (targetY - particles.rotation.x);
  particles.rotation.y += 0.05 * (targetX - particles.rotation.y);

  // 呼吸效果
  const scale = 1 + Math.sin(elapsedTime * 0.5) * 0.05;
  particles.scale.set(scale, scale, scale);

  renderer.render(scene, camera);
}
animate();

// 6. 窗口大小调整自适应
window.addEventListener('resize', () => {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// 7. 平滑滚动到第二模块
document.querySelector('.arrow-down-art').addEventListener('click', () => {
  document.getElementById('decoder-module').scrollIntoView({
    behavior: 'smooth',
    block: 'start'
  });
});

// 滚动渐入效果
document.addEventListener('DOMContentLoaded', function () {
  const items = document.querySelectorAll('.feature-item, .content-left, .philosophy-item');

  // 简单的滚动渐入效果
  const observerOptions = {
    threshold: 0.2
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  items.forEach(item => {
    item.style.opacity = "0";
    item.style.transform = "translateY(30px)";
    item.style.transition = "all 0.8s ease-out";
    observer.observe(item);
  });
});

// 第四个模块 - 模拟后端数据
// const backendData = [
//   {
//     id: "0x11DB3575",
//     tag: "秩序",
//     tagType: "order",
//     imageUrl: "https://picsum.photos/400/300?random=1",
//     details: "温度: 1200°C / 冷却: 80°C/h",
//     date: "2024-01-15"
//   },
//   {
//     id: "0x43CE8EE4",
//     tag: "岁月",
//     tagType: "time",
//     imageUrl: "https://picsum.photos/400/300?random=2",
//     details: "时代: 唐宋 / pH: 6.5",
//     date: "2024-01-13"
//   },
//   {
//     id: "0x492029F6",
//     tag: "秩序",
//     tagType: "order",
//     imageUrl: "https://picsum.photos/400/300?random=3",
//     details: "温度: 1350°C / 冷却: 120°C/h",
//     date: "2024-01-11"
//   }
// ];

// 渲染函数
//function renderCards(data) {
//  const container = document.getElementById('cardContainer');

 // container.innerHTML = data.map(item => `
 //       <div class="card">
//           <div class="card-image-wrapper">
 //               <span class="tag tag-${item.tagType}">${item.tag}</span>
//              <img src="${item.imageUrl}" alt="artifact">
//            </div>
//            <div class="card-content">
//                <span class="code-id"># ${item.id}</span>
//                <div class="detail-item">
//                   <span>⛓</span> ${item.details}
//                </div>
//                <div class="date">${item.date}</div>
//            </div>
//        </div>
//    `).join('');
//}

// 初始化调用
//document.addEventListener('DOMContentLoaded', () => {
//  renderCards(backendData);
//});

// ==========================================
// 文明代码库 - 接口联调与交互逻辑
// ==========================================

// 1. 接口配置与核心状态
const API_CONFIG = {
  baseUrl: "http://118.89.82.148:8080",
  listEndpoint: "/posts/life-texture"
};

// 搜索与筛选参数状态管理
const queryParams = {
  page: 1,
  page_size: 12, // 配合网格布局，一次请求12条
  type: "new",   // 必填参数项，默认为 new
  sort: "",      // 秩序/逻辑/岁月/气韵
  keyword: ""    // ⚠️注意：你的接口文档截图里没有写keyword，需让后端加上此参数来支持搜索
};

// 2. 防抖工具函数（防止搜索输入过快导致频繁请求）
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

// 3. 核心：请求后端数据
async function fetchLifeTextureList() {
  const container = document.getElementById('cardContainer');
  // 请求前显示加载状态
  container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #888; padding: 50px;">正在连接文明代码库，解析数据中...</div>`;

  try {
    // 构建带有查询参数的 URL
    const url = new URL(`${API_CONFIG.baseUrl}${API_CONFIG.listEndpoint}`);
    url.searchParams.append("page", queryParams.page);
    url.searchParams.append("page_size", queryParams.page_size);
    url.searchParams.append("type", queryParams.type);

    // 如果有筛选条件才拼接
    if (queryParams.sort) url.searchParams.append("sort", queryParams.sort);
    if (queryParams.keyword) url.searchParams.append("keyword", queryParams.keyword);

    // 发起请求
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

    const res = await response.json();

    // ⚠️【极重要】：这里需要根据你后端实际返回的 JSON 结构调整
    // 假设后端返回的是 { code: 200, data: { list: [...] } }
    const dataList = res.data?.list || res.data || [];

    renderCards(dataList);

  } catch (error) {
    console.error("代码库接口请求失败：", error);
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: #ff4d4f; padding: 50px;">无法连接到数据库，请确认本地 118.89.82.148:8080 服务已启动。</div>`;
  }
}

// 4. 渲染卡片 DOM
function renderCards(dataList) {
  const container = document.getElementById('cardContainer');

  if (!dataList || dataList.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 0; color: #888;">
        <p>该维度下暂无文明切片记录...</p>
      </div>`;
    return;
  }

  // 映射英文类名，用于匹配CSS颜色
  const tagColorMap = {
    '秩序': 'order',
    '逻辑': 'logic', // 如果没有定义 tag-logic，需要在 CSS 里补充
    '岁月': 'time',
    '气韵': 'flow'   // 如果没有定义 tag-flow，需要在 CSS 里补充
  };

  container.innerHTML = dataList.map(item => {
    // ⚠️【注意】：由于截图没有展示 Response，以下 item.xxx 请全部替换为你们后端实际返回的字段名！
    const id = item.id || item.post_id || "未知";
    const imgUrl = item.image_url || item.cover || "https://picsum.photos/400/300?random=" + Math.random();
    const tagText = item.sort || item.category || queryParams.sort || "档案";
    const desc = item.description || item.content || item.title || "温度: 1200°C / 冷却: 80°C/h";
    const date = item.created_at || item.create_time || "未知纪元";

    const tagClass = tagColorMap[tagText] || 'order';

    return `
      <div class="card" onclick="window.location.href='详情页.html?id=${id}'" style="cursor: pointer;">
          <div class="card-image-wrapper">
              <span class="tag tag-${tagClass}">${tagText}</span>
              <img src="${imgUrl}" alt="文明素材" loading="lazy">
          </div>
          <div class="card-content">
              <span class="code-id"># 0x${String(id).padStart(6, '0').toUpperCase()}</span>
              <div class="detail-item">
                  <span>⛓</span> ${desc}
              </div>
              <div class="date">${date}</div>
          </div>
      </div>
    `;
  }).join('');
}

// 5. 事件绑定初始化
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('.search-input');
  const tagBtns = document.querySelectorAll('.tag-btn.click-glow');

  // 首次加载请求全部数据
  fetchLifeTextureList();

  // 交互 1：搜索框输入（停顿 0.6 秒后自动触发搜索）
  const handleInput = debounce((e) => {
    queryParams.keyword = e.target.value.trim();
    queryParams.page = 1; // 重新搜索时回退到第一页
    fetchLifeTextureList();
  }, 600);
  if (searchInput) searchInput.addEventListener('input', handleInput);

  // 交互 2：点击标签筛选
  tagBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const clickedBtn = e.target;
      const isAlreadyActive = clickedBtn.classList.contains('active');

      // 清除所有按钮的高亮状态
      tagBtns.forEach(item => item.classList.remove('active'));

      if (isAlreadyActive) {
        // 如果点击的是已经激活的按钮 -> 取消筛选，请求全部
        queryParams.sort = "";
      } else {
        // 激活当前按钮 -> 赋值筛选条件
        clickedBtn.classList.add('active');
        queryParams.sort = clickedBtn.getAttribute('data-sort');
      }

      // 重置页码并重新请求数据
      queryParams.page = 1;
      fetchLifeTextureList();
    });
  });
});






// 实验室部分
// ==========================================
// 实验室部分 - 滚动到该区域时触发开门动画
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
  const sciFiModule = document.getElementById('sciFiModule');

  if (!sciFiModule) return;

  // 使用 IntersectionObserver 监听元素是否进入视口
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // 当模块进入视口时 (isIntersecting 为 true)
      if (entry.isIntersecting) {
        // 添加 active 类，触发 CSS 中的开门、下降和淡入动画
        entry.target.classList.add('active');

        // 触发一次后取消监听，这样门打开后就不会随着上下滚动反复开合了
        observer.unobserve(entry.target);
      }
    });
  }, {
    // threshold: 0.3 表示当这个模块有 30% 露出在屏幕中时，才触发动画
    // 如果你想一露头就开门，可以改成 0.1；如果想完全显示在屏幕中间再开门，可以改成 0.5 或更高
    threshold: 0.4
  });

  // 开始监听实验室模块
  observer.observe(sciFiModule);
});

// ==========================================
// 顶部导航栏 - 登录状态检测与退出功能
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 从本地缓存读取后端传来的数据
  const userType = localStorage.getItem('userType');
  const userName = localStorage.getItem('userName');

  // 获取 HTML 元素
  const loginBtn = document.getElementById('nav-login-btn');
  const userProfile = document.getElementById('nav-user-profile');
  const nicknameSpan = document.getElementById('user-nickname');

  const infoToggle = document.getElementById('user-info-toggle');
  const dropdown = document.getElementById('logout-dropdown');
  const logoutBtn = document.getElementById('logout-btn');

  // 1. 判断并切换 UI 显示状态
  if (userType === 'user' && userName) {
    // 已经登录：隐藏登录按钮，显示用户区域
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) userProfile.style.display = 'flex';
    if (nicknameSpan) nicknameSpan.textContent = userName; // 填入后端的昵称
  } else {
    // 未登录：显示登录按钮，隐藏用户区域
    if (loginBtn) loginBtn.style.display = 'flex';
    if (userProfile) userProfile.style.display = 'none';
  }

  // 2. 点击昵称展示/隐藏退出菜单
  if (infoToggle && dropdown) {
    infoToggle.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止点击事件穿透
      dropdown.classList.toggle('show');
    });

    // 点击页面空白处，自动收起下拉菜单
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    });
  }

  // 3. 点击退出登录按钮
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      // 清除所有登录凭证
      localStorage.removeItem('userToken');
      localStorage.removeItem('userType');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');

      alert("已退出登录");
      // 刷新当前页面，恢复为未登录的初始状态
      window.location.reload();
    });
  }
});