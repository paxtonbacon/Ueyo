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
    myAvatar: '',
    messageList: [],
    inputText: '',
    showPlusPanel: false,
    scrollToView: ''
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync()
    this.setData({ statusBarHeight: systemInfo.statusBarHeight })

    // 同步自己的头像
    const app = getApp()
    const myAvatar = (app && app.globalData && app.globalData.avatarUrl) || ''
    this.setData({ myAvatar })

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

  // ========== 消息数据（已由云函数 message/list 提供） ==========

  // 从云函数加载聊天消息
  async loadMessages() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'message/list',
          data: { targetUserId: this.data.targetUser.id, page: 1, pageSize: 50 }
        }
      });
      if (res.result.code === 0) {
        const msgs = res.result.data.messages || [];
        if (msgs.length > 0) {
          this.setData({ messageList: msgs }, () => this.scrollToBottom());
          return;
        }
      }
    } catch (err) {
      console.error('加载消息失败:', err);
    }
    // 降级：空列表
    this.setData({ messageList: [] });
  },

  // 滚动到底部
  scrollToBottom() {
    this.setData({ scrollToView: 'msg-bottom' });
  },

  // 输入框内容变化
  onInputChange(e) {
    this.setData({ inputText: e.detail.value })
  },

  // 发送消息（调用云函数）
  async onSendMsg() {
    const content = this.data.inputText.trim();
    if (!content) return;

    const newMsg = {
      id: Date.now().toString(),
      from: 'self',
      content: content,
      time: this.getCurrentTime(),
      avatar: this.data.myAvatar
    };
    // 乐观更新
    this.setData({
      messageList: [...this.data.messageList, newMsg],
      inputText: ''
    }, () => this.scrollToBottom());

    try {
      await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'message/send',
          data: { targetUserId: this.data.targetUser.id, content }
        }
      });
    } catch (err) {
      console.error('发送消息失败:', err);
    }
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