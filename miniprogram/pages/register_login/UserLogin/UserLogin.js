// pages/register/register.js
Page({
  data: {
    email: '',
    password: '',
    emailError: '',
    passwordError: '',
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

  // 验证邮箱格式
  validateEmail(email) {
    const emailReg = /^[a-zA-Z0-9._-]+@(cau\.edu\.cn|cau\.cn)$/
    return emailReg.test(email)
  },

  // 验证表单
  validateForm() {
    let isValid = true
    const { email, password } = this.data
    
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
    } else {
      this.setData({ passwordError: '' })
    }
    
    return isValid
  },

  // 模拟登陆接口（临时使用）
  async callLoginApi(email, password) {
    return new Promise((resolve, reject) => {
      console.log('=== 开始注册 ===')
      console.log('邮箱:', email)
      console.log('密码:', password)
      
      setTimeout(() => {
        // 模拟成功
        if (email && password) {
          resolve({
            success: true,
            message: '登陆成功',
            data: { email }
          })

        } else {
          reject(new Error('登陆失败，请重试'))
        }
      }, 1000)
    })
  },

  // 处理登陆
  async handleLogin() {
    console.log('点击登陆按钮')
    
    if (this.data.isLoading) {
      console.log('正在登陆中，请勿重复点击')
      return
    }
    
    if (!this.validateForm()) {
      console.log('表单验证失败')
      return
    }
    
    this.setData({ isLoading: true })
    
    const { email, password } = this.data
    
    try {
      const result = await this.callLoginApi(email, password)
      console.log('登陆结果:', result)
      
      if (result.success) {
        wx.showToast({
          title: '登陆成功',
          icon: 'success',
          duration: 1500
        })
        
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/ueyo/Home/Home'
          })
          this.setData({ isLoading: false })
        }, 700)
      }
    } catch (error) {
      console.error('登陆失败:', error)
      wx.showToast({
        title: error.message || '登陆失败，请重试',
        icon: 'none',
        duration: 2000
      })
      this.setData({ isLoading: false })
    }
  }
})