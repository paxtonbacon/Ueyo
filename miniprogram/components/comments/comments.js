// components/comments/comments.js
Component({
  properties: {
    postId: { type: String, value: '' },
    detailType: { type: Number, value: 1 },  // 1=帖子 2=商品 3=悬赏
    externalComments: { type: Array, value: null }
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
        // 字段映射 + 平铺→嵌套
        const mapped = newVal.map(c => ({
          id: c.id,
          parentId: c.parentId || null,
          userId: c.userId || '',
          userName: c.username || c.userName || '匿名用户',
          userAvatar: c.userAvatarCDN || c.userAvatar || '',
          content: c.content || '',
          replyToUserName: c.replyToUserName || null,
          createTime: c.createTime || '',
          isLiked: c.is_liked || false,
          likeCount: c.likeCount || 0
        }));
        const nested = this.nestComments(mapped);
        const total = mapped.length;
        this.setData({ comments: nested, totalCount: total });
      } else {
        this.setData({ comments: [], totalCount: 0 });
      }
    }
  },
  methods: {
    // 平铺→嵌套
    nestComments(flat) {
      const map = {}, roots = [];
      flat.forEach(c => { map[c.id] = { ...c, replies: [] }; });
      flat.forEach(c => {
        if (c.parentId && map[c.parentId]) {
          map[c.parentId].replies.push(map[c.id]);
        } else {
          roots.push(map[c.id]);
        }
      });
      return roots;
    },

    showCommentInput(target) {
      this.setData({ showInput: true, replyTarget: target, commentText: '' });
    },
    hideInput() { this.setData({ showInput: false, replyTarget: null }); },

    onReplyMain(e) {
      const { id, name, parentId } = e.currentTarget.dataset;
      this.showCommentInput({ id, userName: name, parentId: parentId || null });
    },

    async onSubmitComment() {
      const { commentText, replyTarget, postId } = this.data;
      if (!commentText.trim()) { wx.showToast({ title: '请输入内容', icon: 'none' }); return; }
      try {
        const res = await wx.cloud.callFunction({
          name: 'backend',
          data: {
            action: 'social/reply/submit',
            data: {
              ParentId: replyTarget ? replyTarget.id : postId,
              detailType: this.properties.detailType || 1,
              content: commentText.trim()
            }
          }
        });
        if (res.result && res.result.code === 0) {
          wx.showToast({ title: '评论成功', icon: 'success' });
          this.hideInput();
          this.triggerEvent('refresh');
        } else {
          wx.showToast({ title: (res.result && res.result.msg) || '评论失败', icon: 'none' });
        }
      } catch (err) {
        wx.showToast({ title: '网络异常', icon: 'none' });
      }
    },

    onLike(e) {
      const { id } = e.currentTarget.dataset;
      let comments = [...this.data.comments], found = false;
      for (let i = 0; i < comments.length && !found; i++) {
        if (comments[i].id === id) { comments[i].isLiked = !comments[i].isLiked; comments[i].likeCount += comments[i].isLiked ? 1 : -1; found = true; }
        for (let j = 0; j < (comments[i].replies||[]).length && !found; j++) {
          if (comments[i].replies[j].id === id) { comments[i].replies[j].isLiked = !comments[i].replies[j].isLiked; comments[i].replies[j].likeCount += comments[i].replies[j].isLiked ? 1 : -1; found = true; }
        }
      }
      if (found) this.setData({ comments });
      this.triggerEvent('like', { commentId: id });
    },

    onUserTap(e) {
      const userId = e.currentTarget.dataset.userId;
      if (!userId) return;
      this.triggerEvent('usertap', { userId });
      e.stopPropagation();
    },

    refreshComments() { this.triggerEvent('refresh'); }
  }
});