// components/order_detail/goods/2waited_for_get/2waited_for_get.js
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
        { id: '201', title: '简约双肩包', amount: 88, orderNo: 'ORD20240602001', image: '/images/default-goods.png' }
      ];
    },
    onRefund(e) { this.triggerEvent('refund', { id: e.currentTarget.dataset.id }); },
    onConfirm(e) { this.triggerEvent('confirm', { id: e.currentTarget.dataset.id }); }
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