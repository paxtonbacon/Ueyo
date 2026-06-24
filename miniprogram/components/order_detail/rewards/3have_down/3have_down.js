// components/order_detail/rewards/3have_down/3have_down.js
Component({
  properties: { list: { type: Array, value: [] } },
  lifetimes: {
    attached() {
      if (!this.properties.list || this.properties.list.length === 0) {
        this.setData({ list: this.getMockData() });
      }
    }
  },
  methods: {
    getMockData() {
      return [
        { id: '701', title: '收一台显示器', amount: 800, orderNo: 'ORD20240607001', finalStatus: '已完成', image: '/images/default-goods.png' },
        { id: '702', title: '找合租室友', amount: 0, orderNo: 'ORD20240607002', finalStatus: '已取消', image: '/images/default-goods.png' }
      ];
    }
  }
});

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