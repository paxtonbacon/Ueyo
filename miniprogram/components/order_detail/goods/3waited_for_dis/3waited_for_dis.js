// components/order_detail/goods/3waited_for_dis/3waited_for_dis.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onEvaluate(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({ url: `/pages/add/Evaluate_add/Evaluate_add?goodsId=${id}&direction=buyer_to_seller` });
    }
  }
});