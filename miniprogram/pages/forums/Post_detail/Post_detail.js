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

  // 调用云函数获取帖子详情
  async loadPostData(id) {
    try {
      const res = await wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'social/post/detail',
          data: { PostId: id }
        }
      });
      const result = res.result;
      if (result.code !== 0) {
        wx.showToast({ title: result.msg || '帖子不存在', icon: 'none' });
        return;
      }
      const data = result.data;
      const postInfo = {
        images: data.PictureCDN || [],
        title: data.title || '',
        content: data.content || '',
        category: data.topic || '',
        postTime: data.time || '',
        userAvatar: data.posterAvatarCDN || '',
        userName: data.posterName || '',
        likeCount: data.likeCount || 0,
        collectCount: data.favoriteCount || 0,
        commentCount: data.commentsCount || 0
      };
      this.setData({
        postInfo,
        isPostLiked: data.is_liked || false,
        isCollected: data.is_favorited || false
      });
    } catch (err) {
      console.error('加载帖子详情失败:', err);
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    }
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