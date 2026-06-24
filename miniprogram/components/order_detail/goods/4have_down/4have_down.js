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