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

  // 微信快捷登录（核心）
  handleWechatLogin() {
    wx.showToast({
      title: "快捷登陆成功",
      icon: 'success',
      duration: 700
    })
    // // 1. 调用 wx.login 获取 code
    // wx.login({
    //   success: (res) => {
    //     if (res.code) {
    //       console.log('获取到code:', res.code)
          
    //       // 2. 将 code 发送到后端（云函数或自己服务器）
    //       // 这里以云函数为例，你可以换成自己的 HTTP 接口
    //       wx.cloud.callFunction({
    //         name: 'wechatLogin',
    //         data: {
    //           code: res.code
    //         },
    //         success: cloudRes => {
    //           console.log('云函数返回:', cloudRes.result)
              
    //           // 3. 根据返回结果处理登录态
    //           if (cloudRes.result && cloudRes.result.openid) {
    //             // 假设后端已经完成了绑定/注册逻辑，返回了自定义登录态
    //             wx.setStorageSync('userToken', cloudRes.result.token)
    //             wx.setStorageSync('openid', cloudRes.result.openid)
                
    //             wx.showToast({
    //               title: '登录成功',
    //               icon: 'success',
    //               success: () => {
    //                 // 跳转到首页或用户中心
    //                 wx.switchTab({
    //                   url: '/pages/home/home'
    //                 })
    //               }
    //             })
    //           } else {
    //             wx.showModal({
    //               title: '提示',
    //               content: cloudRes.result.message || '微信登录失败，请稍后重试',
    //               showCancel: false
    //             })
    //           }
    //         },
    //         fail: err => {
    //           console.error('云函数调用失败', err)
    //           wx.showToast({
    //             title: '网络错误',
    //             icon: 'error'
    //           })
    //         }
    //       })
    //     } else {
    //       console.error('wx.login 失败', res.errMsg)
    //       wx.showToast({
    //         title: '微信登录失败',
    //         icon: 'error'
    //       })
    //     }
    //   },
    //   fail: err => {
    //     console.error('wx.login 调用失败', err)
    //   }
    // })
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