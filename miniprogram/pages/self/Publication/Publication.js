// pages/self/Publication/Publication.js
Page({
  data: {
    outerTabs: [
      { name: '商品发表' },
      { name: '悬赏发表' }
    ],
    goodsTabs: [
      { name: '已发布' },
      { name: '待发货' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    rewardsTabs: [
      { name: '待揭榜' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    currentOuter: 0,
    innerCurrents: [0, 0], // 分别对应商品、悬赏的内层索引

    // 商品各状态列表
    goods_pub_list: [],
    goods_delivery_list: [],
    goods_evaluate_list: [],
    goods_complete_list: [],
    // 悬赏各状态列表
    rewards_pub_list: [],
    rewards_evaluate_list: [],
    rewards_complete_list: [],
  },

  onLoad() {
    this.loadAllData();
  },

  // 加载所有数据
  loadAllData() {
    this.loadGoodsData();
    this.loadRewardsData();
  },

  // 加载商品数据
  loadGoodsData() {
    const pubList = this.getMockData('goods', 'published');
    const deliveryList = this.getMockData('goods', 'delivery');
    const evaluateList = this.getMockData('goods', 'evaluate');
    const completeList = this.getMockData('goods', 'complete');
    this.setData({
      goods_pub_list: pubList,
      goods_delivery_list: deliveryList,
      goods_evaluate_list: evaluateList,
      goods_complete_list: completeList
    });
  },

  // 加载悬赏数据
  loadRewardsData() {
    const pubList = this.getMockData('rewards', 'published');
    const evaluateList = this.getMockData('rewards', 'evaluate');
    const completeList = this.getMockData('rewards', 'complete');
    this.setData({
      rewards_pub_list: pubList,
      rewards_evaluate_list: evaluateList,
      rewards_complete_list: completeList
    });
  },

  // Mock数据生成函数
  getMockData(type, status) {
    // 商品基础数据
    const goodsBase = [
      { id: 1, name: '复古运动鞋', price: 22, condition: '9.5', tradeType: '面交', image: '/images/goods1.png' },
      { id: 2, name: '简约双肩包', price: 22, condition: '8.0', tradeType: '邮寄', image: '/images/goods2.png'},
      { id: 3, name: '纯棉T恤', price: 22, condition: '9.0', tradeType: '面交', image: '/images/goods3.png' },
    ];
    // 悬赏基础数据
    const rewardBase = [
      { id: 101, title: '寻猫启事', reward: 500, tradeType: '面交', image: '/images/reward1.png' },
      { id: 102, title: '求帮忙遛狗', reward: 50, tradeType: '邮寄', image: '/images/reward2.png' },
      { id: 103, title: '找合租室友', reward: 0, tradeType: '面交', image: '/images/reward3.png' },
    ];

    if (type === 'goods') {
      if (status === 'published') return goodsBase.slice(0, 2);
      if (status === 'delivery') return [goodsBase[1]];
      if (status === 'evaluate') return [goodsBase[0], goodsBase[2]];
      if (status === 'complete') return [goodsBase[2]];
    } else if (type === 'rewards') {
      if (status === 'published') return rewardBase.slice(0, 1);
      if (status === 'evaluate') return rewardBase.slice(1, 2);
      if (status === 'complete') return rewardBase.slice(2);
    }
    return [];
  },

  // 外层Tab切换
  onOuterTabChange(e) {
    const index = e.detail.index;
    this.setData({ currentOuter: index });
  },

  // 内层Tab切换
  onInnerTabChange(e) {
    const { index } = e.detail;
    const outerIndex = e.currentTarget.dataset.outer;
    const newInnerCurrents = [...this.data.innerCurrents];
    newInnerCurrents[outerIndex] = index;
    this.setData({ innerCurrents: newInnerCurrents });
  },

  // 根据外层和内层索引获取列表key
  getListKey(outer, inner) {
    const map = {
      '0_0': 'goods_pub_list',
      '0_1': 'goods_delivery_list',
      '0_2': 'goods_evaluate_list',
      '0_3': 'goods_complete_list',
      '1_0': 'rewards_pub_list',
      '1_1': 'rewards_evaluate_list',
      '1_2': 'rewards_complete_list',
    };
    return map[`${outer}_${inner}`] || null;
  },

  // 商品下架
  onGoodsShelve(e) {
    const { id } = e.detail;
    const outer = this.data.currentOuter;
    const inner = this.data.innerCurrents[outer];
    const listKey = this.getListKey(outer, inner);
    if (listKey) {
      const newList = this.data[listKey].filter(item => item.id !== id);
      this.setData({ [listKey]: newList });
      wx.showToast({ title: '下架成功', icon: 'success' });
    }
  },

  // 商品管理（跳转编辑页）
  onGoodsManage(e) {
    const { id } = e.detail;
    wx.navigateTo({
      url: `/pages/add/Goods_add/Goods_add?id=${id}`,
      fail: () => wx.showToast({ title: '跳转失败', icon: 'none' })
    });
  },

  // 悬赏接单
  onRewardAccept(e) {
    const { id } = e.detail;
    wx.showToast({ title: '接单成功', icon: 'success' });
    // 可在此处调用接口并更新列表
  },

  // 悬赏管理（跳转编辑页）
  onRewardManage(e) {
    const { id } = e.detail;
    wx.navigateTo({
      url: `/pages/add/Reward_add/Reward_add?id=${id}`,
      fail: () => wx.showToast({ title: '跳转失败', icon: 'none' })
    });
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadAllData();
    wx.stopPullDownRefresh();
  },

  // 上拉加载更多（可扩展）
  onReachBottom() {
    console.log('加载更多');
  },

  onShareAppMessage() {
    return {
      title: '我的发布',
      path: '/pages/self/Publication/Publication'
    };
  }
});