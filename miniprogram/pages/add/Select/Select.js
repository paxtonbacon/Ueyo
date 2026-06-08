// pages/add/Select/Select.js
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },
  // 点击商品卡片
  onGoodsTap() {
    wx.navigateTo({
      url: '/pages/goods/goods',  // 请替换为实际商品页面路径
      fail: () => {
        wx.showToast({ title: '商品页面开发中', icon: 'none' });
      }
    });
  },

  // 点击悬赏卡片
  onRewardTap() {
    wx.navigateTo({
      url: '/pages/reward/reward', // 请替换为实际悬赏页面路径
      fail: () => {
        wx.showToast({ title: '悬赏页面开发中', icon: 'none' });
      }
    });
  },

  // 点击话题大卡片
  onTopicTap() {
    wx.navigateTo({
      url: '/pages/topic/topic',   // 请替换为实际话题页面路径
      fail: () => {
        wx.showToast({ title: '话题页面开发中', icon: 'none' });
      }
    });
  }
})