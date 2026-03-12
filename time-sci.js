document.addEventListener('DOMContentLoaded', () => {

  // 获取元素
  const backBtn = document.getElementById('backBtn');

  // 1. 返回按钮逻辑
  // 如果你有上一页的历史记录，可以返回上一页，或者直接跳转到首页
  backBtn.addEventListener('click', () => {
    // 方法A: 跳转到首页
    window.location.href = 'index.html';

    // 方法B: 浏览器后退 (根据需求选用)
    // history.back();
  });

  // 2. 简单的入场动画 (可选，增加高级感)
  const contentCard = document.querySelector('.content-card');
  contentCard.style.opacity = '0';
  contentCard.style.transform = 'translateY(20px)';
  contentCard.style.transition = 'all 0.6s ease-out';

  // 稍微延迟执行，让DOM渲染完再动画
  setTimeout(() => {
    contentCard.style.opacity = '1';
    contentCard.style.transform = 'translateY(0)';
  }, 100);

});