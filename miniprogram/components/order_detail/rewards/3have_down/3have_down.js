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