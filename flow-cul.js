document.addEventListener('DOMContentLoaded', () => {

  // --- 滚动入场动画 ---
  const observerOptions = {
    root: null, // 视口作为根
    rootMargin: '0px',
    threshold: 0.1 // 元素出现 10% 时触发
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 动画只触发一次
      }
    });
  }, observerOptions);

  // 选取所有需要动画的 section
  const animatedSections = document.querySelectorAll('.fade-in');
  animatedSections.forEach(section => {
    observer.observe(section);
  });

  // --- 简单的导航高亮逻辑 (如果需要动态判断) ---
  // 目前已经在 HTML 中硬编码了 class="active"
  // 如果是单页应用，这里需要写逻辑切换 active 类

  console.log("Scientific Principles Page Loaded.");
});