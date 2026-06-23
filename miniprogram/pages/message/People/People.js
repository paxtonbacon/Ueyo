// pages/message/People/People.js
// pages/chatlist/chatlist.js
Page({
  data: {
    chatList: []
  },

  onLoad(options) {
    this.loadChatList()
  },

  // 模拟获取聊天列表数据（实际可从本地存储或接口获取）
  loadChatList() {
    // 真实场景可调用 wx.getStorageSync('chatList') 或发起请求
    const mockList = [
      {
        id: 'user_001',
        nickname: '张三',
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        lastMsg: '明天一起去打球吗？',
        lastTime: '13:45',
        unreadCount: 2,
        muted: false
      },
      {
        id: 'user_002',
        nickname: '李四',
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        lastMsg: '文件收到了，谢谢！',
        lastTime: '昨天',
        unreadCount: 0,
        muted: false
      },
      {
        id: 'user_003',
        nickname: '王芳',
        avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
        lastMsg: '[图片]',
        lastTime: '昨天',
        unreadCount: 1,
        muted: true
      },
      {
        id: 'user_004',
        nickname: '产品小分队',
        avatar: 'https://randomuser.me/api/portraits/men/4.jpg',
        lastMsg: '有人提到你: 这个需求下周三上线',
        lastTime: '19:20',
        unreadCount: 5,
        muted: false
      },
      {
        id: 'user_005',
        nickname: '赵六',
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        lastMsg: '周末聚餐地点定了吗？',
        lastTime: '星期三',
        unreadCount: 0,
        muted: false
      }
    ]
    this.setData({ chatList: mockList })
  },

  // 点击某个聊天项，跳转到聊天详情页
  onTapChat(e) {
    const { id, nickname, avatar } = e.currentTarget.dataset
    // 获取该联系人的完整信息（可选）
    const target = this.data.chatList.find(item => item.id === id)
    if (!target) return

    wx.showToast({
      title: '点击成功'
    })
    // 跳转到聊天页面，传递必要参数（对方id、昵称、头像等）
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