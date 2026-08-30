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
  comments: [],  // 顶层，传给 comment-section
  postId: '',

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

  // 调用云函数获取商品详情
  async loadGoodsData(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'goods/detail',
          data: { GoodId: id }
        }
      });
      const result = res.result;
      if (result.code !== 0) {
        wx.showToast({ title: result.msg || '商品不存在', icon: 'none' });
        return;
      }
      const data = result.data;
      // 字段映射：云函数 → 页面模板
      const goodsInfo = {
        id: id,
        images: data.PictureCDN || [],
        price: data.price || '',
        condition: data.condition || '',
        title: data.title || '',
        desc: data.desc || '',
        tradeWays: data.tradeWays || '',
        sellerAvatar: data.sellerAvatarCDN || '',
        sellerName: data.sellerName || '',
        sellerId: data.sellerId || '',
        comments: data.comments || []
      };
      this.setData({
        goodsInfo,
        comments: data.comments || [],
        isFavorited: data.is_favorited || false
      });
    } catch (err) {
      console.error('加载商品详情失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  // 返回上一页
  onBack() {
    wx.navigateBack();
  },

  // 点击用户头像/昵称 → 跳转聊天页
  onAvatarTap() {
    const info = this.data.goodsInfo;
    wx.navigateTo({
      url: `/pages/message/Message_detail/Message_detail?userId=${info.sellerId}&nickname=${encodeURIComponent(info.sellerName || '')}&avatar=${encodeURIComponent(info.sellerAvatar || '')}`
    });
  },

  // 私信按钮
  // onMsgTap() {
  //   wx.showToast({ title: '私信功能开发中', icon: 'none' });
  // }
  
  // 查询收藏状态（已由云函数 goods/detail 返回 is_favorited）
  async checkFavoriteStatus() {
    // isFavorited 已在 loadGoodsData 中设置
  },

  // 切换收藏
  async onToggleFavorite() {
    const newStatus = !this.data.isFavorited;
    this.setData({ isFavorited: newStatus });
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'user/toggleFavorite',
          data: { goodsId: this.data.goodsInfo.id }
        }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: res.result.data?.message || (newStatus ? '已收藏' : '已取消收藏'), icon: 'success', duration: 1000 });
      }
    } catch (err) {
      // 回滚状态
      this.setData({ isFavorited: !newStatus });
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 点击立即购买 → 创建订单（需认证，且不能买自己的）
  async onBuyNow() {
    const app = getApp();
    const g = app && app.globalData;
    // 通过云函数获取当前用户 openid，校验不能买自己的商品
    try {
      const pingRes = await wx.cloud.callFunction({ name: 'backend', data: { action: 'test/ping' } });
      const myOpenId = (pingRes.result && pingRes.result.data && pingRes.result.data.openid) || '';
      const sellerId = this.data.goodsInfo.sellerId;
      if (myOpenId && sellerId && myOpenId === sellerId) {
        wx.showModal({
          title: '提示',
          content: '不能购买自己发布的商品',
          showCancel: false,
          confirmText: '知道了'
        });
        return;
      }
    } catch (e) {
      console.error('获取 openid 失败:', e);
    }

    if (!g || !g.isLogin || g.authLevel < 2) {
      wx.showModal({
        title: '需要认证',
        content: '请先完成邮箱验证，才能购买商品',
        confirmText: '去验证',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/register_login/Email_Val/Email_Val' });
          }
        }
      });
      return;
    }
    const goodsInfo = this.data.goodsInfo;
    wx.showModal({
      title: '确认购买',
      content: `商品：${goodsInfo.title}\n价格：¥${goodsInfo.price}`,
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'backend',
              data: {
                action: 'order/create',
                data: {
                  goodsId: goodsInfo.id,
                  tradeType: goodsInfo.tradeWays || '面交/快递均可'
                }
              }
            });
            const ret = result.result;
            if (ret.code === 0) {
              wx.showToast({ title: '下单成功', icon: 'success' });
              setTimeout(() => {
                wx.navigateTo({
                  url: `/pages/self/Order/Order`
                });
              }, 1000);
            } else {
              wx.showToast({ title: ret.msg || '下单失败', icon: 'none' });
            }
          } catch (err) {
            console.error('创建订单失败:', err);
            wx.showToast({ title: '网络异常，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  onRefreshGoods() {
    if (this.data.goodsInfo.id) this.loadGoodsData(this.data.goodsInfo.id);
  }
});
