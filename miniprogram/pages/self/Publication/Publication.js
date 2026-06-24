// pages/self/Publication/Publication.js
Page({
  data: {
    outerTabs: [
      { name: '商品发表' },
      { name: '悬赏发表' },
      { name: '帖子' },
      { name: '话题' }
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

  // 加载所有数据（调用云函数 order/list）
  async loadAllData() {
    try {
      // 商品订单（作为卖家）
      const goodsRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'order/list', data: { role: 'seller', page: 1, pageSize: 50 } }
      });
      const orders = (goodsRes.result.code === 0 ? goodsRes.result.data.orders : []) || [];

      const pubList = orders.filter(o => o.orderStatus === '1');
      const deliveryList = orders.filter(o => o.orderStatus === '2');
      const evaluateList = orders.filter(o => o.orderStatus === '3');
      const completeList = orders.filter(o => o.orderStatus === '4');

      this.setData({
        goods_pub_list: pubList.map(this.formatGoodsItem),
        goods_delivery_list: deliveryList.map(this.formatGoodsItem),
        goods_evaluate_list: evaluateList.map(this.formatGoodsItem),
        goods_complete_list: completeList.map(this.formatGoodsItem)
      });

      // 悬赏订单（作为买家）
      const bountyRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'order/list', data: { role: 'buyer', page: 1, pageSize: 50 } }
      });
      const bountyOrders = (bountyRes.result.code === 0 ? bountyRes.result.data.orders : []) || [];

      this.setData({
        rewards_pub_list: bountyOrders.filter(o => o.orderStatus === '1').map(this.formatRewardItem),
        rewards_evaluate_list: bountyOrders.filter(o => o.orderStatus === '3').map(this.formatRewardItem),
        rewards_complete_list: bountyOrders.filter(o => o.orderStatus === '4').map(this.formatRewardItem)
      });
    } catch (err) {
      console.error('加载发布数据失败:', err);
    }
  },

  formatGoodsItem(o) {
    return {
      id: o.orderId,
      name: o.goodsTitle || '',
      price: o.amount || 0,
      condition: '',
      tradeType: '',
      image: o.firstPictureCDN || ''
    };
  },

  formatRewardItem(o) {
    return {
      id: o.orderId,
      title: o.goodsTitle || '',
      reward: o.amount || 0,
      tradeType: '',
      image: o.firstPictureCDN || ''
    };
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