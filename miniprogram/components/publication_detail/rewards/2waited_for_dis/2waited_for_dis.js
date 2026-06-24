// components/publication_detail/rewards/2waited_for_dis/2waited_for_dis.js
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
        { id: 301, title: '求帮忙代取快递', reward: 20, tradeType: '面交', image: '/images/default-goods.png' },
        { id: 302, title: '求租校园卡一张', reward: 50, tradeType: '均可', image: '/images/default-goods.png' }
      ];
    },
    onFailReport(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('failreport', { id });
    },
    onEvaluate(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('evaluate', { id });
    }
  }
});