document.addEventListener('DOMContentLoaded', () => {

  // 返回按钮逻辑
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }

  // 简单的级联入场动画
  const sections = document.querySelectorAll('.section-block');
  sections.forEach((section, index) => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = `all 0.6s ease ${index * 0.2}s`; // 延迟

    // 强制重绘后触发动画
    setTimeout(() => {
      section.style.opacity = '1';
      section.style.transform = 'translateY(0)';
    }, 100);
  });
});