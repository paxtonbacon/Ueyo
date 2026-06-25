// pages/self/Favorites/Favorites.js
Page({
  data: {
    tabs: [
      { name: '商品' },
      { name: '悬赏' },
      { name: '帖子' },
      { name: '话题' }
    ],
    currentMainTab: 0,
    // 可根据需要添加其他状态
  },

  onLoad() {
    // 可做额外初始化
  },

  // Tab切换事件（由 tab-container 触发）
  onTabChange(e) {
    const { index } = e.detail;
    this.setData({ currentMainTab: index });
  },

  // 下拉刷新（由 tab-container 触发）
  onRefresh(e) {
    const { tabIndex } = e.detail;
    // 根据 tabIndex 调用对应子组件的刷新方法
    const componentMap = ['goodsList', 'rewardList', 'postList', 'topicList'];
    const componentId = componentMap[tabIndex];
    const child = this.selectComponent(`#${componentId}`);
    if (child && child.refreshData) {
      child.refreshData().then(() => {
        const container = this.selectComponent('.tab-container-no-space'); // 需添加 class
        if (container && container.stopRefresh) {
          container.stopRefresh(tabIndex);
        }
      });
    } else {
      // 如果子组件没有 refreshData，直接结束刷新
      const container = this.selectComponent('.tab-container-no-space');
      if (container && container.stopRefresh) {
        container.stopRefresh(tabIndex);
      }
    }
  },

  // 上拉加载更多（由 tab-container 触发）
  onLoadMore(e) {
    const { tabIndex } = e.detail;
    const componentMap = ['goodsList', 'rewardList', 'postList', 'topicList'];
    const componentId = componentMap[tabIndex];
    const child = this.selectComponent(`#${componentId}`);
    if (child && child.loadMoreData) {
      child.loadMoreData();
    }
  },

  // 帖子卡片点击
  onCardTap(e) {
    const { id } = e.detail;
    wx.navigateTo({
      url: `/pages/forums/Post_detail/Post_detail?id=${id}`
    });
  },

  // 帖子用户头像/昵称点击
  onUserTap(e) {
    const { userId } = e.detail;
    wx.navigateTo({
      url: `/pages/user-profile/user-profile?uid=${userId}`
    });
  },

  // 点赞事件
  onLike(e) {
    const { id, isLiked } = e.detail;
    console.log(`帖子 ${id} 点赞状态变为: ${isLiked}`);
  },

  // 话题点击
  onTopicTap(e) {
    const { topic } = e.detail;
    const id = topic.id;
    console.log('点击话题:', topic);
    wx.navigateTo({
      url: `/pages/forums/Topic_products/Topic_products?id=${id}&title=${topic.name}`
    });
  },

  // 以下是各个子组件的刷新/加载更多事件（如果组件内部未触发，可留空）
  onGoodsRefresh() {},
  onGoodsLoadMore() {},
  onRewardRefresh() {},
  onRewardLoadMore() {},
  onPostRefresh() {},
  onPostLoadMore() {},
  onTopicRefresh() {},
  onTopicLoadMore() {},
});