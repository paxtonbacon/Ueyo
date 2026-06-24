// components/recommend-list/recommend-list.js
Component({
  properties: {
    // 可接收外部传入的筛选条件，如 type: 'goods' / 'reward'
    type: {
      type: String,
      value: 'goods'
    }
  },
  data: {
    list: [],        // 卡片数据列表
    page: 1,         // 当前页码
    pageSize: 10,    // 每页数量
    loading: false,  // 是否正在加载
    hasMore: true    // 是否还有更多数据
  },
  lifetimes: {
    attached() {
      this.loadData(true);
    }
  },
  methods: {
    // 加载数据：refresh=true 刷新，false 加载更多
    async loadData(refresh) {
      if (this.data.loading) return;
      this.setData({ loading: true });

      try {
        const page = refresh ? 1 : this.data.page;
        const res = await this.fetchDataFromCloud(page, this.data.pageSize);
        
        let newList = refresh ? res.list : [...this.data.list, ...res.list];
        this.setData({
          list: newList,
          page: page + 1,
          hasMore: res.hasMore,
          loading: false
        });
      } catch (err) {
        console.error('加载失败', err);
        this.setData({ loading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    // 供父组件调用的刷新方法
    refreshData() {
      return this.loadData(true);
    },

    // 供父组件调用的加载更多方法
    loadMoreData() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadData(false);
      }
    },

    // 调用云函数获取商品列表
    fetchDataFromCloud(page, pageSize) {
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'goods/list',
          data: { page, pageSize }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '获取商品列表失败');
        }
        const cloudList = result.data.goods_list || [];
        // 字段映射：云函数 → 组件模板
        const list = cloudList.map(item => ({
          id: item.id,
          image: item.firstPictureCDN || '',
          title: item.title || '',
          price: item.price,
          condition: item.condition || '',
          sellerId: item.sellerId || '',
          sellerAvatar: item.sellerAvatarCDN || '',
          sellerName: item.sellerName || ''
        }));
        return {
          list,
          hasMore: list.length >= pageSize
        };
      });
    },

    // 点击卖家区域，跳转卖家主页
    onSellerTap(e) {
      const sellerId = e.currentTarget.dataset.sellerId;
      wx.navigateTo({
        url: `/pages/seller/seller?sellerId=${sellerId}`,
        fail: () => {
          wx.showToast({ title: '卖家主页开发中', icon: 'none' });
        }
      });
    },
    
    // 在 methods 中添加
  onCardTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/ueyo/goods-detail/goods-detail?id=${id}`,
      fail: () => {
        wx.showToast({ title: '商品详情页开发中', icon: 'none' });
      }
    });
  }
  }
});