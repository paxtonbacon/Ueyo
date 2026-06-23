// pages/add/Goods_add/Goods_add.js
Page({
  data: {
    title: '',
    description: '',
    imageList: [],
    price: '',
    tradeMethod: '',        // 交易方式（文本）
    quantity: '1',
    category: '',           // 分类
    showRecommend: false,   // 是否显示推荐下拉
    recommendList: [],      // 推荐分类列表
    // 预置 mock 分类库（用于实时推荐）
    mockCategories: ['宠物用品', '宠物食品', '宠物活体', '宠物服务', '电子产品', '二手书籍', '服装鞋帽', '美妆护肤'],
    statusBarHeight: 20,
    navTotalHeight: 64
  },

  onLoad() {
    // 可加载初始数据，暂无
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

  // 选择图片
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

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index;
    const newList = [...this.data.imageList];
    newList.splice(index, 1);
    this.setData({ imageList: newList });
  },

  // AI一键填充（模拟）
  onAIComplete() {
    wx.showLoading({ title: 'AI生成中...' });
    setTimeout(() => {
      wx.hideLoading();
      const mockFill = {
        description: '✨全新正品，质量保证，支持专柜验货。物美价廉，喜欢的不要错过～',
        price: '88.00',
        category: '宠物用品'
      };
      this.setData({
        description: mockFill.description,
        price: mockFill.price,
        category: mockFill.category
      });
      wx.showToast({ title: 'AI补充完成', icon: 'success' });
    }, 800);
  },

  // 价格输入
  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  // 交易方式输入
  onTradeMethodInput(e) {
    this.setData({ tradeMethod: e.detail.value });
  },

  // 售卖量增加
  increaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    num++;
    this.setData({ quantity: num.toString() });
  },

  // 售卖量减少
  decreaseQuantity() {
    let num = parseInt(this.data.quantity) || 1;
    if (num > 1) {
      num--;
      this.setData({ quantity: num.toString() });
    }
  },

  // 售卖量输入
  onQuantityInput(e) {
    let val = e.detail.value;
    if (val === '' || parseInt(val) < 1) val = '1';
    this.setData({ quantity: val });
  },

  // 分类输入（实时推荐）
  onCategoryInput(e) {
    const input = e.detail.value;
    this.setData({ category: input });
    if (input.trim()) {
      // 模糊匹配 mock 分类库
      const matched = this.data.mockCategories.filter(cat => cat.includes(input));
      this.setData({ recommendList: matched, showRecommend: true });
    } else {
      this.setData({ showRecommend: false });
    }
  },

  onCategoryFocus() {
    // 聚焦时如果有输入内容，展示推荐；否则展示全部（可选）
    if (this.data.category.trim()) {
      const matched = this.data.mockCategories.filter(cat => cat.includes(this.data.category));
      this.setData({ recommendList: matched, showRecommend: true });
    } else {
      // 默认展示前5个推荐
      this.setData({ recommendList: this.data.mockCategories.slice(0, 5), showRecommend: true });
    }
  },

  onCategoryBlur() {
    // 延迟隐藏，以便点击推荐项时能触发
    setTimeout(() => {
      this.setData({ showRecommend: false });
    }, 200);
  },

  // 选择推荐分类
  selectRecommend(e) {
    const selected = e.currentTarget.dataset.category;
    this.setData({ category: selected, showRecommend: false });
  },

  // 发布
  onPublish() {
    // 表单验证
    if (!this.data.title || this.data.title.length < 4) {
      wx.showToast({ title: '标题至少4个字', icon: 'none' });
      return;
    }
    if (!this.data.description) {
      wx.showToast({ title: '请填写商品描述', icon: 'none' });
      return;
    }
    if (this.data.imageList.length === 0) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' });
      return;
    }
    if (!this.data.price) {
      wx.showToast({ title: '请填写价格', icon: 'none' });
      return;
    }
    if (!this.data.category) {
      wx.showToast({ title: '请选择分类', icon: 'none' });
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

  // 返回
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