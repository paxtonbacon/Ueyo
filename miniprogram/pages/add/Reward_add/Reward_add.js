// pages/add/Reward_add/Reward_add.js
Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    title: '',
    description: '',
    imageList: [],
    imageFileIDs: [],        // 云存储 fileID 列表
    minPrice: '',
    maxPrice: '',
    tradeMethod: '',
    quantity: '1',
    category: '',
    showRecommend: false,
    recommendList: [],
    mockCategories: ['宠物用品', '宠物食品', '宠物活体', '宠物服务', '电子产品', '二手书籍', '服装鞋帽', '美妆护肤']
  },

  onLoad() {
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

  // 分类输入与推荐
  onCategoryInput(e) {
    const input = e.detail.value;
    this.setData({ category: input });
    if (input.trim()) {
      const matched = this.data.mockCategories.filter(cat => cat.includes(input));
      this.setData({ recommendList: matched, showRecommend: true });
    } else {
      this.setData({ showRecommend: false });
    }
  },
  onCategoryFocus() {
    if (this.data.category.trim()) {
      const matched = this.data.mockCategories.filter(cat => cat.includes(this.data.category));
      this.setData({ recommendList: matched, showRecommend: true });
    } else {
      this.setData({ recommendList: this.data.mockCategories.slice(0, 5), showRecommend: true });
    }
  },
  onCategoryBlur() {
    setTimeout(() => {
      this.setData({ showRecommend: false });
    }, 200);
  },
  selectRecommend(e) {
    const selected = e.currentTarget.dataset.category;
    this.setData({ category: selected, showRecommend: false });
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
    if (!this.data.category) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '发布中...' });

    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'bounty/publish',
          data: {
            title: this.data.title.trim(),
            description: this.data.description.trim(),
            category: this.data.category,
            expectedPrice: parseFloat(this.data.minPrice) || 0,
            deliveryRequirement: this.data.tradeMethod || '面交',
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