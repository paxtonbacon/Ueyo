// components/forums_detail/topic/topic.js
// topic-set.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 话题详情页跳转路径模板，支持 {id} 占位符
    // 示例: "/pages/topic-detail/topic-detail?id={id}"
    // 若不提供，则不执行内部跳转，仅触发 topicTap 事件
    detailUrl: {
      type: String,
      value: ''
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    displayTopics: [],    // 展示的话题列表
    defaultCover: 'https://picsum.photos/id/1/200/150'  // 默认首图占位
  },

  lifetimes: {
    attached() {
      this.loadTopicsData();
    }
  },

  methods: {
    /**
     * 加载话题数据（预留云函数接口）
     */
    // 加载话题数据（返回 Promise，供 refresh 使用）
    loadTopicsData() {
      return this.fetchTopicsData()   // 返回 Promise
        .then(topics => {
          this.setData({ displayTopics: topics });
        })
        .catch(err => {
          console.error('获取话题数据失败:', err);
          this.setData({ displayTopics: [] });
        });
    },

    /**
     * 获取话题数据（调用云函数）
     * @returns {Promise<Array>}
     */
    fetchTopicsData() {
      return wx.cloud.callFunction({
        name: 'backend',
        data: {
          action: 'social/topic/list',
          data: { page: 1, pageSize: 20 }
        }
      }).then(res => {
        const result = res.result;
        if (result.code !== 0) {
          throw new Error(result.msg || '获取话题列表失败');
        }
        const topicList = result.data.topic_list || [];
        // 字段映射：云函数 → 组件模板
        return topicList.map(item => ({
          id: item.id,
          title: item.title || '',
          desc: item.desc || '',
          posts: (item.four_postlist || []).map(p => ({
            titleSnippet: p.title || '',
            coverImage: p.postCDN || ''
          }))
        }));
      });
    },

    /**
     * 点击话题卡片（跳转详情页或触发自定义事件）
     */
    onTopicTap(e) {
      const { index } = e.currentTarget.dataset;
      const topic = this.data.displayTopics[index];
      if (!topic) return;

      // 1. 触发自定义事件，将完整话题数据交给父组件处理
      this.triggerEvent('topicTap', { topic });

      // 2. 如果配置了 detailUrl，则执行内部跳转
      if (this.properties.detailUrl && topic.id) {
        const url = this.properties.detailUrl.replace('{id}', topic.id);
        wx.navigateTo({ url });
      } else if (this.properties.detailUrl && !topic.id) {
        console.warn('话题缺少 id 字段，无法构建跳转路径');
      }
    },

    /**
     * 外部调用：刷新数据
     */
    // 外部调用：刷新数据（返回 Promise）
    refresh() {
      return this.loadTopicsData();
    },
  }
});