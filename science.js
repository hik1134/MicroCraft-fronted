document.addEventListener('DOMContentLoaded', function () {
  // 简单的入场动画效果
  const card = document.querySelector('.science-card');

  // 给予一点延迟，让页面先渲染
  setTimeout(() => {
    card.style.transition = 'opacity 0.8s ease-out, transform 0.8s ease-out';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  }, 100);

  // 给时间轴的小圆点添加呼吸效果（可选）
  const dots = document.querySelectorAll('.timeline-dot');
  dots.forEach((dot, index) => {
    // 交错动画
    dot.style.transition = 'transform 0.3s ease';
    setTimeout(() => {
      setInterval(() => {
        dot.style.boxShadow = '0 0 12px rgba(0, 179, 134, 0.8)';
        setTimeout(() => {
          dot.style.boxShadow = '0 0 6px rgba(0, 179, 134, 0.4)';
        }, 1000);
      }, 2000 + (index * 500));
    }, index * 300);
  });
});