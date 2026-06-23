// components/forums_detail/post_sets/post_sets.js
Component({
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
      this.loadTopicInfo();
      this.loadData(true);
    }
  },
  methods: {
    // 加载话题头部信息（模拟）
    loadTopicInfo() {
      const mockTopic = {
        title: '洛克王国最好玩！',
        desc: '交流洛克王国的相关帖子和内容，进行即时消息和相关交易',
        adminAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        adminName: '鸭吉吉'
      };
      this.setData({ topicInfo: mockTopic });
      // 后续可改为从接口获取
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

    // 模拟获取帖子数据（后续替换为真实接口）
    fetchPosts(page, pageSize) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const hasMore = page < 5;
          const list = [];
          const start = (page - 1) * pageSize;
          // 随机头像池
          const avatars = [
            'https://randomuser.me/api/portraits/women/1.jpg',
            'https://randomuser.me/api/portraits/men/2.jpg',
            'https://randomuser.me/api/portraits/women/3.jpg',
            'https://randomuser.me/api/portraits/men/4.jpg'
          ];
          const userNames = ['小蓝同学', '粉色学姐', '绿野仙踪', '大黄蜂', '紫韵', '橙子', '灰太狼', '小白兔'];
          const titles = [
            '求购二手自行车', '出闲置考研资料', '有没有一起拼单的', '学校食堂哪家强',
            '转租暑期单间', '收一台显示器', '出手工做的饰品', '求推荐好用的笔'
          ];
          const contents = [
            '想买一辆二手自行车，价格在200以内，能正常骑行即可，有出的同学请联系我。',
            '去年考研用的数学、英语资料，几乎全新，低价出，可小刀。',
            '想拼单买水果，有没有小伙伴一起？量大便宜。',
            '食堂三楼的麻辣烫真不错，大家觉得呢？',
            '暑假回家，单间转租两个月，靠近南门，有空调。',
            '收一台24寸以上显示器，用于写代码，要求无坏点。',
            '手工制作了一些小饰品，有兴趣的可以看看。',
            '求推荐一款好用不贵的签字笔，写感顺滑。'
          ];
          // 随机图片（模拟三张）
          const imgIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];

          for (let i = 1; i <= pageSize; i++) {
            const id = start + i;
            // 随机生成1~3张图片
            const imageCount = Math.floor(Math.random() * 3) + 1;
            const images = [];
            for (let j = 0; j < imageCount; j++) {
              const idx = (id + j) % imgIds.length;
              images.push(`https://picsum.photos/200/150?random=${imgIds[idx]}`);
            }
            list.push({
              id: id,
              userAvatar: avatars[id % avatars.length],
              userName: userNames[id % userNames.length] + (id % 100),
              postTime: `${Math.floor(Math.random() * 24)}小时前`,
              title: titles[id % titles.length],
              content: contents[id % contents.length] + (Math.random() > 0.5 ? '（补充：可面交，可刀）' : ''),
              images: images,
              isLiked: Math.random() > 0.7,
              likeCount: Math.floor(Math.random() * 80),
              commentCount: Math.floor(Math.random() * 40)
            });
          }
          resolve({ list, hasMore });
        }, 800);
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