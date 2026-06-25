// pages/self/Order/Order.js
Page({
  data: {
    outerTabs: [
      { name: '商品订单' },
      { name: '悬赏订单' }
    ],
    goodsTabs: [
      { name: '待付款' },
      { name: '已支付' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    rewardsTabs: [
      { name: '待履约' },
      { name: '待评价' },
      { name: '已完成' }
    ],
    innerCurrents: [0, 0],
    // 分类后的列表
    goods_waitPay: [],
    goods_paid: [],
    goods_evaluate: [],
    goods_complete: [],
    rewards_active: [],
    rewards_evaluate: [],
    rewards_complete: []
  },

  onShow() {
    this.loadOrders();
  },

  // 加载订单（user/myGoods 购买 + user/myBounties 接取）
  async loadOrders() {
    try {
      // 购买的商品
      const goodsRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'user/myGoods', data: {} }
      });
      if (goodsRes.result.code === 0) {
        const b = goodsRes.result.data.bought || {};
        this.setData({
          goods_waitPay: b['1waited_for_pay'] || [],
          goods_paid: b['2waited_for_get'] || [],
          goods_evaluate: b['3waited_for_dis'] || [],
          goods_complete: b['4have_down'] || []
        });
      }

      // 接取的悬赏
      const bountyRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'user/myBounties', data: {} }
      });
      if (bountyRes.result.code === 0) {
        const t = bountyRes.result.data.taken || {};
        this.setData({
          rewards_active: t['1waited_for_do'] || [],
          rewards_evaluate: t['2waited_for_dis'] || [],
          rewards_complete: t['3have_down'] || []
        });
      }
    } catch (err) {
      console.error('加载订单失败:', err);
    }
  },

  onOuterTabChange(e) {
    this.setData({ 'innerCurrents[0]': 0, 'innerCurrents[1]': 0 });
  },

  onInnerTabChange(e) {
    const index = e.detail.index;
    const outerIndex = e.currentTarget.dataset.outer;
    this.setData({ [`innerCurrents[${outerIndex}]`]: index });
  },

  // 取消订单
  async onOrderCancel(e) {
    const { id } = e.detail;
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'order/cancel', data: { orderId: id } }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: '已取消', icon: 'success' });
        this.loadOrders();
      } else {
        wx.showToast({ title: res.result.msg || '取消失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // 立即付款
  onOrderPay(e) {
    const { id } = e.detail;
    wx.showToast({ title: '支付功能开发中', icon: 'none' });
  },

  // 退款
  onOrderRefund(e) {
    const { id } = e.detail;
    wx.showToast({ title: '退款功能开发中', icon: 'none' });
  },

  // 确认收货
  async onOrderConfirm(e) {
    const { id } = e.detail;
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'order/confirm', data: { orderId: id } }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: '已确认收货', icon: 'success' });
        this.loadOrders();
      } else {
        wx.showToast({ title: res.result.msg || '操作失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // 进行评价
  onOrderEvaluate(e) {
    const { id } = e.detail;
    wx.showToast({ title: '评价功能开发中', icon: 'none' });
  },

  onPullDownRefresh() {
    this.loadOrders().then(() => wx.stopPullDownRefresh());
  }
})