// components/forums_detail/post_sets/post_sets.js
Component({
  properties: {
    // 话题ID（从父页面传入）
    topicId: {
      type: String,
      value: ''
    }
  },
  data: {
    topicInfo: {
      title: '',
      desc: '',
      adminAvatar: '',
      adminName: ''
    },
    list: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },
  lifetimes: {
    attached() {
      this.loadTopicInfo(); // loadTopicInfo 已包含首页帖子加载
    }
  },
  methods: {
    // 加载话题头部信息 + 帖子列表（调用云函数 social/topic/posts）
    loadTopicInfo() {
      const topicId = this.properties.topicId || this.data.topicId;
      if (!topicId) {
        console.warn('post_sets: 缺少 topicId');
        return;
      }
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'social/topic/posts',
          data: { TopicId: topicId, page: 1, pageSize: 10 }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '获取话题信息失败');
        }
        const data = result.data;
        this.setData({
          topicInfo: {
            title: data.topic_title || '',
            desc: data.topic_desc || '',
            adminAvatar: data.adminAvatarCDN || '',
            adminName: data.adminName || ''
          }
        });
        // 同时填充帖子列表
        const cloudList = data.posts_list || [];
        const list = cloudList.map(item => ({
          id: item.id,
          userAvatar: item.posterAvatarCDN || '',
          userName: item.posterName || '',
          postTime: item.postTime || '',
          title: item.title || '',
          content: item.desc || '',
          images: item.PictureCDN || [],
          isLiked: item.is_liked || false,
          likeCount: item.likeCount || 0,
          commentCount: item.commentCount || 0
        }));
        this.setData({
          list,
          page: 2,
          hasMore: list.length >= 10
        });
      }).catch(err => {
        console.error('加载话题数据失败:', err);
      });
    },

    async loadData(refresh) {
      if (this.data.loading) return;
      this.setData({ loading: true });
      try {
        const page = refresh ? 1 : this.data.page;
        const res = await this.fetchPosts(page, this.data.pageSize);
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
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    },

    // 加载更多帖子（调用云函数 social/topic/posts）
    fetchPosts(page, pageSize) {
      const topicId = this.properties.topicId || this.data.topicId;
      if (!topicId) {
        return Promise.resolve({ list: [], hasMore: false });
      }
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'social/topic/posts',
          data: { TopicId: topicId, page, pageSize }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '加载更多帖子失败');
        }
        const cloudList = result.data.posts_list || [];
        const list = cloudList.map(item => ({
          id: item.id,
          userAvatar: item.posterAvatarCDN || '',
          userName: item.posterName || '',
          postTime: item.postTime || '',
          title: item.title || '',
          content: item.desc || '',
          images: item.PictureCDN || [],
          isLiked: item.is_liked || false,
          likeCount: item.likeCount || 0,
          commentCount: item.commentCount || 0
        }));
        return {
          list,
          hasMore: list.length >= pageSize
        };
      });
    },

    refreshData() {
      this.setData({ list: [] });
      return this.loadData(true);
    },

    loadMoreData() {
      if (this.data.hasMore && !this.data.loading) {
        this.loadData(false);
      }
    },

    // 点击帖子卡片（跳转详情）
    onCardTap(e) {
      const id = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/pages/forums/Post_detail/Post_detail?id=${id}`,
        fail: () => wx.showToast({ title: '详情页开发中', icon: 'none' })
      });
    },

    // 点赞
    onLike(e) {
      const { id, index } = e.currentTarget.dataset;
      const item = this.data.list[index];
      if (!item) return;
      const newLiked = !item.isLiked;
      const delta = newLiked ? 1 : -1;
      const newLikeCount = item.likeCount + delta;
      const newList = [...this.data.list];
      newList[index] = { ...item, isLiked: newLiked, likeCount: newLikeCount };
      this.setData({ list: newList });
      // 调用后端接口
      console.log(`帖子 ${id} 点赞状态: ${newLiked}`);
    }

    // 点击评论（可跳转到评论页）
    // onComment(e) {
    //   const id = e.currentTarget.dataset.id;
    //   wx.navigateTo({
    //     url: `/pages/forums/Post_detail/Post_detail?id=${id}&scrollTo=comment`,
    //     fail: () => wx.showToast({ title: '评论功能开发中', icon: 'none' })
    //   });
    // },

    // 点击图片（可预览大图）
    // onImageTap(e) {
    //   const imgList = e.currentTarget.dataset.img;
    //   if (imgList && imgList.length) {
    //     wx.previewImage({
    //       urls: imgList,
    //       current: imgList[0]
    //     });
    //   }
    // }
  }
});