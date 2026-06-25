// components/order_detail/goods/1waited_for_pay/1waited_for_pay.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onCancel(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认取消', content:'取消后商品将重新上架', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'cancel'}}});
          if(res.result.code===0){wx.showToast({title:'已取消'});this.triggerEvent('cancel',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    },
    onPay(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认付款', content:'模拟支付流程', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'pay'}}});
          if(res.result.code===0){wx.showToast({title:'已付款'});this.triggerEvent('pay',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    }
  }
});