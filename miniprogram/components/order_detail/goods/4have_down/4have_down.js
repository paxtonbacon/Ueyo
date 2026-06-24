// components/order_detail/goods/4have_down/4have_down.js
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
        { id: '401', title: '休闲裤', amount: 99, orderNo: 'ORD20240604001', finalStatus: '已完成', image: '/images/default-goods.png' },
        { id: '402', title: '太阳镜', amount: 199, orderNo: 'ORD20240604002', finalStatus: '已退款', image: '/images/default-goods.png' }
      ];
    }
  }
});
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