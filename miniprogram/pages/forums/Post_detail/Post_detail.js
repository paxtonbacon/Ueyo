// pages/forums/Post_detail/Post_detail.js
// pages/forums/post_detail/post_detail.js
Page({
  data: {
    statusBarHeight: 20,
    navTotalHeight: 64,
    rightCapsuleSafePadding: '100px',
    safeAreaBottom: 0,
    bottomBarHeight: 100, // 底部栏高度（px）
    postId: '',
    postInfo: {
      images: [],
      title: '',
      content: '',
      category: '',
      postTime: '',
      userAvatar: '',
      userName: '',
      likeCount: 0,
      collectCount: 0,
      commentCount: 0
    },
    isPostLiked: false,
    isCollected: false
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ postId: id });
    this.initNavBar();
    this.initSafeArea();
    this.loadPostData(id);
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
    this.setData({ statusBarHeight, navTotalHeight, rightCapsuleSafePadding });
  },

  initSafeArea() {
    const sysInfo = wx.getSystemInfoSync();
    const safeAreaBottom = sysInfo.safeArea ? (sysInfo.screenHeight - sysInfo.safeArea.bottom + 5) : 5;
    // 底部栏高度 = 内容高度 + 安全区，这里内容约80px，加上安全区
    const bottomBarHeight = 33;
    this.setData({ safeAreaBottom, bottomBarHeight });
  },

  // 模拟获取帖子数据（后续替换为真实接口）
  async loadPostData(id) {
    await new Promise(resolve => setTimeout(resolve, 300));
    // mock 数据
    const mockPost = {
      images: [
        'https://picsum.photos/400/400?random=101',
        'https://picsum.photos/400/400?random=102',
        'https://picsum.photos/400/400?random=103'
      ],
      title: '终于收到了心心念念的宝贝！',
      content: '这个商品真的太棒了，物流很快，包装也很严实。使用体验超出预期，强烈推荐给大家！如果有兴趣可以私信我交流。',
      category: '好物分享',
      postTime: '2025-03-15 14:30',
      userAvatar: 'https://randomuser.me/api/portraits/women/68.jpg',
      userName: '小确幸学姐',
      likeCount: 128,
      collectCount: 45,
      commentCount: 23
    };
    this.setData({ postInfo: mockPost });
    // 异步获取评论组件并加载数据（组件内部自己加载）
  },

  onBack() {
    wx.navigateBack();
  },

  onAvatarTap() {
    const userId = this.data.postInfo.userId || 'user_123';
    wx.navigateTo({
      url: `/pages/user-profile/user-profile?uid=${userId}`,
      fail: () => wx.showToast({ title: '用户主页开发中', icon: 'none' })
    });
  },

  onCategoryTap() {
    const category = this.data.postInfo.category;
    wx.navigateTo({
      url: `/pages/forums/category/category?name=${category}`,
      fail: () => wx.showToast({ title: '分类页开发中', icon: 'none' })
    });
  },

  // 帖子点赞
  onLikePost() {
    const newLiked = !this.data.isPostLiked;
    const delta = newLiked ? 1 : -1;
    this.setData({
      isPostLiked: newLiked,
      'postInfo.likeCount': this.data.postInfo.likeCount + delta
    });
    // 调用后端接口
    console.log('帖子点赞状态:', newLiked);
  },

  // 帖子收藏
  onCollectPost() {
    const newCollected = !this.data.isCollected;
    const delta = newCollected ? 1 : -1;
    this.setData({
      isCollected: newCollected,
      'postInfo.collectCount': this.data.postInfo.collectCount + delta
    });
    console.log('帖子收藏状态:', newCollected);
  },

  // 底部评论按钮点击（全局评论）
  onShowGlobalComment() {
    const commentSection = this.selectComponent('#commentSection');
    if (commentSection) {
      commentSection.showCommentInput(null); // 无回复目标
    }
  },

  // 评论组件触发的回复事件（回复某条评论）
  onReplyComment(e) {
    const { commentId, userName } = e.detail;
    const commentSection = this.selectComponent('#commentSection');
    if (commentSection) {
      commentSection.showCommentInput({ id: commentId, userName });
    }
  },

  // 评论点赞
  onCommentLike(e) {
    const { commentId, isLiked } = e.detail;
    console.log('评论点赞:', commentId, isLiked);
    // 实际调用接口更新
  }
});