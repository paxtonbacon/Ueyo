// pages/register/register.js
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

  // 监听邮箱输入
  onEmailInput(e) {
    this.setData({
      email: e.detail.value,
      emailError: ''
    })
  },

  // 监听密码输入
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value,
      passwordError: ''
    })
  },

  // 监听确认密码输入
  onConfirmPasswordInput(e) {
    this.setData({
      confirmPassword: e.detail.value,
      confirmPasswordError: ''
    })
  },

  // 验证邮箱格式
  validateEmail(email) {
    const emailReg = /^[a-zA-Z0-9._-]+@(cau\.edu\.cn|cau\.cn)$/
    return emailReg.test(email)
  },

  // 验证密码强度
  validatePassword(password) {
    return password && password.length >= 6
  },

  // 验证表单
  validateForm() {
    let isValid = true
    const { email, password, confirmPassword } = this.data
    
    // 验证邮箱
    if (!email) {
      this.setData({ emailError: '请输入农大邮箱' })
      isValid = false
    } else if (!this.validateEmail(email)) {
      this.setData({ emailError: '请输入正确的农大邮箱（@cau.edu.cn 或 @cau.cn）' })
      isValid = false
    } else {
      this.setData({ emailError: '' })
    }
    
    // 验证密码
    if (!password) {
      this.setData({ passwordError: '请输入密码' })
      isValid = false
    } else if (!this.validatePassword(password)) {
      this.setData({ passwordError: '密码长度不能少于6位' })
      isValid = false
    } else {
      this.setData({ passwordError: '' })
    }
    
    // 验证确认密码
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

  // 注册（暂用微信登录云函数，后续扩展邮箱注册）
  async callRegisterApi(email, password) {
    const loginRes = await new Promise((resolve, reject) => {
      wx.login({ success: resolve, fail: reject });
    });

    const res = await wx.cloud.callFunction({
      name: 'backend',
      data: {
        action: 'user/wxlogin',
        data: { code: loginRes.code, email, password }
      }
    });

    const result = res.result;
    if (result.code === 0) {
      wx.setStorageSync('isLogin', true);
      return { success: true, message: '注册成功', data: result.data };
    } else {
      throw new Error(result.msg || '注册失败');
    }
  },

  // 处理注册
  async handleRegister() {
    console.log('点击注册按钮')
    
    if (this.data.isLoading) {
      console.log('正在注册中，请勿重复点击')
      return
    }
    
    if (!this.validateForm()) {
      console.log('表单验证失败')
      return
    }
    
    this.setData({ isLoading: true })
    
    const { email, password } = this.data
    
    try {
      const result = await this.callRegisterApi(email, password)
      console.log('注册结果:', result)
      
      if (result.success) {
        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 1500
        })
        
        setTimeout(() => {
          wx.navigateTo({
            url: `/pages/get_code/get_code?email=${encodeURIComponent(email)}`
          })
          this.setData({ isLoading: false })
        }, 1500)
      }
    } catch (error) {
      console.error('注册失败:', error)
      wx.showToast({
        title: error.message || '注册失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({ isLoading: false })
    }
  }
})