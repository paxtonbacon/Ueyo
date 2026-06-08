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

    // 模拟/对接云函数的数据获取函数（后续替换为真实云函数调用）
    fetchDataFromCloud(page, pageSize) {
      return new Promise((resolve) => {
        // 模拟网络延迟
        setTimeout(() => {
          const hasMore = page < 5;  // 模拟总共5页
          const list = [];
          const start = (page - 1) * pageSize;
          
          for (let i = 1; i <= pageSize; i++) {
            const id = start + i;
            // 随机图片（使用 picsum 获取随机图片，宽高 300*200）
            const imgId = Math.floor(Math.random() * 200);
            const image = `https://picsum.photos/300/200?random=${imgId}`;
            // 随机商品名
            const titles = ['我超爱的复古运动鞋在这里！！！！哈哈哈', '这是简约双肩包', 'hhhh纯棉T恤', '对对对牛仔裤', '没有灵魂的极乐迪斯科xxxx棒球帽', '帆布鞋', '卫衣', '休闲裤', '手表', '太阳镜'];
            const title = `${titles[id % titles.length]}`;
            // 随机价格 30~500
            const price = (Math.random() * 470 + 30).toFixed(0);
            // 随机成新 6.0~9.9
            const condition = (Math.random() * 4 + 6).toFixed(1);
            // 随机卖家头像（randomuser）
            const avatarId = Math.floor(Math.random() * 100);
            const sellerAvatar = `https://randomuser.me/api/portraits/women/${avatarId}.jpg`;
            // 随机卖家名称
            const sellerNames = ['淘淘小店', '小王的铺', '老张闲置', '学姐好物', '校园跳蚤', '数码小站', '书虫二手'];
            const sellerName = sellerNames[Math.floor(Math.random() * sellerNames.length)] + (id % 100);
            
            list.push({
              id: id,
              image: image,
              title: title,
              price: price,
              condition: condition,
              sellerId: `seller_${id}`,
              sellerAvatar: sellerAvatar,
              sellerName: sellerName
            });
          }
          
          resolve({
            list: list,
            hasMore: hasMore
          });
        }, 800);
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