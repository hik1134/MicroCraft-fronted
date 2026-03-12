document.addEventListener('DOMContentLoaded', () => {

  const backBtn = document.getElementById('backBtn');

  // 返回按钮逻辑
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      // 这里假设首页的文件名是 index.html
      window.location.href = 'index.html';
    });
  }

  // 可选：添加简单的入场动画，让表格内容淡入
  const content = document.querySelector('.content-container');
  content.style.opacity = '0';
  content.style.transform = 'translateY(20px)';
  content.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

  // 稍微延迟执行动画
  setTimeout(() => {
    content.style.opacity = '1';
    content.style.transform = 'translateY(0)';
  }, 100);

  // 如果需要更复杂的真值表高亮交互（例如鼠标悬停一行时高亮），可以在这里添加
  const gridCells = document.querySelectorAll('.truth-grid .grid-cell');

  gridCells.forEach((cell, index) => {
    cell.addEventListener('mouseenter', () => {
      // 简单的放大效果
      cell.style.transform = 'scale(1.05)';
      cell.style.transition = 'transform 0.2s';
    });
    cell.addEventListener('mouseleave', () => {
      cell.style.transform = 'scale(1)';
    });
  });
});