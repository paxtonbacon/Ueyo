// components/tab-container/tab-container.js
Component({
  options: {
    multipleSlots: true
  },
  properties: {
    // Tab 列表 [{ name: '推荐' }, { name: '商品' }]
    tabs: {
      type: Array,
      value: []
    },
    // 当前选中的 Tab 索引（支持外部控制）
    current: {
      type: Number,
      value: 0
    },
    // 是否显示左侧按钮
    showLeft: {
      type: Boolean,
      value: true
    },
    // 左侧按钮是否为返回按钮（true=返回，false=菜单）
    isBack: {
      type: Boolean,
      value: false
    },
    // 是否显示右侧搜索按钮
    showRight: {
      type: Boolean,
      value: true
    },
    // 右侧搜索按钮点击后的跳转路径（如果提供，直接跳转；否则触发 search 事件）
    searchUrl: {
      type: String,
      value: ''
    },
    // Tab 标签均匀分布（每个标签 flex:1）
    equalWidth: {
      type: Boolean,
      value: true
    }
  },
  data: {
    statusBarHeight: 20,
    // swiperHeight: 0,
    currentTab: 0,
    scrollTops: [],          // 每个 Tab 的滚动位置
    refreshTriggered: [],    // 每个 Tab 的下拉刷新状态
    sidebarVisible: false,
    tabFlex: '1'             // 用于控制 tab 是否均匀分布
  },
  lifetimes: {
    attached() {
      this.initNavBar();
      // this.initSwiperHeight();
      this.initScrollTops();
      // 监听窗口尺寸变化
      wx.onWindowResize((res) => {
        this.initNavBar();      // 状态栏高度可能变化（如折叠屏）
        // this.initSwiperHeight();
      });
    },
    detached() {
      // 确保在组件完全渲染后再次计算（防止某些机型延迟）
      // this.initSwiperHeight();
      wx.offWindowResize();
    }
  },
  observers: {
    'tabs': function() {
      this.initScrollTops();
    },
    'current': function(val) {
      if (val !== this.data.currentTab) {
        this.setData({ currentTab: val });
      }
    },
    'equalWidth': function(val) {
      this.setData({ tabFlex: val ? '1' : '0 0 auto' });
    }
  },
  methods: {
    initNavBar() {
      const sysInfo = wx.getSystemInfoSync();
      const statusBarHeight = sysInfo.statusBarHeight || 20;
      const isIOS = /iOS/i.test(sysInfo.system);
      const navContentHeight = isIOS ? 44 : 48;
      const navTotalHeight = statusBarHeight + navContentHeight;
      
      // 获取右侧胶囊位置，用于计算右边距（规避胶囊）
      const menuRect = wx.getMenuButtonBoundingClientRect();
      const rightMargin = sysInfo.windowWidth - menuRect.left + 80;
      // console.log(rightMargin)
      
      this.setData({
        statusBarHeight,
        navTotalHeight,
        rightMargin
      });
    },
    
    // initSwiperHeight() {
    //   const sysInfo = wx.getSystemInfoSync();
    //   const windowHeight = sysInfo.windowHeight; // 已自动排除原生 tabBar 高度
    //   const swiperHeight = windowHeight - this.data.navTotalHeight;
    //   this.setData({ swiperHeight });
    // },
    // 初始化滚动位置数组和刷新状态数组
    initScrollTops() {
      const len = this.properties.tabs.length;
      if (len === 0) return;
      this.setData({
        scrollTops: new Array(len).fill(0),
        refreshTriggered: new Array(len).fill(false)
      });
    },
    // 点击 Tab 标签
    onTabClick(e) {
      const index = e.currentTarget.dataset.index;
      if (this.data.currentTab === index) return;
      this.setData({ currentTab: index });
      this.triggerEvent('tabchange', { index });
    },
    // 滑动 Swiper
    onSwiperChange(e) {
      const index = e.detail.current;
      if (this.data.currentTab === index) return;
      this.setData({ currentTab: index });
      this.triggerEvent('tabchange', { index });
    },
    // 记录滚动位置
    onScroll(e) {
      if (this.scrollTimer) clearTimeout(this.scrollTimer);
      this.scrollTimer = setTimeout(() => {
        const tabIndex = e.currentTarget.dataset.tab;
        const scrollTop = e.detail.scrollTop;
        const newScrollTops = [...this.data.scrollTops];
        newScrollTops[tabIndex] = scrollTop;
        this.setData({ scrollTops: newScrollTops });
      }, 150); // 滚动停止 150ms 后记录
    },
    // 上拉加载更多
    onLoadMore(e) {
      const tabIndex = e.currentTarget.dataset.tab;
      this.triggerEvent('loadmore', { tabIndex });
    },
    // 下拉刷新
    onPullRefresh(e) {
      const tabIndex = e.currentTarget.dataset.tab;
      const newRefresh = [...this.data.refreshTriggered];
      newRefresh[tabIndex] = true;
      this.setData({ refreshTriggered: newRefresh });
      this.triggerEvent('refresh', { tabIndex });
    },
    // 左侧按钮点击（返回或菜单）
    onLeftTap() {
      if (this.properties.isBack) {
        wx.navigateBack();
        this.triggerEvent('back');
      } else {
        this.setData({ sidebarVisible: true });
        this.triggerEvent('menu');
      }
    },
    // 关闭侧边栏
    onCloseSidebar() {
      this.setData({ sidebarVisible: false });
    },
    // 右侧搜索按钮点击
    onSearchTap() {
      if (this.properties.searchUrl) {
        wx.navigateTo({ url: this.properties.searchUrl });
      } else {
        this.triggerEvent('search');
      }
    },
    // 供父页面调用的方法：结束下拉刷新
    stopRefresh(tabIndex) {
      const newRefresh = [...this.data.refreshTriggered];
      newRefresh[tabIndex] = false;
      this.setData({ refreshTriggered: newRefresh });
    },
    // 重置某个 Tab 的滚动位置到顶部
    resetScrollTop(tabIndex) {
      const newTops = [...this.data.scrollTops];
      newTops[tabIndex] = 0;
      this.setData({ scrollTops: newTops });
    },
    // 侧边栏跳转
    goToProfile() {
      wx.showToast({
        title: '跳转个人资料'
      });
    },
    goToSettings() {
      // wx.navigateTo({ url: '/pages/settings/settings' });
      wx.showToast({
        title: '跳转设置'
      })
    }
  }
});