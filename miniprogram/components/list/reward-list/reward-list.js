// components/reward-list/reward-list.js
Component({
  properties: {
    // 可扩展，例如 type: 'reward'
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

    // 供父组件调用
    refreshData() {
      return this.loadData(true);
    },

    loadMoreData() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadData(false);
      }
    },

    // 模拟数据获取（后续替换为真实云函数）
    fetchDataFromCloud(page, pageSize) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const hasMore = page < 5;
          const list = [];
          const start = (page - 1) * pageSize;
          
          const titles = [
            '求购二手笔记本电脑', 
            '收一部iPhone14', 
            '求租学校附近单间', 
            '收购经济学教材', 
            '求购自行车一辆',
            '需要一台打印机',
            '找合租室友',
            '收一张健身卡'
          ];
          const descs = [
            '希望配置i5以上，内存16G，外观无破损',
            '最好在保，电池健康90%以上，真急需，可以适当溢价',
            '离学校步行10分钟内，价格好商量',
            '曼昆经济学原理第七版及以上',
            '山地车或普通代步车均可，100元左右',
            '激光打印，能连手机',
            '要求作息规律，不养宠物',
            '学校附近健身房，剩余时间半年以上'
          ];
          
          for (let i = 1; i <= pageSize; i++) {
            const id = start + i;
            const titleIdx = id % titles.length;
            const descIdx = id % descs.length;
            const title = `${titles[titleIdx]}`;
            const desc = descs[descIdx];
            const minPrice = Math.floor(Math.random() * 200) + 50;
            const maxPrice = minPrice + Math.floor(Math.random() * 300) + 50;
            
            // 随机头像与名称
            const avatarId = Math.floor(Math.random() * 100);
            const buyerAvatar = `https://randomuser.me/api/portraits/men/${avatarId}.jpg`;
            const buyerNames = ['张同学', '李同学', '王学长', '刘学姐', '赵同学', '陈老师', '周同学'];
            const buyerName = buyerNames[id % buyerNames.length];
            
            list.push({
              id: id,
              title: title,
              desc: desc,
              minPrice: minPrice,
              maxPrice: maxPrice,
              buyerId: `buyer`,
              buyerAvatar: buyerAvatar,
              buyerName: buyerName
            });
          }
          
          resolve({
            list: list,
            hasMore: hasMore
          });
        }, 800);
      });
    },

    // 点击买家区域，跳转买家主页
    onBuyerTap(e) {
      const buyerId = e.currentTarget.dataset.buyerId;
      wx.navigateTo({
        url: `/pages/buyer/buyer?buyerId=${buyerId}`,
        fail: () => {
          wx.showToast({ title: '买家主页开发中', icon: 'none' });
        }
      });
    },
    onCardTap(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/reward/detail/detail?id=${id}`,
        fail: () => {
          wx.showToast({ title: '悬赏详情页开发中', icon: 'none' });
        }
      });
    }
  }
});