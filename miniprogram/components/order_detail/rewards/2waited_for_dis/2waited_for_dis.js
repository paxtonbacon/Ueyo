// components/order_detail/rewards/2waited_for_dis/2waited_for_dis.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onEvaluate(e) {
      wx.navigateTo({ url: `/pages/add/Evaluate_add/Evaluate_add?goodsId=${e.currentTarget.dataset.id}&direction=buyer_to_seller&type=bounty` });
    }
  }
});