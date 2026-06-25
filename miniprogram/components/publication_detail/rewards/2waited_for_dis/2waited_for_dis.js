// components/publication_detail/rewards/2waited_for_dis/2waited_for_dis.js
Component({
  properties: { list: { type: Array, value: [] } },
  methods: {
    onFailReport(e) {
      const id = e.currentTarget.dataset.id;
      wx.showModal({ title:'确认失败汇报', content:'将重新发布悬赏', success: async r=>{
        if(!r.confirm) return;
        try{
          const res=await wx.cloud.callFunction({name:'backend',data:{action:'bounty/updateStatus',data:{bountyId:id,action:'failreport'}}});
          if(res.result.code===0){wx.showToast({title:'已汇报'});this.triggerEvent('failreport',{id});}
          else wx.showToast({title:res.result.msg,icon:'none'});
        }catch(e){wx.showToast({title:'网络异常',icon:'none'});}
      }});
    },
    onEvaluate(e) {
      wx.navigateTo({ url: `/pages/add/Evaluate_add/Evaluate_add?goodsId=${e.currentTarget.dataset.id}&direction=seller_to_buyer&type=bounty` });
    }
  }
});