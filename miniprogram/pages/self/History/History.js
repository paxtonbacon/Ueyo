// pages/self/History/History.js
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

  // 列表项点击（商品/悬赏/帖子）
  onItemTap(e) {
    const { item, type } = e.detail;
    console.log('点击浏览记录', type, item);
    // 根据类型跳转不同详情页
    wx.showToast({ title: `查看${type}详情`, icon: 'none' });
  },

  // 用户头像点击（仅帖子）
  onUserTap(e) {
    const { userId } = e.detail;
    console.log('点击用户', userId);
    wx.showToast({ title: '查看用户主页', icon: 'none' });
  },

  // 点赞（仅帖子）
  onLike(e) {
    const { id, isLiked } = e.detail;
    console.log('点赞', id, isLiked);
  },

  // 话题点击
  onTopicTap(e) {
    const { topic } = e.detail;
    console.log('点击话题', topic);
    // 可根据 topic.id 跳转
    wx.showToast({ title: `进入话题：${topic.title}`, icon: 'none' });
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