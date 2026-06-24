// components/publication_detail/rewards/1haven_pub/1haven_pub.js
Component({
  properties: {
    list: {
      type: Array,
      value: []
    }
  },
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
        { id: 201, title: '求购二手自行车一辆', reward: 150, tradeType: '面交', image: '/images/default-goods.png' },
        { id: 202, title: '收一台显示器24寸以上', reward: 500, tradeType: '快递', image: '/images/default-goods.png' }
      ];
    },
    onCancel(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('cancel', { id });
    }
  }
});