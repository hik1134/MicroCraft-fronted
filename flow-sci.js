document.addEventListener('DOMContentLoaded', () => {
  // 简单的入场动画效果
  const animateElements = [
    '.page-title',
    '.page-subtitle',
    '.content-card'
  ];

  animateElements.forEach((selector, index) => {
    const el = document.querySelector(selector);
    if (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `all 0.8s ease-out ${index * 0.2}s`;

      // 触发重绘以启动过渡
      setTimeout(() => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      }, 50);
    }
  });

  // 为导航栏添加简单的点击反馈（如果需要JS处理跳转）
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // 移除其他激活状态
      navItems.forEach(nav => nav.classList.remove('active'));
      // 激活当前（如果是单页应用逻辑，这里只是视觉演示）
      if (!item.getAttribute('href')) {
        item.classList.add('active');
      }
    });
  });
});