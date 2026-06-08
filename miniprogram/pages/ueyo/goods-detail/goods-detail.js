Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    scrollViewHeight: 0,
    isFavorited: false,        // 收藏状态
    safeAreaBottom: 0,         // 底部安全区高度（iPhone X 等）
    rightCapsuleSafePadding: '100px',
    goodsInfo: {
      images: [],
      price: '',
      condition: '',
      title: '',
      desc: '',
      tradeWays: '',
      sellerAvatar: '',
      sellerName: '',   // 新增
      sellerId: '',
      comments: []
    }
  },

  onLoad(options) {
    const id = options.id;
    console.log('商品ID:', id);
    this.initNavBar();
    this.loadGoodsData(id);
    this.initSafeArea();       // 获取底部安全区
    this.checkFavoriteStatus(); // 查询当前商品是否已收藏（模拟）
  },

  // 初始化导航栏高度并计算 scroll-view 高度
  initNavBar() {
    const sysInfo = wx.getSystemInfoSync();
    const statusBarHeight = sysInfo.statusBarHeight || 20;
    const isIOS = /iOS/i.test(sysInfo.system);
    const navContentHeight = isIOS ? 44 : 48;
    
    const navTotalHeight = statusBarHeight + navContentHeight;
    let rightCapsuleSafePadding = '100px';
    try {
      const menuRect = wx.getMenuButtonBoundingClientRect();
      if (menuRect && menuRect.left) {
        const safe = sysInfo.windowWidth - menuRect.left;
        rightCapsuleSafePadding = `${safe}px`;
      }
    } catch(e) {}
    
    // 计算 scroll-view 高度 = 屏幕高度 - 导航栏总高度
    const scrollViewHeight = sysInfo.windowHeight - navTotalHeight;
    console.log(scrollViewHeight)

    this.setData({
      statusBarHeight,
      navTotalHeight,
      scrollViewHeight,
      rightCapsuleSafePadding
    });
  },

  // 获取底部安全区高度（单位 px）
  initSafeArea() {
    const sysInfo = wx.getSystemInfoSync();
    const safeAreaBottom = sysInfo.safeArea ? (sysInfo.screenHeight - sysInfo.safeArea.bottom) : 0;
    this.setData({ safeAreaBottom });
  },

  // 模拟商品数据（增加 sellerName）
  async loadGoodsData(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData = {
      images: [
        'https://picsum.photos/400/400?random=1',
        'https://picsum.photos/400/400?random=2',
        'https://picsum.photos/400/400?random=3'
      ],
      price: '129',
      condition: '9.5',
      title: '复古运动鞋 限量款 全新未拆',
      desc: '正品保证，支持专柜验货。鞋码42，颜色黑色。因尺码不合适转卖。',
      tradeWays: '面交, 快递, 自提',
      sellerAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      sellerName: '学姐好物铺',   // 模拟昵称
      sellerId: 'seller_001',
      comments: []
    };
    this.setData({ goodsInfo: mockData });
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 点击用户头像/昵称区域
  onAvatarTap() {
    const sellerId = this.data.goodsInfo.sellerId;
    wx.navigateTo({
      url: `/pages/user/user?userId=${sellerId}`,
      fail: () => wx.showToast({ title: '用户主页开发中', icon: 'none' })
    });
  },

  // 私信按钮
  // onMsgTap() {
  //   wx.showToast({ title: '私信功能开发中', icon: 'none' });
  // }
  
  // 查询收藏状态（对接后端）
  async checkFavoriteStatus() {
    // 模拟：从本地缓存或后端获取当前商品是否已收藏
    const favorited = wx.getStorageSync(`favor_${this.data.goodsInfo.id}`) || false;
    this.setData({ isFavorited: favorited });
  },

  // 切换收藏（点击星形）
  async onToggleFavorite() {
    const newStatus = !this.data.isFavorited;
    this.setData({ isFavorited: newStatus });
    // 调用后端接口（模拟）
    if (newStatus) {
      wx.showToast({ title: '已收藏', icon: 'success', duration: 1000 });
      // 实际调用：await wx.cloud.callFunction({ name: 'addFavorite', data: { goodsId: this.data.goodsInfo.id } })
      wx.setStorageSync(`favor_${this.data.goodsInfo.id}`, true);
    } else {
      wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 });
      wx.setStorageSync(`favor_${this.data.goodsInfo.id}`, false);
    }
  },

  // 点击立即购买
  onBuyNow() {
    const price = this.data.goodsInfo.price;
    // 可跳转至下单页面或弹出购买面板
    wx.showModal({
      title: '确认购买',
      content: `商品价格：¥${price}，是否立即购买？`,
      success(res) {
        if (res.confirm) {
          // 跳转订单确认页等
          wx.navigateTo({
            url: `/pages/order/confirm?goodsId=${this.data.goodsInfo.id}&price=${price}`,
            fail: () => wx.showToast({ title: '订单页开发中', icon: 'none' })
          });
        }
      }
    });
  }
});
