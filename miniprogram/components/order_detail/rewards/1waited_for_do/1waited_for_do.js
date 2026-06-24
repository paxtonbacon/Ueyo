// components/order_detail/rewards/1waited_for_do/1waited_for_do.js
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
        { id: '501', title: '求购二手自行车', amount: 150, orderNo: 'ORD20240605001', image: '/images/default-goods.png' }
      ];
    },
    onCancel(e) { this.triggerEvent('cancel', { id: e.currentTarget.dataset.id }); }
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