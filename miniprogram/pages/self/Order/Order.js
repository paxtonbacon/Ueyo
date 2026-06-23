// pages/self/Order/Order.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    outerTabs: [
      { name: '商品订单' },
      { name: '悬赏订单' }
    ],
    goodsTabs: [
      { name: '待付款' },
      { name: '已支付' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    rewardsTabs: [
      { name: '待履约' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    currentOuter: 0,   // 外层当前索引
    currentInner: 0,   // 每个外层对应的内层索引（建议用数组）
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

  }
})