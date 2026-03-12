// 1. 返回上一页/首页功能
function goHome() {
  // 这里填你点击“返回”后想跳转的页面，比如首页 index.html
  window.location.href = "index.html";
}

// 等待网页内容全部加载完毕后再绑定事件
document.addEventListener('DOMContentLoaded', () => {

  // 获取页面上的元素
  const emailInput = document.querySelector('#username'); // 你的输入框id叫username，但实际是输入邮箱
  const passwordInput = document.querySelector('#password');
  const togglePasswordBtn = document.querySelector('#togglePassword');
  const loginBtn = document.querySelector('#loginBtn');
  const guestBtn = document.querySelector('#guestBtn');

  // 2. 密码显示 / 隐藏切换功能
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', function () {
      // 切换输入框类型：password变text，text变password
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);

      // 切换眼睛图标 (⚠️注意：请确保你本地有 "眼睛_隐藏_o.png" 这个图片，如果没有请更换路径)
      this.src = type === 'text'
        ? './登录以及首页素材/登录以及首页素材/登录/眼睛_显示_o.png'
        : './登录以及首页素材/登录以及首页素材/登录/眼睛_隐藏_o.png'; // 👈 替换为闭眼的图片路径
    });
  }

  // 3. 点击【登录】按钮功能（对接后端）
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();

      if (!email) { alert("请输入邮箱！"); return; }
      if (!password) { alert("请输入密码！"); return; }

      loginBtn.textContent = "登录中...";
      loginBtn.disabled = true;

      try {
        const apiUrl = 'http://118.89.82.148:8080/auth/login';

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });

        const result = await response.json();

        if (response.ok) {
          alert("✨ 登录成功！");

          // 【对接后端】：直接从返回的 data 中提取 user_id 和 nickname
          if (result.data) {
            // 如果有 token 也存起来（按你原本的逻辑）
            if (result.data.token) {
              localStorage.setItem('userToken', result.data.token);
            }

            // 存入用户类型、ID 和 昵称
            localStorage.setItem('userType', 'user');
            localStorage.setItem('userId', result.data.user_id);
            localStorage.setItem('userName', result.data.nickname); // 直接使用后端返回的昵称
          }

          // 跳转到首页
          window.location.href = "index.html";
        } else {
          alert("登录失败: " + (result.message || "账号或密码错误"));
        }
      } catch (error) {
        console.error("登录请求失败:", error);
        alert("网络连接异常，请检查后端是否启动！");
      } finally {
        loginBtn.textContent = "✨ 登录";
        loginBtn.disabled = false;
      }
    });
  }

  // 4. 点击【游客访问】按钮功能
  if (guestBtn) {
    guestBtn.addEventListener('click', () => {
      const confirmGuest = confirm("游客身份仅可浏览，无法上传和管理作品，确定进入吗？");
      if (confirmGuest) {
        // 【修改点2】：清除可能残留的旧Token，明确打上 guest 标签
        localStorage.removeItem('userToken');
        localStorage.setItem('userType', 'guest');

        // 跳转到社区页 (或你的首页)
        window.location.href = "index.html";
      }
    });
  }
})