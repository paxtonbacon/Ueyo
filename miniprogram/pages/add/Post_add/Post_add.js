// pages/add/Post_add/Post_add.js
const app = getApp()

function requireAuth() {
  const g = app && app.globalData
  if (!g || !g.isLogin || g.authLevel < 2) {
    wx.showModal({
      title: '需要认证',
      content: '请先完成邮箱验证，才能发布帖子',
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
    content: '',
    imageList: [],
    imageFileIDs: [],
    topicId: '',
    topicList: [],
    topicTitles: [],
    topicIndex: 0,
    relatedTopicId: '',
    statusBarHeight: 20,
    navTotalHeight: 64
  },

  onLoad(options) {
    this.initNavBarHeight();
    if (!requireAuth()) {
      wx.navigateBack({ delta: 1, fail: () => wx.switchTab({ url: '/pages/self/Myself/Myself' }) });
      return;
    }
    this.loadTopicList();
    if (options.topicId) {
      this.setData({ topicId: options.topicId });
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
        // 如果有传入的 topicId，自动选中对应话题
        let index = 0;
        let relatedId = 'others';
        if (this.data.topicId) {
          const found = topics.findIndex(t => t.id === this.data.topicId);
          if (found >= 0) {
            index = found;
            relatedId = topics[found].id;
          }
        }
        this.setData({
          topicList: topics,
          topicTitles: titles,
          topicIndex: index,
          relatedTopicId: relatedId
        });
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

  // ========== 标题输入 ==========
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  // ========== 内容输入 ==========
  onDescInput(e) {
    this.setData({ content: e.detail.value });
  },

  // ========== 选择图片（上传到云存储） ==========
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
            const cloudPath = `posts/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.jpg`;
            const uploadRes = await wx.cloud.uploadFile({
              cloudPath: cloudPath,
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
          console.error('上传图片失败:', err);
          wx.showToast({ title: '图片上传失败，请重试', icon: 'none' });
        }
      }
    });
  },

  // ========== 删除图片 ==========
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    const newFileIDs = [...this.data.imageFileIDs];
    newList.splice(index, 1);
    newFileIDs.splice(index, 1);
    this.setData({
      imageList: newList,
      imageFileIDs: newFileIDs
    });
  },

  // ========== 发布帖子 ==========
  async onPublish() {
    // ----- 表单校验 -----
    if (!this.data.title || this.data.title.trim().length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.content || this.data.content.trim().length === 0) {
      wx.showToast({ title: '请填写帖子内容', icon: 'none' });
      return;
    }
    if (this.data.imageFileIDs.length === 0) {
      wx.showToast({ title: '请上传至少一张图片', icon: 'none' });
      return;
    }
    if (!this.data.relatedTopicId) {
      wx.showToast({ title: '请选择话题分类', icon: 'none' });
      return;
    }

    const requestData = {
      title: this.data.title.trim(),
      content: this.data.content.trim(),
      topicId: this.data.topicId || this.data.relatedTopicId,
      images: this.data.imageFileIDs,
      relatedTopics: this.data.relatedTopicId
    };

    wx.showLoading({ title: '发布中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          __auth: (app && app.globalData && app.globalData.token) || '',
          action: 'social/post/publish',
          data: requestData
        }
      });

      wx.hideLoading();

      const result = res.result;
      if (result.code === 0) {
        wx.showToast({
          title: result.data?.message || '发布成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      } else {
        wx.showToast({
          title: result.msg || result.error?.msg || '发布失败',
          icon: 'none'
        });
      }
    } catch (err) {
      wx.hideLoading();
      console.error('发布失败:', err);
      wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
    }
  },

  // ========== 返回 ==========
  goBack() {
    if (this.data.title || this.data.content || this.data.imageList.length > 0) {
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