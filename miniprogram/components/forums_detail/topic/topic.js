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
     * 获取话题数据（Mock 实现）
     * @returns {Promise<Array>}
     */
    fetchTopicsData() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockData = this.generateMockTopics();
          resolve(mockData);
        }, 200);
      });
    },

    /**
     * 生成 Mock 话题数据集（与原示例相同，但为每个话题增加唯一 id）
     */
    generateMockTopics() {
      const topic1 = {
        id: 'topic_001',
        title: '摄影爱好者社群',
        desc: '天南海北，一镜到底！览百般胜景，汇千番精彩。',
        posts: [
          { titleSnippet: '小程序云开发入门实战：快速搭建待办事项应用', coverImage: 'https://picsum.photos/id/10/300/200' },
          { titleSnippet: '掌握自定义组件，提升代码复用性与可维护性', coverImage: 'https://picsum.photos/id/20/300/200' },
          { titleSnippet: '性能优化指南：从启动速度到页面渲染全解析', coverImage: 'https://picsum.photos/id/30/300/200' },
          { titleSnippet: '使用 Canvas 2D 实现炫酷图表与数据可视化', coverImage: 'https://picsum.photos/id/40/300/200' },
          { titleSnippet: '小程序中的状态管理方案对比（MobX vs 自研）', coverImage: 'https://picsum.photos/id/50/300/200' }
        ]
      };
      const topic2 = {
        id: 'topic_002',
        title: '编程+AI，时代缔造者',
        desc: '整理 GitHub、在线课程、技术社区等优质资源，助你高效入门编程。',
        posts: [
          { titleSnippet: '免费编程书籍大全：从 Python 到机器学习', coverImage: 'https://picsum.photos/id/100/300/200' },
          { titleSnippet: '菜鸟教程 vs W3School：新手该选哪个？', coverImage: 'https://picsum.photos/id/101/300/200' },
          { titleSnippet: 'GitHub 上星标过万的开源学习路线图合集', coverImage: 'https://picsum.photos/id/102/300/200' },
          { titleSnippet: 'Vue 与 React 入门对比：2024 新手选择指南', coverImage: 'https://picsum.photos/id/104/300/200' }
        ]
      };
      const topic3 = {
        id: 'topic_003',
        title: '来玩洛克王国！',
        desc: '整理 GitHub、在线课程、技术社区等优质资源，助你高效入门编程。',
        posts: [
          { titleSnippet: '免费编程书籍大全：从 Python 到机器学习', coverImage: 'https://picsum.photos/id/109/300/200' },
          { titleSnippet: '菜鸟教程 vs W3School：新手该选哪个？', coverImage: 'https://picsum.photos/id/106/300/200' },
          { titleSnippet: 'GitHub 上星标过万的开源学习路线图合集', coverImage: 'https://picsum.photos/id/110/300/200' },
          { titleSnippet: 'Vue 与 React 入门对比：2024 新手选择指南', coverImage: 'https://picsum.photos/id/108/300/200' }
        ]
      };
      return [topic1, topic2, topic3];
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