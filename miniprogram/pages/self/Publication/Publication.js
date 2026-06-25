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

  // 加载所有数据（调用 user/myGoods + user/myBounties）
  async loadAllData() {
    try {
      // 我的商品（发布）
      const goodsRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'user/myGoods', data: {} }
      });
      if (goodsRes.result.code === 0) {
        const p = goodsRes.result.data.published || {};
        this.setData({
          goods_pub_list: p['1have_pub'] || [],
          goods_delivery_list: p['2waited_for_del'] || [],
          goods_evaluate_list: p['3waited_for_dis'] || [],
          goods_complete_list: p['4all_down'] || []
        });
      }

      // 我的悬赏（发布）
      const bountyRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'user/myBounties', data: {} }
      });
      if (bountyRes.result.code === 0) {
        const p = bountyRes.result.data.published || {};
        this.setData({
          rewards_pub_list: p['1haven_pub'] || [],
          rewards_evaluate_list: p['2waited_for_dis'] || [],
          rewards_complete_list: p['3all_down'] || []
        });
      }
    } catch (err) {
      console.error('加载发布数据失败:', err);
    }
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