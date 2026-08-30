// pages/add/Reward_add/Reward_add.js
const app = getApp()

function requireAuth() {
  const g = app && app.globalData
  if (!g || !g.isLogin || g.authLevel < 2) {
    wx.showModal({
      title: '需要认证',
      content: '请先完成邮箱验证，才能发布悬赏',
      confirmText: '去验证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({ url: '/pages/register_login/Email_Val/Email_Val' })
        }
      }
    })
    return false
  }
  return true
}

Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    title: '',
    description: '',
    imageList: [],
    imageFileIDs: [],
    minPrice: '',
    maxPrice: '',
    tradeMethod: '',
    quantity: '1',
    topicList: [],
    topicTitles: [],
    topicIndex: 0,
    relatedTopicId: ''
  },

  onLoad() {
    this.initNavBarHeight();
    this.loadTopicList();
  },

  onShow() {
    if (!requireAuth()) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/self/Myself/Myself' }) });
    }
  },

  initNavBarHeight() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const isIOS = /iOS/i.test(sysInfo.system);
    const navContentHeight = isIOS ? 44 : 48;
    const navTotalHeight = statusBarHeight + navContentHeight;
    this.setData({ statusBarHeight, navTotalHeight });
  },

  // ========== 加载话题列表 ==========
  async loadTopicList() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: { action: 'social/topic/list', data: { page: 1, pageSize: 50 } }
      });
      if (res.result && res.result.code === 0) {
        const topics = res.result.data.topic_list || [];
        const titles = topics.map(t => t.title);
        titles.push('其他');
        this.setData({ topicList: topics, topicTitles: titles });
      }
    } catch (e) {
      console.error('加载话题列表失败:', e);
    }
  },

  // ========== 话题选择 ==========
  onTopicChange(e) {
    const index = parseInt(e.detail.value);
    const topicList = this.data.topicList;
    let relatedTopicId = 'others';
    if (index < topicList.length) {
      relatedTopicId = topicList[index].id;
    }
    this.setData({ topicIndex: index, relatedTopicId });
  },

  // 标题输入
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // 描述输入
  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  // 图片上传（上传到云存储）
  async chooseImage() {
    const remainCount = 9 - this.data.imageList.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({ title: '上传中...' });
        const tempFiles = res.tempFiles;
        const uploadedFileIDs = [];
        const localPaths = [];
        try {
          for (const file of tempFiles) {
            const cloudPath = `bounties/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const uploadRes = await wx.cloud.uploadFile({
              cloudPath,
              filePath: file.tempFilePath
            });
            uploadedFileIDs.push(uploadRes.fileID);
            localPaths.push(file.tempFilePath);
          }
          this.setData({
            imageList: [...this.data.imageList, ...localPaths],
            imageFileIDs: [...this.data.imageFileIDs, ...uploadedFileIDs]
          });
          wx.hideLoading();
          wx.showToast({ title: `上传成功 ${uploadedFileIDs.length} 张`, icon: 'success' });
        } catch (err) {
          wx.hideLoading();
          console.error('上传失败:', err);
          wx.showToast({ title: '上传失败，请重试', icon: 'none' });
        }
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    const newFileIDs = [...this.data.imageFileIDs];
    newList.splice(index, 1);
    newFileIDs.splice(index, 1);
    this.setData({ imageList: newList, imageFileIDs: newFileIDs });
  },

  // AI一键填充（暂不支持悬赏AI生成，提示用户手动填写）
  onAIComplete() {
    wx.showToast({ title: '请手动填写悬赏描述', icon: 'none' });
  },

  // 价格区间输入
  onMinPriceInput(e) {
    this.setData({ minPrice: e.detail.value });
  },
  onMaxPriceInput(e) {
    this.setData({ maxPrice: e.detail.value });
  },

  // 交易方式
  onTradeMethodInput(e) {
    this.setData({ tradeMethod: e.detail.value });
  },

  // 售卖量
  increaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    num++;
    this.setData({ quantity: num.toString() });
  },
  decreaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    if (num > 1) {
      num--;
      this.setData({ quantity: num.toString() });
    }
  },
  onQuantityInput(e) {
    let val = e.detail.value;
    if (val === '' || parseInt(val) < 1) val = '1';
    this.setData({ quantity: val });
  },

  // 发布悬赏（调用云函数 bounty/publish）
  async onPublish() {
    if (!this.data.title || this.data.title.length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.description) {
      wx.showToast({ title: '请填写需求描述', icon: 'none' });
      return;
    }
    if (this.data.imageFileIDs.length === 0) {
      wx.showToast({ title: '请上传图片', icon: 'none' });
      return;
    }
    if (!this.data.minPrice || !this.data.maxPrice) {
      wx.showToast({ title: '请填写价格区间', icon: 'none' });
      return;
    }
    if (!this.data.relatedTopicId) {
      wx.showToast({ title: '请选择话题分类', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          __auth: (app && app.globalData && app.globalData.token) || '',
          action: 'bounty/publish',
          data: {
            title: this.data.title.trim(),
            description: this.data.description.trim(),
            category: this.data.topicTitles[this.data.topicIndex] || '其他',
            minPrice: parseFloat(this.data.minPrice) || 0,
            maxPrice: parseFloat(this.data.maxPrice) || 0,
            tradeMethod: this.data.tradeMethod || '面交',
            images: this.data.imageFileIDs,
            relatedTopics: this.data.relatedTopicId
          }
        }
      });

      wx.hideLoading();
      const result = res.result;
      if (result.code === 0) {
        wx.showToast({ title: result.data?.message || '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: result.msg || '发布失败', icon: 'none' });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('发布悬赏失败:', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }
  },

  // 返回（带未保存提示）
  goBack() {
    if (this.data.title || this.data.description || this.data.imageList.length > 0) {
      wx.showModal({
        title: '提示',
        content: '有未保存的内容，确定退出吗？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateBack();
          }
        }
      });
    } else {
      wx.navigateBack();
    }
  }
});