// components/forums_detail/post/post.js
Component({
  properties: {
    // 可传入外部数据（完全由父页面控制），若不传则内部随机模拟
    externalList: {
      type: Array,
      value: null
    }
  },
  data: {
    list: [],        // 卡片数据
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },
  lifetimes: {
    attached() {
      if (this.properties.externalList && this.properties.externalList.length) {
        // 如果父页面传入了完整数据，则直接使用，不再模拟加载更多
        this.setData({ list: this.properties.externalList, hasMore: false });
      } else {
        this.loadData(true);
      }
    }
  },
  methods: {
    // 加载数据（刷新或加载更多）
    // 加载数据（刷新或加载更多）
    async loadData(refresh) {
      if (this.data.loading) return;
      this.setData({ loading: true });
      try {
        const page = refresh ? 1 : this.data.page;
        const res = await this.fetchData(page, this.data.pageSize);
        const newList = refresh ? res.list : [...this.data.list, ...res.list];
        this.setData({
          list: newList,
          page: page + 1,
          hasMore: res.hasMore,
          loading: false
        });
      } catch (err) {
        console.error('加载失败', err);
        this.setData({ loading: false });
      }
    },

    // 模拟网络请求（后续替换为真实接口）
    fetchData(page, pageSize) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const hasMore = page < 5;   // 模拟共5页数据
          const list = [];
          const start = (page - 1) * pageSize;
          const titles = [
            '绝美风景照', '可爱猫咪日常', '街头摄影', '美食分享', '旅行日记',
            '穿搭打卡', '运动健身', '读书笔记', '数码评测', '手工艺品'
          ];
          for (let i = 1; i <= pageSize; i++) {
            const id = start + i;
            const imgId = Math.floor(Math.random() * 200);
            const image = `https://picsum.photos/300/300?random=${imgId}`;
            const title = `${titles[id % titles.length]}`;
            const userId = `user_${id}`;
            const avatarId = Math.floor(Math.random() * 100);
            const userAvatar = `https://randomuser.me/api/portraits/women/${avatarId}.jpg`;
            const userNames = ['小蓝', '小粉', '小绿', '小黄', '小紫', '小橙', '小灰', '小白'];
            const userName = userNames[Math.floor(Math.random() * userNames.length)];
            const isLiked = Math.random() > 0.7;
            const likeCount = Math.floor(Math.random() * 100);
            list.push({
              id,
              image,
              title,
              userId,
              userAvatar,
              userName,
              isLiked,
              likeCount
            });
          }
          resolve({ list, hasMore });
        }, 800);
      });
    },

    // 供父页面调用的刷新方法（下拉刷新时使用）
    // 供父页面调用的刷新方法（返回 Promise）
    refresh() {            // 改名 refresh，与 topic 组件保持一致，且返回 Promise
      return this.loadData(true);
    },

    // 供父页面调用的加载更多方法（返回 Promise）
    loadMoreData() {
      if (this.data.hasMore && !this.data.loading) {
        return this.loadData(false);
      }
      return Promise.resolve();
    },

    // 点击卡片（跳转详情）
    onCardTap(e) {
      const id = e.currentTarget.dataset.id;
      this.triggerEvent('cardtap', { id });
    },

    // 点击用户区域（跳转用户主页，阻止冒泡）
    onUserTap(e) {
      const userId = e.currentTarget.dataset.userId;
      this.triggerEvent('usertap', { userId });
      e.stopPropagation();
    },

    // 点赞/取消点赞
    onLikeTap(e) {
      const { id, index } = e.currentTarget.dataset;
      const item = this.data.list[index];
      if (!item) return;
      const newLiked = !item.isLiked;
      const delta = newLiked ? 1 : -1;
      const newLikeCount = item.likeCount + delta;
      // 更新本地数据
      const newList = [...this.data.list];
      newList[index] = { ...item, isLiked: newLiked, likeCount: newLikeCount };
      this.setData({ list: newList });
      // 触发事件，让父页面同步到后端
      this.triggerEvent('like', { id, isLiked: newLiked });
      e.stopPropagation();
    }
  }
});