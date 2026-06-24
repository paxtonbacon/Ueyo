// components/order_detail/rewards/2waited_for_dis/2waited_for_dis.js
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
        { id: '601', title: '求租校园卡', amount: 100, orderNo: 'ORD20240606001', image: '/images/default-goods.png' },
        { id: '602', title: '代取快递', amount: 10, orderNo: 'ORD20240606002', image: '/images/default-goods.png' }
      ];
    },
    onEvaluate(e) { this.triggerEvent('evaluate', { id: e.currentTarget.dataset.id }); }
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