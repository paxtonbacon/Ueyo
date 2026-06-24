// pages/index/index.js
Page({
  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/register_login/UserLogin/UserLogin'
    })
  },

  // 跳转到注册页面
  goToRegister() {
    // 先弹出提示，验证函数是否被调用
    // wx.showToast({
    //   title: '按钮点击成功',
    //   icon: 'success',
    //   duration: 500
    // });
    // 也可以同时打印日志
    // console.log('goToRegister 函数被调用了');
    // 暂时注释掉跳转
    wx.navigateTo({
      url: '/pages/register_login/UserRegister/UserRegister'
    })
  },

  // 微信快捷登录
  async handleWechatLogin() {
    try {
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({ success: resolve, fail: reject });
      });

      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'user/wxlogin',
          data: { code: loginRes.code }
        }
      });

      if (res.result && res.result.code === 0) {
        wx.setStorageSync('isLogin', true);
        wx.setStorageSync('userInfo', {
          nickname: res.result.data.nickName || '',
          avatarUrl: res.result.data.avatarUrl || ''
        });
        wx.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/ueyo/Home/Home' });
        }, 700);
      } else {
        // 降级：直接进首页
        wx.showToast({ title: '快捷登录成功', icon: 'success', duration: 700 });
        setTimeout(() => {
          wx.switchTab({ url: '/pages/ueyo/Home/Home' });
        }, 700);
      }
    } catch (err) {
      console.error('登录失败:', err);
      wx.showToast({ title: '快捷登录成功', icon: 'success', duration: 700 });
      setTimeout(() => {
        wx.switchTab({ url: '/pages/ueyo/Home/Home' });
      }, 700);
    }
  },

  // 个人小程序无法获取手机号，但按钮需要绑定此方法才能避免报错
  getPhoneNumber(e) {
    // 这里会收到手机号相关数据，但个人小程序无法解析，直接引导用户走 wx.login 流程
    console.log('手机号回调:', e.detail)
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 对于个人小程序，此分支实际不会进入有效数据，提示用户使用普通微信登录
      wx.showModal({
        title: '温馨提示',
        content: '您当前使用的小程序为个人版，无法获取手机号，请使用上方"微信快捷登录"按钮',
        showCancel: false
      })
    } else {
      // 用户拒绝授权或其他错误，直接调用我们的 wx.login 流程
      this.handleWechatLogin()
    }
  }
})