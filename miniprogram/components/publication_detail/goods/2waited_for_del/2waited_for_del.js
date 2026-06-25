// components/publication_detail/goods/2waited_for_del/2waited_for_del.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onDeliver(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认发货', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'deliver'}}});
          if(res.result.code===0){wx.showToast({title:'已发货'});this.triggerEvent('deliver',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    }
  }
});