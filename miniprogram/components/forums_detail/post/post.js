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

    // 调用云函数获取帖子列表
    fetchData(page, pageSize) {
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'social/post/list',
          data: { page, pageSize }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '获取帖子列表失败');
        }
        const cloudList = result.data.posts_list || [];
        // 字段映射：云函数 → 组件模板
        const list = cloudList.map(item => ({
          id: item.id,
          image: item.firstPictureCDN || '',
          title: item.title || '',
          userId: item.posterId || '',
          userAvatar: item.posterAvatarCDN || '',
          userName: item.posterName || '',
          isLiked: item.is_liked || false,
          likeCount: item.likeCount || 0
        }));
        return {
          list,
          hasMore: list.length >= pageSize
        };
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