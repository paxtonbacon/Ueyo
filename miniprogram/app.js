// app.js
App({
  onLaunch: function () {
    // 初始化云开发环境
    wx.cloud.init({
      env: 'cloud1-d3gh09n2n6cba5219',   // 从云开发控制台获取（如：test-xxxx）
      traceUser: true       // 可选：追踪用户
    });
  }
});