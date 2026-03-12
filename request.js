
async function request(url, options = {}) {
  // 1. 设置默认请求头
  options.headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // 2. 自动携带鉴权信息（Token + 用户类型）
  const userToken = localStorage.getItem('userToken');
  const userType = localStorage.getItem('userType') || 'guest';
  if (userToken) {
    options.headers['Authorization'] = `Bearer ${userToken}`;
  }
  options.headers['userType'] = userType;

  try {
    // 3. 发送请求
    const response = await fetch(url, options);
    const result = await response.json();

    // 4. 统一处理权限异常
    if (result.code === 401) {
      alert(result.msg || "请先登录！");
      window.location.href = "login-denglu.html"; // 跳回登录页
      throw new Error("未登录，已跳转");
    }
    if (result.code === 403) {
      alert(result.msg || "游客无此权限！");
      throw new Error("权限不足");
    }
    return result; // 成功则返回接口数据
  } catch (error) {
    console.error("请求失败：", error);
    alert("网络异常，请重试！");
    throw error; // 抛出错误，方便页面层处理
  }
}

// 关键：把request函数暴露出去，让其他页面能调用
window.request = request;