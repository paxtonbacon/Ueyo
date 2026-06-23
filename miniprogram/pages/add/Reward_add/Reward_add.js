// pages/add/Reward_add/Reward_add.js
Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    title: '',
    description: '',
    imageList: [],
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

  // 图片上传
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

  // AI一键填充（模拟：填充描述、价格区间、分类）
  onAIComplete() {
    wx.showLoading({ title: 'AI生成中...' });
    setTimeout(() => {
      wx.hideLoading();
      const mockFill = {
        description: '✨急需此物品，价格可商议，希望尽快成交。有闲置的朋友请联系～',
        minPrice: '50',
        maxPrice: '200',
        category: '宠物用品'
      };
      this.setData({
        description: mockFill.description,
        minPrice: mockFill.minPrice,
        maxPrice: mockFill.maxPrice,
        category: mockFill.category
      });
      wx.showToast({ title: 'AI补充完成', icon: 'success' });
    }, 800);
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

  // 发布（预留后端接口）
  onPublish() {
    // 验证
    if (!this.data.title || this.data.title.length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.description) {
      wx.showToast({ title: '请填写需求描述', icon: 'none' });
      return;
    }
    if (this.data.imageList.length === 0) {
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

    // 构建提交数据（供后端调用）
    const postData = {
      title: this.data.title,
      description: this.data.description,
      images: this.data.imageList,
      minPrice: this.data.minPrice,
      maxPrice: this.data.maxPrice,
      tradeMethod: this.data.tradeMethod,
      quantity: this.data.quantity,
      category: this.data.category
    };
    console.log('提交数据:', postData);

    wx.showLoading({ title: '发布中...' });
    // 模拟网络请求，实际替换为 wx.request 或云函数
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '发布成功', icon: 'success' });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    }, 1000);
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