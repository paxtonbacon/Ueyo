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

  async loadRewardData(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const mockData = {
      images: [
        'https://picsum.photos/400/400?random=10',
        'https://picsum.photos/400/400?random=11',
        'https://picsum.photos/400/400?random=12'
      ],
      minPrice: '50',
      maxPrice: '200',
      title: '求购二手自行车一辆',
      desc: '山地车或普通代步车均可，100元左右，希望七八成新，能正常骑行。',
      tradeWays: '面交, 自提',
      buyerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      buyerName: '热心同学',
      buyerId: 'buyer_001',
      comments: []
    };
    this.setData({ rewardInfo: mockData });
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
    const favorited = wx.getStorageSync(`favor_reward_${this.data.rewardInfo.id}`) || false;
    this.setData({ isFavorited: favorited });
  },

  async onToggleFavorite() {
    const newStatus = !this.data.isFavorited;
    this.setData({ isFavorited: newStatus });
    if (newStatus) {
      wx.showToast({ title: '已收藏', icon: 'success', duration: 1000 });
      wx.setStorageSync(`favor_reward_${this.data.rewardInfo.id}`, true);
    } else {
      wx.showToast({ title: '已取消收藏', icon: 'none', duration: 1000 });
      wx.setStorageSync(`favor_reward_${this.data.rewardInfo.id}`, false);
    }
  },

  // 确认接单（带弹窗确认）
  onAcceptOrder() {
    wx.showModal({
      title: '确认接单',
      content: '您确定要接取此悬赏吗？接单后需按照约定完成交易。',
      confirmText: '确定接单',
      cancelText: '再想想',
      success: (res) => {
        if (res.confirm) {
          // 此处调用后端接单接口
          wx.showToast({
            title: '接单成功',
            icon: 'success',
            duration: 2000
          });
          // 可跳转至订单页面或刷新状态
          // setTimeout(() => {
          //   wx.navigateBack();
          // }, 2000);
        }
      }
    });
  }
});