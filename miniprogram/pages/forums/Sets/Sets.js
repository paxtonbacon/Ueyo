// pages/forums/Sets/Sets.js
Page({
  data: {
    tabs: [
      { name: '话题集' },
      { name: '帖子集' }
    ]
  },

  onLoad(options) {},

  onReady() {
    // 获取子组件实例
    this.topicComponent = this.selectComponent('.topic-component');
    this.postComponent = this.selectComponent('.post-component');
  },

  // ========== tab-container 事件处理 ==========
  _currentTab: 0,

  onTabChange(e) {
    const { index } = e.detail;
    this._currentTab = index;
    if (index === 0 && this.topicComponent?.refresh) {
      this.topicComponent.refresh();
    } else if (index === 1 && this.postComponent?.refresh) {
      this.postComponent.refresh();
    }
  },

  // 下拉刷新（由 tab-container 触发）
  onRefresh(e) {
    const { done } = e.detail || {};
    const currentTab = this._currentTab || 0; // 修正：使用 this._currentTab
    let refreshPromise = null;
    if (currentTab === 0 && this.topicComponent?.refresh) {
      refreshPromise = this.topicComponent.refresh();
    } else if (currentTab === 1 && this.postComponent?.refresh) {
      refreshPromise = this.postComponent.refresh();
    }
    if (refreshPromise && refreshPromise.then) {
      refreshPromise.finally(() => done && done());
    } else {
      done && done();
    }
  },

  // 上拉加载更多（由 tab-container 触发）
  onLoadMore(e) {
    const { done } = e.detail || {};
    const currentTab = this._currentTab || 0;
    let loadPromise = null;
    if (currentTab === 0 && this.topicComponent?.loadMore) {
      // 话题组件一般没有分页，可忽略
      loadPromise = this.topicComponent.loadMore && this.topicComponent.loadMore();
    } else if (currentTab === 1 && this.postComponent?.loadMoreData) {
      loadPromise = this.postComponent.loadMoreData();
    }
    if (loadPromise && loadPromise.then) {
      loadPromise.finally(() => done && done());
    } else {
      done && done();
    }
  },

  // ========== 子组件事件 ==========

  // 话题点击（topic 组件内部已跳转，此处仅做埋点）
  onTopicTap(e) {
    const { topic } = e.detail;     // 假设 e.detail = { topic: { id: 'xxx', name: '...' } }
    const id = topic.id;            // 或者直接 const { id } = topic
    console.log('点击话题:', topic);
    wx.navigateTo({
      url: `/pages/forums/Topic_products/Topic_products?id=${id}&title=${topic.name}`
    });
    // 可以取消下面的 toast 或仅作为 fallback
    // wx.showToast({ title: '话题页面待开发', icon: 'none' });
  },

  // 帖子卡片点击
  onCardTap(e) {
    const { id } = e.detail;        // 修正：子组件传的是 { id }
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
    const { id, isLiked } = e.detail;   // 修正：子组件传的是 { id, isLiked }
    console.log(`帖子 ${id} 点赞状态变为: ${isLiked}`);
    // 调用云函数同步后端...
  }
});