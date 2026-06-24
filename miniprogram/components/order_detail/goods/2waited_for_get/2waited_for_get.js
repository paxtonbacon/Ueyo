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
