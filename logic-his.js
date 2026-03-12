document.addEventListener('DOMContentLoaded', () => {

  // 返回按钮逻辑
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html'; // 假设首页是 index.html
    });
  }

  // === 时间轴滚动动画逻辑 ===
  const timelineItems = document.querySelectorAll('.timeline-item');

  // 创建观察器
  const observerOptions = {
    root: null, // 视口作为根
    rootMargin: '0px',
    threshold: 0.1 // 当元素显示 10% 时触发
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 添加可见类，触发 CSS transition 动画
        entry.target.classList.add('visible');
        // 动画触发后停止观察该元素，节省性能
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 开始观察每个时间节点
  timelineItems.forEach(item => {
    observer.observe(item);
  });
});