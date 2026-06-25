// components/order_detail/rewards/1waited_for_do/1waited_for_do.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onCancel(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认取消', content:'取消后悬赏将重新上架', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'bounty/updateStatus',data:{bountyId:id,action:'takerCancel'}}});
          if(res.result.code===0){wx.showToast({title:'已取消'});this.triggerEvent('cancel',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    }
  }
});