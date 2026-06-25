// components/order_detail/goods/2waited_for_get/2waited_for_get.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onRefund(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认退款', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'refund'}}});
          if(res.result.code===0){wx.showToast({title:'已退款'});this.triggerEvent('refund',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    },
    onConfirm(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认收货', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'confirm'}}});
          if(res.result.code===0){wx.showToast({title:'已确认'});this.triggerEvent('confirm',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    }
  }
});
