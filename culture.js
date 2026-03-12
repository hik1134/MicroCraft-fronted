document.addEventListener('DOMContentLoaded', function () {

  // 1. 处理页面滚动动画
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // 当元素显示10%时触发
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // 动画只播放一次
      }
    });
  }, observerOptions);

  // 选取所有带有 fade-in 类的元素
  const animatedElements = document.querySelectorAll('.fade-in');
  animatedElements.forEach(el => observer.observe(el));


  // 2. 返回按钮功能
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // 如果有上一页历史记录，则返回，否则跳转到首页（假设首页是 index.html）
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    });
  }

  // 3. 简单的鼠标悬停特效增强（可选：给流程步骤添加微弱高亮）
  const steps = document.querySelectorAll('.step-item');
  steps.forEach(step => {
    step.addEventListener('mouseenter', () => {
      step.style.backgroundColor = '#222';
    });
    step.addEventListener('mouseleave', () => {
      step.style.backgroundColor = '#1a1a1a';
    });
  });
});