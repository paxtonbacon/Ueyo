// pages/message/People/People.js
// pages/chatlist/chatlist.js
Page({
  data: {
    chatList: []
  },

  onLoad(options) {
    this.loadChatList()
  },

  onShow() {
    // 从聊天页返回时刷新列表
    this.loadChatList()
  },

  // 从云函数加载聊天列表
  async loadChatList() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'message/conversations', data: {} }
      });
      if (res.result.code === 0) {
        const list = res.result.data.conversations || [];
        if (list.length > 0) {
          this.setData({ chatList: list });
          return;
        }
      }
    } catch (err) {
      console.error('加载聊天列表失败:', err);
    }
    // 降级：空列表
    this.setData({ chatList: [] });
  },

  // 点击某个聊天项，跳转到聊天详情页
  onTapChat(e) {
    const { id, nickname, avatar } = e.currentTarget.dataset
    // 获取该联系人的完整信息（可选）
    const target = this.data.chatList.find(item => item.id === id)
    if (!target) return

    wx.navigateTo({
      url: `/pages/message/Message_detail/Message_detail?userId=${target.id}&nickname=${encodeURIComponent(target.nickname)}&avatar=${encodeURIComponent(target.avatar)}`
    })
  },

  // 下拉刷新（可选）
  onPullDownRefresh() {
    this.loadChatList()
    wx.stopPullDownRefresh()
  }
})