document.addEventListener('DOMContentLoaded', () => {

  // 1. 返回按钮逻辑
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // 如果您的主页有变，可以修改这里
      window.location.href = 'index.html'; 
    });
  }

  // 2. 时间轴入场动画
  const items = document.querySelectorAll('.t-item');

  // 简单的交错动画：每隔 150ms 显示下一个
  items.forEach((item, index) => {
    setTimeout(() => {
      item.style.transition = 'all 0.6s ease-out';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, index * 150 + 200); // 基础延迟 200ms
  });

});