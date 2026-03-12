/* ================== 1. 全局配置与状态 ================== */
const API_BASE_URL = '118.89.82.148:8080';

// 获取 Token 和 当前用户名
function getToken() { return localStorage.getItem('userToken') || ''; }
function getCurrentUserName() { return localStorage.getItem('userName') || '当前用户'; }

// 标签映射字典：前端中文类别 -> 后端需要的 type
const TAG_TYPE_MAP = {
  'all': '',
  'texture': 'order',
  'logic': 'logic',
  'time': 'time',
  'charm': 'flow'
};

// 全局状态变量
let currentPage = 1;
const ITEMS_PER_PAGE = 6;
let currentFilterType = '';
let currentKeyword = ''; // 当前搜索关键词
let cameraStream = null;

let globalLocalFile = null;
let globalLocalCategory = 'order';
let globalPhotoCategory = 'order';
let globalPhotoAlbumFile = null;

// 游客权限拦截器
function isGuestUser() {
  const userType = localStorage.getItem('userType');
  return !userType || userType === 'guest';
}

function handleUploadClick(modalId) {
  if (isGuestUser()) {
    alert('游客模式下：仅可浏览展览与详情！\n上传作品请先登录。');
    return;
  }
  openCustomModal(modalId);
}

/* ================== 2. 核心 API 请求封装 ================== */

// 【接口1】获取我的作品 (需登录) —— 加上 source 过滤，只看本地上传的，不看拍照的
async function apiGetMyWorks(page = 1, pageSize = 3) {
  // 注意这里加上了 &source=local_upload，告诉后端不要把 photo_upload 返回给我
  let url = `${API_BASE_URL}/api/works/mine?page=${page}&page_size=${pageSize}&source=local_upload`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return await response.json();
  } catch (error) { return null; }
}

// 【接口2】获取纹理展览列表 (公共，带筛选和搜索)
async function apiGetExhibition(page = 1, pageSize = 6, type = '', keyword = '') {
  let url = `${API_BASE_URL}/posts/exhibition?page=${page}&page_size=${pageSize}`;
  if (type) url += `&type=${type}`;
  if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`; // 假设后端支持 keyword 搜索
  try {
    const response = await fetch(url, { method: 'GET' });
    return await response.json();
  } catch (error) { return null; }
}

// 【接口3】获取生活代码库 (公共)
async function apiGetLifeTexture(page = 1, pageSize = 3) {
  let url = `${API_BASE_URL}/posts/life-texture?page=${page}&page_size=${pageSize}`;
  try {
    const response = await fetch(url, { method: 'GET' });
    return await response.json();
  } catch (error) { return null; }
}

// 【接口4】上传作品 (local 或 photo)
async function apiUploadWork(fileData, title, type, uploadType = 'local') {
  const url = `${API_BASE_URL}/api/works/upload/${uploadType}`;
  const formData = new FormData();
  formData.append('file', fileData);
  formData.append('title', title);
  formData.append('type', type);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    });
    return await response.json();
  } catch (error) { return null; }
}

function handlePhotoAlbumUpload(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('请选择图片格式的文件！');
    input.value = '';
    return;
  }

  globalPhotoAlbumFile = file;

  const fileNameDisplay = document.getElementById('photoAlbumFileNameDisplay');
  if (fileNameDisplay) {
    fileNameDisplay.innerText = `已选择: ${file.name}`;
    fileNameDisplay.style.color = '#c5a059';
  }

  const titleInput = document.getElementById('photoAlbumArtworkName');
  if (titleInput && !titleInput.value) {
    titleInput.value = file.name.replace(/\.\w+$/, '');
  }
}

// 【接口5】删除作品
async function apiDeleteWork(workId) {
  const url = `${API_BASE_URL}/api/works/${workId}`;
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return await response.json();
  } catch (error) { return null; }
}

/* ================== 3. 页面渲染与初始化 ================== */
document.addEventListener('DOMContentLoaded', () => {
  initMyWorksWidget();            // 渲染我的作品
  renderExhibitionPage(1);        // 渲染纹理展览
  initCodeLibraryWidget();        // 渲染底部的代码库
  setupFilterAndSearchEvents();   // 绑定搜索与筛选事件
});

// 1. 渲染我的作品区
async function initMyWorksWidget() {
  const container = document.getElementById('myWorksGrid');
  if (!container) return;

  if (isGuestUser()) {
    container.innerHTML = `
      <div class="guest-beautiful-prompt">
        <img src="./社区板及素材块/第一部分/第一个的上传.png" alt="lock" class="guest-prompt-icon">
        <div class="guest-prompt-title">您当前为游客模式</div>
        <div class="guest-prompt-desc">登录后即可建立专属的纹理档案，并与社区分享您的发现</div>
        <button class="btn-custom btn-yellow guest-login-btn" onclick="window.location.href='login-denglu.html'">立即登录</button>
      </div>`;
    return;
  }

  const res = await apiGetMyWorks(1, 3);
  if (res && res.code === 'OK' && res.data && res.data.list) {
    if (res.data.list.length === 0) {
      container.innerHTML = '<div style="color:#666; grid-column:1/-1; text-align:center; padding: 40px 0;">您还没有上传过作品哦，快去上传吧！</div>';
    } else {
      renderMyWorksCards('myWorksGrid', res.data.list); // 使用专用渲染器
    }
  }
}

// 2. 渲染纹理展览区
async function renderExhibitionPage(page) {
  currentPage = page;
  const container = document.getElementById('exhibitionGrid');
  container.innerHTML = '<div style="color:#fff; text-align:center; grid-column:1/-1;">数据加载中...</div>';

  // 调用社区帖子接口，传入当前页码、页大小、类别、搜索词
  const res = await apiGetExhibition(page, ITEMS_PER_PAGE, currentFilterType, currentKeyword);

  if (res && res.code === 'OK' && res.data && res.data.list && res.data.list.length > 0) {
    renderPostCards('exhibitionGrid', res.data.list); // 使用帖子专用渲染器
    renderPaginationUI(res.data.total || 0);
  } else {
    container.innerHTML = '<div style="color:#666; grid-column:1/-1; text-align:center; padding: 40px 0;">暂无相关作品数据</div>';
    renderPaginationUI(0);
  }
}

// 3. 渲染底部代码库 (生活纹理)
async function initCodeLibraryWidget() {
  const res = await apiGetLifeTexture(1, 3);
  if (res && res.code === 'OK' && res.data && res.data.list && res.data.list.length > 0) {
    renderPostCards('libraryGrid', res.data.list);
  }
}

/* ================== 4. UI 卡片渲染器 ================== */
// 图片地址补全工具
function normalizeImageUrl(path) {
  if (!path) return 'https://via.placeholder.com/300x200?text=No+Image';
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path}`;
}

// 标签中文转换
function getTypeName(typeStr) {
  const map = { 'order': '秩序', 'logic': '逻辑', 'time': '岁月', 'flow': '气韵' };
  return map[typeStr] || typeStr || '未分类';
}

// A. 渲染【我的作品】（数据结构直接是 work）
function renderMyWorksCards(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = data.map(item => {
    const imgUrl = normalizeImageUrl(item.thumbnail_url || item.file_url);
    const tagHtml = `<span class="work-tag" style="background: rgba(255,255,255,0.08); padding: 4px 8px; border-radius: 4px;">${getTypeName(item.type)}</span>`;

    return `
      <div class="work-card">
          <div class="work-img-wrapper">
              <img src="${imgUrl}" alt="${item.title}">
              <div class="work-delete-btn" onclick="deleteWork('${item.work_id}', event)">删除</div>
          </div>
          <div class="work-info">
              <div class="work-tags" style="margin-bottom: 8px;">${tagHtml}</div>
              <h3 class="work-title font-serif text-16">${item.title}</h3>
              <div class="work-author">by ${getCurrentUserName()}</div>
          </div>
      </div>
    `;
  }).join('');
}

// B. 渲染【社区展览帖】（数据结构包含 post_id, work{}, author{}, like_count, view_count）
function renderPostCards(containerId, data) {
  const container = document.getElementById(containerId);
  container.innerHTML = data.map(item => {
    const work = item.work || {};
    const author = item.author || {};
    const imgUrl = normalizeImageUrl(work.thumbnail_url || work.file_url);
    const tagHtml = `<span class="work-tag" style="background: rgba(255,255,255,0.08); padding: 4px 8px; border-radius: 4px;">${getTypeName(work.type)}</span>`;

    return `
      <div class="work-card">
          <div class="work-img-wrapper">
              <img src="${imgUrl}" alt="${work.title}">
          </div>
          <div class="work-info">
              <div class="work-tags" style="margin-bottom: 8px;">${tagHtml}</div>
              <h3 class="work-title font-serif text-16">${work.title || '未命名'}</h3>
              <div class="work-author">by ${author.nickname || '匿名探索者'}</div>
              <div class="work-stats">
                  <div class="stat-item"><img src="社区板及素材块/第一部分/眼睛_显示.png" style="width:12px; margin-right:4px;"> ${item.view_count || 0}</div>
                  <div class="stat-item"><img src="社区板及素材块/第一部分/爱心.png" style="width:12px; margin-right:4px;"> ${item.like_count || 0}</div>
              </div>
          </div>
      </div>
    `;
  }).join('');
}

/* ================== 5. 搜索与筛选交互逻辑 ================== */
function setupFilterAndSearchEvents() {
  // 1. 标签筛选点击
  const filtersContainer = document.getElementById('exhibitionFilters');
  if (filtersContainer) {
    const tags = filtersContainer.getElementsByClassName('filter-tag');
    Array.from(tags).forEach(tag => {
      tag.addEventListener('click', function () {
        Array.from(tags).forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentFilterType = TAG_TYPE_MAP[this.getAttribute('data-type')] || '';
        renderExhibitionPage(1); // 筛选后回到第一页
      });
    });
  }

  // 2. 搜索框防抖处理
  const searchInput = document.getElementById('exhibitionSearch');
  let searchTimeout;
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentKeyword = e.target.value.trim();
        renderExhibitionPage(1); // 输入后触发搜索
      }, 500); // 停顿 0.5 秒后自动搜索
    });
  }
}

/* ================== 6. 删除与上传功能对接 ================== */
// 删除作品
async function deleteWork(workId, event) {
  event.stopPropagation();
  if (!confirm('确定要永久删除这幅作品吗？')) return;

  const res = await apiDeleteWork(workId);
  if (res && res.code === 'OK') {
    alert('删除成功！');
    initMyWorksWidget();
    renderExhibitionPage(currentPage);
  } else {
    alert('删除失败，请稍后重试');
  }
}

// 标签选择
function selectCategory(btn, source) {
  const siblings = btn.parentElement.children;
  for (let i = 0; i < siblings.length; i++) siblings[i].classList.remove('active');
  btn.classList.add('active');
  const val = btn.getAttribute('data-val');
  if (source === 'local') globalLocalCategory = val;
  else globalPhotoCategory = val;
}

// 本地上传逻辑
function handleLocalUpload(input) {
  const file = input.files[0];
  if (!file) return;
  globalLocalFile = file;
  document.getElementById('localFileNameDisplay').innerText = `已选择: ${file.name}`;
  document.getElementById('localFileNameDisplay').style.color = '#c5a059';
  const nameInput = document.getElementById('localArtworkName');
  if (!nameInput.value) nameInput.value = file.name.replace(/\.\w+$/, '');
}

function handlePhotoAlbumSelect(input) {
  const file = input.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('请选择图片格式的文件！');
    input.value = '';
    return;
  }

  globalPhotoAlbumFile = file;

  const fileNameDisplay = document.getElementById('photoAlbumFileNameDisplay');
  if (fileNameDisplay) {
    fileNameDisplay.innerText = `已选择: ${file.name}`;
    fileNameDisplay.style.color = '#c5a059';
  }

  const titleInput = document.getElementById('photoAlbumArtworkName');
  if (titleInput && !titleInput.value) {
    titleInput.value = file.name.replace(/\.\w+$/, '');
  }
}

async function confirmLocalUpload() {
  if (!globalLocalFile) return alert('请先选择图片！');
  const title = document.getElementById('localArtworkName').value.trim() || '未命名作品';
  const btn = document.getElementById('confirmLocalBtn');
  btn.innerText = '上传中...'; btn.disabled = true;

  const res = await apiUploadWork(globalLocalFile, title, globalLocalCategory, 'local');
  if (res && res.code === 'OK') {
    alert('作品上传成功！');
    closeCustomModal('uploadTextureModal');
    initMyWorksWidget(); // 刷新我的作品
    // 提示：一般上传后，需要后端把作品变成帖子才能在展览显示，这里前端只负责发给后端
  } else {
    alert('上传失败，请稍后重试。');
  }
  btn.innerText = '确定'; btn.disabled = false;
}

async function confirmPhotoAlbumUpload() {
  if (!globalPhotoAlbumFile) {
    alert('请先点击虚线框选择相册图片！');
    return;
  }

  const titleInput = document.getElementById('photoAlbumArtworkName');
  const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : '未命名作品';
  const btn = document.getElementById('confirmPhotoAlbumBtn');

  btn.innerText = '上传中...';
  btn.disabled = true;

  const res = await apiUploadWork(globalPhotoAlbumFile, title, globalPhotoCategory, 'photo');

  if (res && res.code === 'OK') {
    alert('上传成功！已同步到代码库');
    closeCustomModal('photoAlbumModal');

    // 刷新三个区域
    initMyWorksWidget();
    renderExhibitionPage(1);
    initCodeLibraryWidget();

    // 重置状态
    globalPhotoAlbumFile = null;

    const input = document.getElementById('photoAlbumInput');
    if (input) input.value = '';

    const fileNameDisplay = document.getElementById('photoAlbumFileNameDisplay');
    if (fileNameDisplay) {
      fileNameDisplay.innerText = '点击选择相册图片';
      fileNameDisplay.style.color = '#ddd';
    }

    if (titleInput) {
      titleInput.value = '';
    }
  } else {
    alert('上传失败：' + (res?.message || '请稍后重试'));
  }

  btn.innerText = '确定';
  btn.disabled = false;
}
/* ================== 7. 相机拍照功能 ================== */
function triggerRealCamera() {
  closeCustomModal('photoUploadModal');
  const modal = document.getElementById('cameraModal');
  const video = document.getElementById('cameraVideo');
  resetCameraUI();
  modal.style.display = 'flex';

  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      cameraStream = stream;
      video.srcObject = stream;
      video.play();
    }).catch(err => {
      alert('无法访问摄像头！' + err.message);
      closeCamera();
    });
}

function takePhotoPreview() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  const preview = document.getElementById('photoPreview');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
  preview.src = canvas.toDataURL('image/jpeg', 0.9);
  video.style.display = 'none'; preview.style.display = 'block';
  document.getElementById('cameraControls').style.display = 'none';
  document.getElementById('previewControls').style.display = 'flex';
}

function uploadCapturedPhoto() {
  const canvas = document.getElementById('cameraCanvas');
  const btn = document.getElementById('confirmUploadBtn');
  btn.innerText = '⏳ 上传中...'; btn.disabled = true;

  // 获取刚才添加的自定义命名框的值
  const titleInput = document.getElementById('photoArtworkName');
  const title = (titleInput && titleInput.value.trim()) ? titleInput.value.trim() : ('生活肌理_' + Math.floor(Math.random() * 1000));

  canvas.toBlob(async (blob) => {
    const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
    const res = await apiUploadWork(file, title, globalPhotoCategory, 'photo');

    if (res && res.code === 'OK') {
      alert('拍照上传成功！');
      closeCamera();
      initMyWorksWidget();
    } else {
      alert('上传失败。');
      btn.innerText = '✅ 确认上传'; btn.disabled = false;
    }
  }, 'image/jpeg', 0.9);
}

function resetCameraUI() {
  document.getElementById('cameraVideo').style.display = 'block';
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('cameraControls').style.display = 'flex';
  document.getElementById('previewControls').style.display = 'none';
  document.getElementById('confirmUploadBtn').disabled = false;
}

function closeCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
  document.getElementById('cameraModal').style.display = 'none';
}

/* ================== 8. 弹窗与分页器控制 ================== */
function openCustomModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'flex';
}
function closeCustomModal(modalId) {
  const m = document.getElementById(modalId);
  if (m) m.style.display = 'none';
}

function renderPaginationUI(totalItems) {
  const container = document.getElementById('exhibitionPagination');
  if (!container) return;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  let html = '';

  if (totalPages <= 0) { container.innerHTML = ''; return; }

  if (currentPage > 1) html += `<button class="page-nav-text" onclick="renderExhibitionPage(${currentPage - 1})">← Prev</button>`;
  for (let i = 1; i <= totalPages; i++) {
    html += `<div class="page-num-btn ${i === currentPage ? 'active' : ''}" onclick="renderExhibitionPage(${i})">${i}</div>`;
  }
  if (currentPage < totalPages) html += `<button class="page-nav-text" onclick="renderExhibitionPage(${currentPage + 1})">Next →</button>`;

  container.innerHTML = html;
}

// 在 social.js 中添加这个函数，并在 DOMContentLoaded 里调用它
async function loadFooterStats() {
  try {
    // ⚠️ 这里需要后端提供一个真实的统计接口
    const response = await fetch(`${API_BASE_URL}/api/community/stats`);
    const res = await response.json();

    if (res.code === 'OK' && res.data) {
      document.getElementById('stat-works').innerText = res.data.total_works || 0;
      document.getElementById('stat-likes').innerText = res.data.total_likes || 0;
      document.getElementById('stat-users').innerText = res.data.total_users || 0;
    }
  } catch (error) {
    console.log("统计数据加载失败或后端尚未提供该接口");
  }
}


