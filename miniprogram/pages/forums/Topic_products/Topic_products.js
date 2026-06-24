// pages/forums/Topic_products/Topic_products.js
Page({
  data: {
    tabs: [
      { name: '话题' },
      { name: '商品' }
    ]
  },

  onLoad(options) {
    const { id } = options;
    if (id) {
      this.setData({ topicId: id });
      // 可以通过 selectComponent 或属性绑定的方式通知子组件
    }
  },

  onTabChange(e) {
    const { index } = e.detail;
    console.log('切换到Tab:', index);
  },

  // 下拉刷新（由 tab-container 触发）
  onRefresh(e) {
    const { tabIndex } = e.detail;
    const componentId = tabIndex === 0 ? '#postSets' : '#goodsList';
    const child = this.selectComponent(componentId);
    if (child && child.refreshData) {
      child.refreshData().then(() => {
        // 刷新完成后通知容器结束动画
        const tabContainer = this.selectComponent('.tab-container'); // 需要给组件添加 class 或 id
        if (tabContainer) tabContainer.stopRefresh(tabIndex);
      });
    } else {
      // 若子组件没有 refreshData 方法，直接结束刷新
      const tabContainer = this.selectComponent('.tab-container');
      if (tabContainer) tabContainer.stopRefresh(tabIndex);
    }
  },

  // 上拉加载更多
  onLoadMore(e) {
    const { tabIndex } = e.detail;
    const componentId = tabIndex === 0 ? '#postSets' : '#goodsList';
    const child = this.selectComponent(componentId);
    if (child && child.loadMoreData) {
      child.loadMoreData();
    }
  },

  // 悬浮球点击跳转
  onFabTap() {
    wx.navigateTo({
      url: `/pages/add/Post_add/Post_add?topicId=${this.data.topicId}`,
      fail: () => {
        wx.showToast({ title: '发布页开发中', icon: 'none' });
      }
    });
  }
});