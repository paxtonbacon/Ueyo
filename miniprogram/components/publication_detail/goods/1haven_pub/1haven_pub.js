// components/publication_detail/goods/1haven_pub/1haven_pub.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onShelve(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认下架', content:'下架后商品将不再展示', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'goods/updateStatus',data:{goodsId:id,action:'shelve'}}});
          if(res.result.code===0){wx.showToast({title:'已下架'});this.triggerEvent('shelve',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    },
    onManage(e) {
      wx.navigateTo({ url: `/pages/add/Goods_add/Goods_add?id=${e.currentTarget.dataset.id}` });
    }
  }
});