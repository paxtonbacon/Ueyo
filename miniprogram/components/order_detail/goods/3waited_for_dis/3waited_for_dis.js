// components/order_detail/goods/3waited_for_dis/3waited_for_dis.js
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
        { id: '301', title: '棒球帽', amount: 45, orderNo: 'ORD20240603001', image: '/images/default-goods.png' },
        { id: '302', title: '帆布鞋', amount: 120, orderNo: 'ORD20240603002', image: '/images/default-goods.png' }
      ];
    },
    onEvaluate(e) { this.triggerEvent('evaluate', { id: e.currentTarget.dataset.id }); }
  }
});