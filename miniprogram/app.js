// app.js
App({
  // ========== 运行时存储（内存，极速读取） ==========
  globalData: {
    token: '',       // JWT Token
    userId: '',      // 当前用户ID
    openId: '',      // 微信 openid（一级鉴权）
    email: '',       // 邮箱（二级鉴权）
    authLevel: 0,    // 鉴权级别 0=未注册 1=已注册 2=已验证
    nickName: '',
    avatarUrl: '',
    isLogin: false
  },

  onLaunch: function () {
    wx.cloud.init({
      env: 'cloud1-d3gh09n2n6cba5219',
      traceUser: true
    });

    // 从本地存储恢复登录态
    this.restoreAuth();
  },

  // ========== 恢复登录态 ==========
  restoreAuth() {
    try {
      const token = wx.getStorageSync('jwt_token') || '';
      const userInfo = wx.getStorageSync('user_info') || {};
      if (token) {
        this.globalData.token = token;
        this.globalData.userId = userInfo.userId || '';
        this.globalData.email = userInfo.email || '';
        this.globalData.authLevel = userInfo.authLevel || 0;
        this.globalData.nickName = userInfo.nickName || '';
        this.globalData.avatarUrl = userInfo.avatarUrl || '';
        this.globalData.isLogin = true;
        console.log('[Auth] 已恢复登录态, authLevel:', this.globalData.authLevel);
      }
    } catch (e) {
      console.warn('[Auth] 恢复登录态失败:', e);
    }
  },

  // ========== 保存登录态（持久化 + 运行时） ==========
  saveAuth(token, userInfo) {
    // 运行时存储（内存）
    this.globalData.token = token;
    this.globalData.userId = userInfo.userId || '';
    this.globalData.email = userInfo.email || '';
    this.globalData.authLevel = userInfo.authLevel || 0;
    this.globalData.nickName = userInfo.nickName || '';
    this.globalData.avatarUrl = userInfo.avatarUrl || '';
    this.globalData.isLogin = true;

    // 持久化存储（硬盘）
    wx.setStorageSync('jwt_token', token);
    wx.setStorageSync('user_info', {
      userId: userInfo.userId || '',
      email: userInfo.email || '',
      authLevel: userInfo.authLevel || 0,
      nickName: userInfo.nickName || '',
      avatarUrl: userInfo.avatarUrl || ''
    });
    wx.setStorageSync('isLogin', true);

    console.log('[Auth] 登录态已保存, authLevel:', userInfo.authLevel);
  },

  // ========== 清除登录态 ==========
  clearAuth() {
    this.globalData.token = '';
    this.globalData.userId = '';
    this.globalData.email = '';
    this.globalData.authLevel = 0;
    this.globalData.nickName = '';
    this.globalData.avatarUrl = '';
    this.globalData.isLogin = false;

    wx.removeStorageSync('jwt_token');
    wx.removeStorageSync('user_info');
    wx.setStorageSync('isLogin', false);
  }
});