// pages/register/register.js
const app = getApp()

Page({
  data: {
    email: '',
    password: '',
    confirmPassword: '',
    emailError: '',
    passwordError: '',
    confirmPasswordError: '',
    isLoading: false
  },

  onEmailInput(e) {
    this.setData({ email: e.detail.value, emailError: '' })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value, passwordError: '' })
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value, confirmPasswordError: '' })
  },

  validateEmail(email) {
    const emailReg = /^[a-zA-Z0-9._-]+@(cau\.edu\.cn|cau\.cn)$/
    return emailReg.test(email)
  },

  validatePassword(password) {
    return password && password.length >= 6
  },

  validateForm() {
    let isValid = true
    const { email, password, confirmPassword } = this.data
    
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
    } else if (!this.validatePassword(password)) {
      this.setData({ passwordError: '密码长度不能少于6位' })
      isValid = false
    } else {
      this.setData({ passwordError: '' })
    }
    
    if (!confirmPassword) {
      this.setData({ confirmPasswordError: '请再次输入密码' })
      isValid = false
    } else if (password !== confirmPassword) {
      this.setData({ confirmPasswordError: '两次输入的密码不一致' })
      isValid = false
    } else {
      this.setData({ confirmPasswordError: '' })
    }
    
    return isValid
  },

  // ========== 调用云函数注册 ==========
  async callRegisterApi(email, password) {
    const res = await wx.cloud.callFunction({
      name: 'backend',
      data: {
        action: 'user/emailRegister',
        data: { email, password }
      }
    });

    const result = res.result;
    if (result.code === 0 && result.data && result.data.token) {
      // 保存 JWT 到全局 + 本地
      app.saveAuth(result.data.token, {
        userId: result.data.userId,
        email: result.data.email,
        authLevel: result.data.authLevel
      });
      return { success: true, message: result.data.message, data: result.data };
    } else {
      throw new Error(result.msg || '注册失败');
    }
  },

  // ========== 处理注册 ==========
  async handleRegister() {
    if (this.data.isLoading) return
    
    if (!this.validateForm()) return
    
    this.setData({ isLoading: true })
    
    try {
      const result = await this.callRegisterApi(this.data.email, this.data.password)
      
      if (result.success) {
        wx.showToast({ title: '注册成功', icon: 'success', duration: 1500 })
        // 跳转到邮箱验证页
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/register_login/Email_Val/Email_Val' })
          this.setData({ isLoading: false })
        }, 1500)
      }
    } catch (error) {
      console.error('注册失败:', error)
      wx.showToast({ title: error.message || '注册失败，请重试', icon: 'none', duration: 2000 })
      this.setData({ isLoading: false })
    }
  }
})