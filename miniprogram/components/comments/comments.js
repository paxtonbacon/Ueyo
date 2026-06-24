// components/comments/comments.js
Component({
  properties: {
    postId: {
      type: String,
      value: ''
    },
    // 外部传入的评论数据（由详情API提供）
    externalComments: {
      type: Array,
      value: null
    }
  },
  data: {
    comments: [],
    totalCount: 0,
    showInput: false,
    replyTarget: null,
    commentText: ''
  },
  observers: {
    'externalComments'(newVal) {
      if (newVal && newVal.length > 0) {
        this.setData({
          comments: newVal,
          totalCount: newVal.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0)
        });
      }
    }
  },
  lifetimes: {
    attached() {
      // 优先使用外部传入的评论，否则显示空
      if (!this.properties.externalComments || this.properties.externalComments.length === 0) {
        this.setData({ comments: [], totalCount: 0 });
      }
    }
  },
  methods: {
    loadComments() {
      // 评论数据由父页面通过 externalComments 属性传入
      // 如需独立加载，可通过 postId 调用相关接口
    },

    // 显示评论输入框（供外部或内部调用）
    showCommentInput(target) {
      this.setData({
        showInput: true,
        replyTarget: target,
        commentText: ''
      });
    },

    hideInput() {
      this.setData({ showInput: false, replyTarget: null });
    },

    // 点击一级评论或二级回复区域（触发回复）
    onReplyMain(e) {
      const { id, name, parentId } = e.currentTarget.dataset;
      console.log('【onReplyMain】dataset:', { id, name, parentId }); // 修正
      // 构建回复目标：如果是二级回复，parentId 存在，此时我们需要知道该二级回复属于哪条一级评论
      // 但回复二级回复时，回复对象依然是该二级回复的作者，且最终生成的新回复应该挂在一级评论的 replies 中。
      // 这里简化处理：target 包含被回复人的 id 和 name，同时记录 parentId（如果存在则说明是二级回复的回复）。
      const target = {
        id: id,                // 被回复的评论id（一级或二级）
        userName: name,
        parentId: parentId || null   // 如果 parentId 存在，表示回复的是二级回复
      };
      console.log('【onReplyMain】target:', target);
      this.showCommentInput(target);
    },

    // 提交评论（调用云函数 social/reply/submit）
    async onSubmitComment() {
      const { commentText, replyTarget, postId } = this.data;
      if (!commentText.trim()) {
        wx.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }

      try {
        const res = await wx.cloud.callFunction({
          name: 'backend',
          data: {
            action: 'social/reply/submit',
            data: {
              ParentId: replyTarget ? (replyTarget.parentId || replyTarget.id) : postId,
              content: commentText.trim()
            }
          }
        });

        const result = res.result;
        if (result.code === 0) {
          wx.showToast({ title: '评论成功', icon: 'success' });
          this.hideInput();
          // 刷新评论（触发父组件重新加载）
          this.triggerEvent('refresh');
        } else {
          wx.showToast({ title: result.msg || '评论失败', icon: 'none' });
        }
      } catch (err) {
        console.error('提交评论失败:', err);
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    },

    // 点赞评论或回复
    onLike(e) {
      const { id, type } = e.currentTarget.dataset;
      let comments = [...this.data.comments];
      let found = false;
      for (let i = 0; i < comments.length; i++) {
        if (comments[i].id === id) {
          const delta = comments[i].isLiked ? -1 : 1;
          comments[i].isLiked = !comments[i].isLiked;
          comments[i].likeCount += delta;
          found = true;
          break;
        }
        for (let j = 0; j < comments[i].replies.length; j++) {
          if (comments[i].replies[j].id === id) {
            const delta = comments[i].replies[j].isLiked ? -1 : 1;
            comments[i].replies[j].isLiked = !comments[i].replies[j].isLiked;
            comments[i].replies[j].likeCount += delta;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) this.setData({ comments });
      this.triggerEvent('like', { commentId: id });
    },

    // 点击用户头像或昵称，跳转个人主页
    onUserTap(e) {
      const userId = e.currentTarget.dataset.userId;
      if (!userId) return;
      // 触发父组件事件，让父页面处理跳转（便于后续扩展）
      this.triggerEvent('usertap', { userId });
      // 也可直接跳转（若页面存在）
      wx.navigateTo({
        url: `/pages/user-profile/user-profile?uid=${userId}`,
        fail: () => wx.showToast({ title: '用户主页开发中', icon: 'none' })
      });
      e.stopPropagation(); // 防止触发回复
    },

    // 外部调用：刷新评论列表（可重新加载数据）
    refreshComments() {
      this.loadComments();
    }
  }
});