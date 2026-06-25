// pages/ueyo/reward-detail/reward-detail.js
// pages/reward/detail/detail.js
Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    scrollViewHeight: 0,
    isFavorited: false,
    safeAreaBottom: 0,
    rightCapsuleSafePadding: '100px',
    comments: [],   // 顶层，传给 comment-section
    postId: '',
    rewardInfo: {
      images: [],
      minPrice: '',
      maxPrice: '',
      title: '',
      desc: '',
      tradeWays: '',
      buyerAvatar: '',
      buyerName: '',
      buyerId: '',
      comments: []
    }
  },

  onLoad(options) {
    const id = options.id;
    console.log('悬赏ID:', id);
    this.initNavBar();
    this.loadRewardData(id);
    this.initSafeArea();
    this.checkFavoriteStatus();
  },

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
    const scrollViewHeight = sysInfo.windowHeight - navTotalHeight;
    this.setData({
      statusBarHeight,
      navTotalHeight,
      scrollViewHeight,
      rightCapsuleSafePadding
    });
  },

  initSafeArea() {
    const sysInfo = wx.getSystemInfoSync();
    const safeAreaBottom = sysInfo.safeArea ? (sysInfo.screenHeight - sysInfo.safeArea.bottom) : 0;
    this.setData({ safeAreaBottom });
  },

  // 调用云函数获取悬赏详情
  async loadRewardData(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'bounty/detail',
          data: { RewardId: id }
        }
      });
      const result = res.result;
      if (result.code !== 0) {
        wx.showToast({ title: result.msg || '悬赏不存在', icon: 'none' });
        return;
      }
      const data = result.data;
      const rewardInfo = {
        id: id,
        images: data.PictureCDN || [],
        minPrice: data.minprice || '',
        maxPrice: data.maxprice || '',
        title: data.title || '',
        desc: data.desc || '',
        tradeWays: data.tradeWays || '',
        buyerAvatar: data.buyerAvatarCDN || '',
        buyerName: data.buyerName || '',
        buyerId: data.buyerId || '',
        comments: data.comments || []
      };
      this.setData({
        rewardInfo,
        comments: data.comments || [],
        isFavorited: data.is_favorite || false
      });
    } catch (err) {
      console.error('加载悬赏详情失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
  },

  onBack() {
    wx.navigateBack();
  },

  onAvatarTap() {
    const buyerId = this.data.rewardInfo.buyerId;
    wx.navigateTo({
      url: `/pages/user/user?userId=${buyerId}`,
      fail: () => wx.showToast({ title: '用户主页开发中', icon: 'none' })
    });
  },

  checkFavoriteStatus() {
    // isFavorited 已在 loadRewardData 中设置
  },

  async onToggleFavorite() {
    const newStatus = !this.data.isFavorited;
    this.setData({ isFavorited: newStatus });
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'user/toggleFavorite',
          data: { goodsId: this.data.rewardInfo.id }
        }
      });
      if (res.result.code === 0) {
        wx.showToast({ title: res.result.data?.message || (newStatus ? '已收藏' : '已取消收藏'), icon: 'success', duration: 1000 });
      }
    } catch (err) {
      this.setData({ isFavorited: !newStatus });
      wx.showToast({ title: '操作失败', icon: 'none' });
    }
  },

  // 确认接单（调用云函数 bounty_order/create）
  onAcceptOrder() {
    const app = getApp();
    const g = app && app.globalData;
    if (!g || !g.isLogin || g.authLevel < 2) {
      wx.showModal({
        title: '需要认证',
        content: '请先完成邮箱验证，才能接取悬赏',
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
    wx.showModal({
      title: '确认接单',
      content: '您确定要接取此悬赏吗？接单后需按照约定完成交易。',
      confirmText: '确定接单',
      cancelText: '再想想',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await wx.cloud.callFunction({
              name: 'backend',
              data: {
                action: 'bounty_order/create',
                data: { bountyId: this.data.rewardInfo.id }
              }
            });
            const ret = result.result;
            if (ret.code === 0) {
              wx.showToast({ title: '接单成功', icon: 'success', duration: 2000 });
            } else {
              wx.showToast({ title: ret.msg || '接单失败', icon: 'none' });
            }
          } catch (err) {
            console.error('接单失败:', err);
            wx.showToast({ title: '网络异常，请重试', icon: 'none' });
          }
        }
      }
    });
  },

  onRefreshReward() {
    if (this.data.rewardInfo.id) this.loadRewardData(this.data.rewardInfo.id);
  }
});