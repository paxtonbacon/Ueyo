// pages/message/Message_detail.js
Page({
  data: {
    keyboardHeight: 0,
    statusBarHeight: 20,
    targetUser: {
      id: '',
      nickname: '',
      avatar: ''
    },
    myAvatar: 'https://randomuser.me/api/portraits/women/68.jpg', // 自己的头像
    messageList: [],
    inputText: '',
    showPlusPanel: false,
    scrollToView: ''
  },

  onLoad(options) {
    // 获取系统状态栏高度
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: systemInfo.statusBarHeight })

    // 接收从聊天列表页传递的参数
    const { userId, nickname, avatar } = options
    console.log('接收到的参数:', options)  // 调试用
    const decodedNickname = nickname ? decodeURIComponent(nickname) : '用户'
    const targetUser = {
      id: userId || 'default',
      nickname: decodedNickname,
      avatar: avatar ? decodeURIComponent(avatar) : 'https://randomuser.me/api/portraits/men/1.jpg'
    }
    this.setData({ targetUser })

    // 加载聊天记录（调用封装的函数）
    this.loadMessages()

    wx.onKeyboardHeightChange(res => {
      this.setData({ keyboardHeight: res.height });
      // 键盘弹起时滚动到底部，让新消息可见
      if (res.height > 0) this.scrollToBottom();
    });
  },

  // ========== 消息数据封装函数（后续可替换为真实接口） ==========
  /**
   * 获取聊天记录
   * @param {string} userId 对方用户ID
   * @returns {Array} 消息列表
   */
  getMessagesByUserId(userId) {
    // 这里可以根据 userId 返回不同的 mock 数据，或从本地存储/后端获取
    // 目前返回通用示例，实际可扩展为异步请求
    const baseMessages = [
      { id: '1', from: 'other', content: '你好，在吗？', time: '10:00', avatar: this.data.targetUser.avatar },
      { id: '2', from: 'self', content: '在的，有什么事？', time: '10:02', avatar: this.data.myAvatar },
      { id: '3', from: 'other', content: '想和你讨论一下项目进度', time: '10:03', avatar: this.data.targetUser.avatar },
      { id: '4', from: 'self', content: '好的，你说', time: '10:05', avatar: this.data.myAvatar }
    ]
    // 如果 userId 不同，可以在这里区分
    return baseMessages
  },

  async loadMessages() {
    // 调用封装函数获取消息（同步或异步）
    const messages = this.getMessagesByUserId(this.data.targetUser.id)
    this.setData({ messageList: messages }, () => {
      this.scrollToBottom()
    })
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({ scrollToView: 'msg-bottom' });
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  // 发送消息（点击键盘发送按钮）
  onSendMsg() {
    const content = this.data.inputText.trim()
    if (!content) return
    const newMsg = {
      id: Date.now().toString(),
      from: 'self',
      content: content,
      time: this.getCurrentTime(),
      avatar: this.data.myAvatar
    }
    const newList = [...this.data.messageList, newMsg]
    this.setData({
      messageList: newList,
      inputText: ''
    }, () => {
      this.scrollToBottom()
    })
    // 可在此调用后端接口发送消息
  },

  // 获取当前时间 HH:MM
  getCurrentTime() {
    const date = new Date()
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  },

  // 返回上一页
  onBack() {
    wx.navigateBack()
  },

  // 点击用户头像/昵称（跳转个人主页，目前弹窗提示）
  onTapUserInfo() {
    wx.showModal({
      title: '提示',
      content: '个人主页开发中...',
      showCancel: false
    })
  },

  // 加号面板显示/隐藏
  togglePlusPanel() {
    this.setData({ showPlusPanel: !this.data.showPlusPanel })
  },
  hidePlusPanel() {
    this.setData({ showPlusPanel: false })
  },
  preventHide() {
    // 阻止冒泡，防止点击面板内部时关闭
  },

  // 相册
  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const newMsg = {
          id: Date.now().toString(),
          from: 'self',
          content: '[图片]',
          time: this.getCurrentTime(),
          avatar: this.data.myAvatar
        }
        this.setData({
          messageList: [...this.data.messageList, newMsg],
          showPlusPanel: false
        }, () => this.scrollToBottom())
        console.log('选择的图片路径:', tempFilePath)
      }
    })
  },

  // 拍摄
  onTakePhoto() {
    wx.chooseImage({
      count: 1,
      sourceType: ['camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        const newMsg = {
          id: Date.now().toString(),
          from: 'self',
          content: '[图片]',
          time: this.getCurrentTime(),
          avatar: this.data.myAvatar
        }
        this.setData({
          messageList: [...this.data.messageList, newMsg],
          showPlusPanel: false
        }, () => this.scrollToBottom())
        console.log('拍摄的图片路径:', tempFilePath)
      }
    })
  },

  // 位置
  onChooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        const locationMsg = `位置：${res.name} ${res.address}`
        const newMsg = {
          id: Date.now().toString(),
          from: 'self',
          content: locationMsg,
          time: this.getCurrentTime(),
          avatar: this.data.myAvatar
        }
        this.setData({
          messageList: [...this.data.messageList, newMsg],
          showPlusPanel: false
        }, () => this.scrollToBottom())
        console.log('选择的位置:', res)
      }
    })
  }
})