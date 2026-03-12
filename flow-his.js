document.addEventListener('DOMContentLoaded', () => {

  // 获取所有时间轴项目
  const items = document.querySelectorAll('.timeline-item');

  // 使用 Intersection Observer 实现滚动触发动画
  // 或者因为内容不多，直接做开场动画

  const observerOptions = {
    threshold: 0.1, // 元素出现10%时触发
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        // 添加延迟，制造阶梯效果
        setTimeout(() => {
          entry.target.style.transition = 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 150); // 每个元素间隔150ms

        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  items.forEach(item => {
    observer.observe(item);
  });

  // 标题入场动画
  const header = document.querySelector('.hero-section');
  header.style.opacity = '0';
  header.style.transform = 'translateY(-20px)';
  header.style.transition = 'all 0.8s ease-out';

  setTimeout(() => {
    header.style.opacity = '1';
    header.style.transform = 'translateY(0)';
  }, 100);
});