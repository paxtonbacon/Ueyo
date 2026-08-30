// components/reward-list/reward-list.js
Component({
  properties: {
    type: {
      type: String,
      value: 'reward'
    }
  },
  data: {
    list: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },
  lifetimes: {
    attached() {
      this.loadData(true);
    }
  },
  methods: {
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

    refreshData() {
      return this.loadData(true);
    },

    loadMoreData() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadData(false);
      }
    },

    // 调用云函数获取悬赏列表
    fetchDataFromCloud(page, pageSize) {
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'bounty/list',
          data: { page, pageSize }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '获取悬赏列表失败');
        }
        const cloudList = result.data.rewards_list || [];
        // 字段映射：云函数 → 组件模板
        const list = cloudList.map(item => ({
          id: item.id,
          image: item.firstPictureCDN || '',
          title: item.title || '',
          desc: item.title || '',
          minPrice: item.price ? item.price.min : 0,
          maxPrice: item.price ? item.price.max : 0,
          buyerId: item.sellerId || '',
          buyerAvatar: item.sellerAvatarCDN || '',
          buyerName: item.sellerName || ''
        }));
        return {
          list,
          hasMore: list.length >= pageSize
        };
      });
    },

    onBuyerTap(e) {
      const { buyerId, name, avatar } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/message/Message_detail/Message_detail?userId=${buyerId}&nickname=${encodeURIComponent(name || '')}&avatar=${encodeURIComponent(avatar || '')}`
      });
    },

    onCardTap(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/ueyo/reward-detail/reward-detail?id=${id}`,
        fail: () => wx.showToast({ title: '悬赏详情页开发中', icon: 'none' })
      });
    }
  }
});