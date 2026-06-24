// components/publication_detail/rewards/3all_down/3all_down.js
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
        { id: 401, title: '求购二手笔记本电脑', reward: 2000, tradeType: '面交', finalStatus: '已完成', image: '/images/default-goods.png' },
        { id: 402, title: '找合租室友', reward: 0, tradeType: '均可', finalStatus: '已取消', image: '/images/default-goods.png' }
      ];
    }
  }
});