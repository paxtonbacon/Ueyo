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

    fetchDataFromCloud(page, pageSize) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const hasMore = page < 5;
          const list = [];
          const start = (page - 1) * pageSize;
          
          const goodsTitles = ['复古运动鞋', '简约双肩包', '纯棉T恤', '牛仔裤', '棒球帽', '帆布鞋', '卫衣', '休闲裤', '手表', '太阳镜'];
          const rewardTitles = ['求购二手自行车', '收一台笔记本电脑', '求租校园卡', '买考研资料', '收iPhone12', '求购电动车', '收购旧书', '求带饭卡'];
          const rewardDescs = ['八九成新即可', '预算充足，要求无修', '长期使用，诚信求租', '全套笔记最好', '原装无拆修', '续航好', '教材教辅', '价格好商量'];
          
          for (let i = 1; i <= pageSize; i++) {
            const id = start + i;
            const isGoods = Math.random() > 0.5;
            
            // 随机图片（商品和悬赏都用同一来源）
            const imgId = Math.floor(Math.random() * 200);
            const image = `https://picsum.photos/300/200?random=${imgId}`;
            
            if (isGoods) {
              const title = `${goodsTitles[id % goodsTitles.length]}`;
              const price = (Math.random() * 470 + 30).toFixed(0);
              const condition = (Math.random() * 4 + 6).toFixed(1);
              const sellerId = `seller_${id}`;
              const avatarId = Math.floor(Math.random() * 100);
              const sellerAvatar = `https://randomuser.me/api/portraits/women/${avatarId}.jpg`;
              const sellerNames = ['淘淘小店', '小王的铺', '老张闲置', '学姐好物', '校园跳蚤', '数码小站', '书虫二手'];
              const sellerName = sellerNames[Math.floor(Math.random() * sellerNames.length)];
              
              list.push({
                type: 'goods',
                id,
                image,          // 商品图片
                title,
                price,
                condition,
                sellerId,
                sellerAvatar,
                sellerName
              });
            } else {
              const title = `${rewardTitles[id % rewardTitles.length]}`;
              const desc = rewardDescs[id % rewardDescs.length] + (Math.random() > 0.5 ? '，有意联系' : '');
              const minPrice = (Math.random() * 200 + 20).toFixed(0);
              const maxPrice = (Number(minPrice) + Math.random() * 300 + 50).toFixed(0);
              const buyerId = `buyer_${id}`;
              const avatarId = Math.floor(Math.random() * 100);
              const buyerAvatar = `https://randomuser.me/api/portraits/men/${avatarId}.jpg`;
              const buyerNames = ['小明同学', '热心学姐', '校园小能手', '诚信买家', '小李', '小赵', '小周', '老吴'];
              const buyerName = buyerNames[Math.floor(Math.random() * buyerNames.length)];
              
              list.push({
                type: 'reward',
                id,
                image,          // 悬赏也添加图片
                title,
                desc,
                minPrice,
                maxPrice,
                buyerId,
                buyerAvatar,
                buyerName
              });
            }
          }
          resolve({ list, hasMore });
        }, 800);
      });
    },

    onSellerTap(e) {
      const sellerId = e.currentTarget.dataset.sellerId;
      wx.navigateTo({
        url: `/pages/seller/seller?sellerId=${sellerId}`,
        fail: () => wx.showToast({ title: '卖家主页开发中', icon: 'none' })
      });
    },

    onBuyerTap(e) {
      const buyerId = e.currentTarget.dataset.buyerId;
      wx.navigateTo({
        url: `/pages/user/user?userId=${buyerId}`,
        fail: () => wx.showToast({ title: '用户主页开发中', icon: 'none' })
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