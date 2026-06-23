// pages/add/Post_add/Post_add.js
Page({
  data: {
    title: '',
    description: '',
    imageList: [],
    statusBarHeight: 20,
    navTotalHeight: 64
  },

  onLoad() {
    // 可移除用户信息相关，如需保留用户名可用于其他位置
    this.initNavBarHeight();
  },

  initNavBarHeight() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const isIOS = /iOS/i.test(sysInfo.system);
    const navContentHeight = isIOS ? 44 : 48;
    const navTotalHeight = statusBarHeight + navContentHeight;
    this.setData({ statusBarHeight, navTotalHeight });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescInput(e) {
    this.setData({ description: e.detail.value });
  },

  chooseImage() {
    const remainCount = 9 - this.data.imageList.length;
    if (remainCount <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' });
      return;
    }
    wx.chooseMedia({
      count: remainCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath);
        this.setData({
          imageList: [...this.data.imageList, ...newImages]
        });
      }
    });
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    newList.splice(index, 1);
    this.setData({ imageList: newList });
  },

  onPublish() {
    if (!this.data.title || this.data.title.length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.description) {
      wx.showToast({ title: '请填写帖子内容', icon: 'none' });
      return;
    }
    if (this.data.imageList.length === 0) {
      wx.showToast({ title: '请上传图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
  },

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