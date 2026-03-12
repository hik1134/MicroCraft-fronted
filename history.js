document.addEventListener('DOMContentLoaded', function () {

  // 获取所有的列表项
  const items = document.querySelectorAll('.timeline-item');

  // 简单的入场动画：依次滑入
  items.forEach((item, index) => {
    setTimeout(() => {
      item.style.transition = 'all 0.6s ease-out';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, index * 150); // 每一项延迟 150ms
  });

});