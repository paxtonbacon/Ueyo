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

  // 加载订单
  async loadOrders() {
    try {
      const goodsRes = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'order/list', data: { role: 'buyer', page: 1, pageSize: 50 } }
      });
      const orders = (goodsRes.result.code === 0 ? goodsRes.result.data.orders : []) || [];
      const fmt = this.formatOrder;
      this.setData({
        goods_waitPay: orders.filter(o => o.orderStatus === '1').map(fmt),
        goods_paid: orders.filter(o => o.orderStatus === '2').map(fmt),
        goods_evaluate: orders.filter(o => o.orderStatus === '3').map(fmt),
        goods_complete: orders.filter(o => o.orderStatus === '4' || o.orderStatus === '6').map(fmt)
      });
    } catch (err) {
      console.error('加载订单失败:', err);
    }
  },

  // 订单数据映射
  formatOrder(o) {
    return {
      id: o.orderId,
      title: o.goodsTitle || '',
      amount: o.amount || 0,
      orderNo: o.orderNo || '',
      image: o.firstPictureCDN || '',
      finalStatus: o.orderStatus === '6' ? '已取消' : (o.orderStatus === '4' ? '已完成' : '')
    };
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