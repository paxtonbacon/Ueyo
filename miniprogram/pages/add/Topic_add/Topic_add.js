// pages/add/Topic_add/Topic_add.js
const app = getApp()

function requireAuth() {
  const g = app && app.globalData
  if (!g || !g.isLogin || g.authLevel < 2) {
    wx.showModal({
      title: '需要认证',
      content: '请先完成邮箱验证，才能创建话题',
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
    title: '',
    introduction: '',
    imageList: [],
    imageFileIDs: []     // 云存储 fileID 列表
  },

  onLoad() {
    if (!requireAuth()) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/self/Myself/Myself' }) });
      return;
    }
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onIntroInput(e) {
    this.setData({ introduction: e.detail.value });
  },

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
            const cloudPath = `topics/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const uploadRes = await wx.cloud.uploadFile({ cloudPath, filePath: file.tempFilePath });
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

  async onPublish() {
    if (!this.data.title || this.data.title.length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.introduction) {
      wx.showToast({ title: '请填写话题简介', icon: 'none' });
      return;
    }
    if (this.data.imageFileIDs.length === 0) {
      wx.showToast({ title: '请上传图片', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          __auth: (app && app.globalData && app.globalData.token) || '',
          action: 'social/topic/create',
          data: {
            title: this.data.title.trim(),
            introduction: this.data.introduction.trim(),
            images: this.data.imageFileIDs
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
      console.error('创建话题失败:', err);
      wx.showToast({ title: '网络异常，请重试', icon: 'none' });
    }
  },

  goBack() {
    if (this.data.title || this.data.introduction || this.data.imageList.length > 0) {
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