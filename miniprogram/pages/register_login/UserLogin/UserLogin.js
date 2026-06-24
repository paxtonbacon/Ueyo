// pages/register_login/UserLogin/UserLogin.js
const app = getApp()

Page({
  data: {
    email: '',
    password: '',
    emailError: '',
    passwordError: '',
    isLoading: false
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, emailError: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, passwordError: '' })
  },

  validateEmail(email) {
    const emailReg = /^[a-zA-Z0-9._-]+@(cau\.edu\.cn|cau\.cn)$/
    return emailReg.test(email)
  },

  validateForm() {
    let isValid = true
    const { email, password } = this.data
    
    if (!email) {
      this.setData({ emailError: '请输入农大邮箱' })
      isValid = false
    } else if (!this.validateEmail(email)) {
      this.setData({ emailError: '请输入正确的农大邮箱（@cau.edu.cn 或 @cau.cn）' })
      isValid = false
    } else {
      this.setData({ emailError: '' })
    }
    
    if (!password) {
      this.setData({ passwordError: '请输入密码' })
      isValid = false
    } else {
      this.setData({ passwordError: '' })
    }
    
    return isValid
  },

  // ========== 邮箱登录 ==========
  async callLoginApi(email, password) {
    const res = await wx.cloud.callFunction({
      name: 'backend',
      data: {
        action: 'user/emailLogin',
        data: { email, password }
      }
    });

    const result = res.result;
    if (result.code === 0 && result.data && result.data.token) {
      app.saveAuth(result.data.token, {
        userId: result.data.userId,
        email: result.data.email,
        authLevel: result.data.authLevel,
        nickName: result.data.nickName || '',
        avatarUrl: result.data.avatarUrl || ''
      });
      return { success: true, message: '登录成功', data: result.data };
    } else {
      throw new Error(result.msg || '登录失败');
    }
  },

  async handleLogin() {
    if (this.data.isLoading) return
    if (!this.validateForm()) return
    
    this.setData({ isLoading: true })
    
    try {
      const result = await this.callLoginApi(this.data.email, this.data.password)
      
      if (result.success) {
        wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 })
        setTimeout(() => {
          wx.switchTab({ url: '/pages/self/Myself/Myself' })
          this.setData({ isLoading: false })
        }, 700)
      }
    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({ title: error.message || '登录失败，请重试', icon: 'none', duration: 2000 })
      this.setData({ isLoading: false })
    }
  }
})