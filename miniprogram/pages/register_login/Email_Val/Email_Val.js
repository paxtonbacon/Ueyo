// pages/register_login/Email_Val/EmailVal.js
const app = getApp()

Page({
  data: {
    email: '',
    code: '',
    codeError: '',
    isLoading: false,
    countdown: 0      // 重新发送倒计时
  },

  onLoad() {
    // 从全局数据读取当前注册的邮箱
    const email = app.globalData.email || '';
    this.setData({ email });
    if (!email) {
      wx.showToast({ title: '请先注册邮箱', icon: 'none' });
    }
  },

  onCodeInput(e) {
    this.setData({ code: e.detail.value, codeError: '' });
  },

  // ========== 提交验证 ==========
  async handleVerify() {
    const code = this.data.code.trim();
    if (!code || code.length !== 6) {
      this.setData({ codeError: '请输入6位验证码' });
      return;
    }

    this.setData({ isLoading: true });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'user/verifyEmail',
          data: { code }
        }
      });

      const result = res.result;
      if (result.code === 0 && result.data && result.data.token) {
        // 更新 JWT（authLevel 升到 2）
        app.saveAuth(result.data.token, {
          userId: result.data.userId,
          email: result.data.email,
          authLevel: result.data.authLevel
        });

        wx.showToast({ title: '验证成功', icon: 'success', duration: 1500 });

        // 返回个人中心
        setTimeout(() => {
          wx.switchTab({ url: '/pages/self/Myself/Myself' });
          this.setData({ isLoading: false });
        }, 1500);
      } else {
        wx.showToast({ title: result.msg || '验证失败', icon: 'none' });
        this.setData({ isLoading: false });
      }
    } catch (err) {
      console.error('验证失败:', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      this.setData({ isLoading: false });
    }
  },

  // ========== 重新发送验证码 ==========
  onResendCode() {
    if (this.data.countdown > 0) return;
    wx.showToast({ title: '开发阶段请使用 000000', icon: 'none' });
    this.setData({ countdown: 60 });
    const timer = setInterval(() => {
      const cd = this.data.countdown - 1;
      if (cd <= 0) {
        clearInterval(timer);
        this.setData({ countdown: 0 });
      } else {
        this.setData({ countdown: cd });
      }
    }, 1000);
  }
})
