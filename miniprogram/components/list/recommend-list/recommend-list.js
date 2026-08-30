// components/list/recommend-list/recommend-list.js
Component({
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

    // 调用云函数获取推荐（商品+悬赏混排）
    async fetchDataFromCloud(page, pageSize) {
      const halfSize = Math.ceil(pageSize / 2);
      const [goodsRes, bountyRes] = await Promise.all([
        wx.cloud.callFunction({ name: 'backend', data: { action: 'goods/list', data: { page, pageSize: halfSize } } }),
        wx.cloud.callFunction({ name: 'backend', data: { action: 'bounty/list', data: { page, pageSize: halfSize } } })
      ]);

      const list = [];

      // 映射商品
      const goodsData = goodsRes.result;
      if (goodsData.code === 0) {
        (goodsData.data.goods_list || []).forEach(item => {
          list.push({
            type: 'goods',
            id: item.id,
            image: item.firstPictureCDN || '',
            title: item.title || '',
            price: item.price,
            condition: item.condition || '',
            sellerId: item.sellerId || '',
            sellerAvatar: item.sellerAvatarCDN || '',
            sellerName: item.sellerName || ''
          });
        });
      }

      // 映射悬赏
      const bountyData = bountyRes.result;
      if (bountyData.code === 0) {
        (bountyData.data.rewards_list || []).forEach(item => {
          list.push({
            type: 'reward',
            id: item.id,
            image: item.firstPictureCDN || '',
            title: item.title || '',
            desc: '',
            minPrice: item.price ? item.price.min : 0,
            maxPrice: item.price ? item.price.max : 0,
            buyerId: item.sellerId || '',
            buyerAvatar: item.sellerAvatarCDN || '',
            buyerName: item.sellerName || ''
          });
        });
      }

      // 混排后返回
      return {
        list,
        hasMore: list.length >= pageSize
      };
    },

    onSellerTap(e) {
      const { sellerId, name, avatar } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/message/Message_detail/Message_detail?userId=${sellerId}&nickname=${encodeURIComponent(name || '')}&avatar=${encodeURIComponent(avatar || '')}`
      });
    },

    onBuyerTap(e) {
      const { buyerId, name, avatar } = e.currentTarget.dataset;
      wx.navigateTo({
        url: `/pages/message/Message_detail/Message_detail?userId=${buyerId}&nickname=${encodeURIComponent(name || '')}&avatar=${encodeURIComponent(avatar || '')}`
      });
    },

    onCardTap(e) {
      const { id, type } = e.currentTarget.dataset;
      if (type === 'goods') {
        wx.navigateTo({
          url: `/pages/ueyo/goods-detail/goods-detail?id=${id}`,
          fail: () => wx.showToast({ title: '商品详情页开发中', icon: 'none' })
        });
      } else {
        wx.navigateTo({
          url: `/pages/ueyo/reward-detail/reward-detail?id=${id}`,
          fail: () => wx.showToast({ title: '悬赏详情页开发中', icon: 'none' })
        });
      }
    }
  }
});