// pages/ueyo/Home/Home.js
Page({
  data: {
    tabs: [
      { name: '推荐' },
      { name: '商品' },
      { name: '悬赏' }
    ]
  },
  onTabChange(e) {
    console.log('切换到Tab:', e.detail.index);
  },
  // 下拉刷新（由组件触发）
  onRefresh(e) {
    const { tabIndex } = e.detail;
    const componentId = ['recommendList', 'goodsList', 'rewardList'][tabIndex];
    const child = this.selectComponent(`#${componentId}`);
    if (child && child.refreshData) {
      child.refreshData().then(() => {
        // 刷新完成后通知组件结束刷新动画
        const tabContainer = this.selectComponent('#tabContainer'); // 需要给组件设置 id
        if (tabContainer) tabContainer.stopRefresh(tabIndex);
      });
    }
  },
  // 上拉加载更多
  onLoadMore(e) {
    const { tabIndex } = e.detail;
    const componentId = ['recommendList', 'goodsList', 'rewardList'][tabIndex];
    const child = this.selectComponent(`#${componentId}`);
    if (child && child.loadMoreData) {
      child.loadMoreData();
    }
  }
});