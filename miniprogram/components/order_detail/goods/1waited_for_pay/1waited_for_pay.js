// components/order_detail/goods/1waited_for_pay/1waited_for_pay.js
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
        { id: '101', title: '复古运动鞋', amount: 129, orderNo: 'ORD20240601001', image: '/images/default-goods.png' },
        { id: '102', title: '纯棉T恤', amount: 59, orderNo: 'ORD20240601002', image: '/images/default-goods.png' }
      ];
    },
    onCancel(e) { this.triggerEvent('cancel', { id: e.currentTarget.dataset.id }); },
    onPay(e) { this.triggerEvent('pay', { id: e.currentTarget.dataset.id }); }
  }
});