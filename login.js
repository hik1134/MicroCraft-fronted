// 1. 返回首页功能
function goHome() {
  window.location.href = "index.html"; // 或者你的主页URL
}

// 2. 密码显示/隐藏切换
const togglePassword = document.querySelector('#togglePassword');
const passwordInput = document.querySelector('#password');

togglePassword.addEventListener('click', function () {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  // 这里根据状态切换眼睛图标的 src 路径
  this.src = type === 'text'
    ? './登录以及首页素材/登录以及首页素材/登录/眼睛_显示_o.png'
    : './登录以及首页素材/登录以及首页素材/登录/眼睛_隐藏_o.png'; // 👈 请确保有这张闭眼的图
});

// 获取输入框元素
const emailInput = document.querySelector('#username'); // HTML里邮箱的id叫username
const verifyCodeInput = document.querySelector('#verifyCode'); // 验证码输入框
const sendCodeBtn = document.querySelector('#sendCodeBtn'); // 获取验证码按钮

// 3. 发送验证码逻辑 (对接你的 Apifox 接口)
sendCodeBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();

  // 简单的邮箱格式验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    alert("请先输入邮箱地址");
    return;
  }
  if (!emailRegex.test(email)) {
    alert("请输入有效的邮箱地址");
    return;
  }

  // 开始 60 秒倒计时
  let countdown = 60;
  sendCodeBtn.disabled = true;
  sendCodeBtn.textContent = `${countdown}s 后重发`;

  const timer = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      sendCodeBtn.textContent = `${countdown}s 后重发`;
    } else {
      clearInterval(timer);
      sendCodeBtn.disabled = false;
      sendCodeBtn.textContent = "获取验证码";
    }
  }, 1000);

  // 与后端通讯 - 请求发送验证码
  try {
    // ⚠️ 【重要修改】：请把 127.0.0.1:8080 换成你们后端真实的 IP 和端口
    const apiUrl = 'http://118.89.82.148:8080/auth/email/code';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email // 对应你 Apifox 里的 "email": "test@qq.com"
      })
    });

    const result = await response.json();

    // 判断成功条件（这里假设后端成功返回 code: 200，具体看你们的接口文档）
    if (response.ok && result.code === "OK") {
      alert("验证码已发送，请注意查收邮件！");
    } else {
      alert("发送失败: " + (result.msg || result.message || "未知错误"));
      // 失败则恢复按钮
      clearInterval(timer);
      sendCodeBtn.disabled = false;
      sendCodeBtn.textContent = "获取验证码";
    }
  } catch (error) {
    console.error("验证码请求失败:", error);
    alert("网络请求失败，请检查后端是否开启或跨域配置！");
    clearInterval(timer);
    sendCodeBtn.disabled = false;
    sendCodeBtn.textContent = "获取验证码";
  }
});

// 4. 注册接口对接逻辑

const registerBtn = document.querySelector('#loginBtn'); // 假设你HTML里按钮的id还是loginBtn

registerBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const code = verifyCodeInput.value.trim();
  const password = passwordInput.value;

  // 表单验证：确保三项都填了
  if (!email || !code || !password) {
    alert("请完整填写邮箱、验证码和密码！");
    return;
  }

  registerBtn.textContent = "注册中...";
  registerBtn.disabled = true;

  try {
    // ⚠️ 【重要修改 1】：请去 Apifox 点开左侧的“POST 用户注册”
    // 看看它的接口路径是什么？如果是 /auth/register，就改成下面的样子
    const registerApiUrl = 'http://118.89.82.148:8080/auth/register'; // 👈 替换为真实的注册接口路径

    const response = await fetch(registerApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // ⚠️ 【重要修改 2】：去 Apifox 看看注册接口的 Body 需要传什么参数名？
      // 下面是常见的参数名，如果你们后端的命名不一样（比如密码叫 pwd），请修改左边的名字
      body: JSON.stringify({
        email: email,      // 邮箱
        code: code,        // 验证码
        password: password // 密码
      })
    });

    const result = await response.json();

    // 判断注册是否成功 (假设后端成功返回 code: 200)
    if (response.ok && result.code === "OK") {
      alert("✨ 注册成功！请前往登录~");

      // 注册成功后，自动跳转回登录页
      window.location.href = "login.html"; // 👈 替换成你真实的登录页面HTML名字
    } else {
      // 注册失败（比如验证码错误、邮箱已被注册过等）
      alert("注册失败: " + (result.msg || result.message || "未知错误"));
    }
  } catch (error) {
    console.error("注册请求失败:", error);
    alert("网络请求失败，请检查后端是否开启！");
  } finally {
    // 恢复按钮状态
    registerBtn.textContent = "✨ 注册"; // 按钮文字可以改成注册
    registerBtn.disabled = false;
  }
});
// 5. 游客访问逻辑
document.querySelector('#guestBtn').addEventListener('click', () => {
  const confirmGuest = confirm("游客身份可能无法保存游戏数据，确定要进入吗？");
  if (confirmGuest) {
    console.log("正在以游客身份进入...");
    window.location.href = "index.html"; // 👈 替换成你们真实的主页html名字
  }
});