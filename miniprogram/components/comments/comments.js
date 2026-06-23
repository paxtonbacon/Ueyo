// components/comments/comments.js
// components/comments/comments.js
Component({
  properties: {
    postId: {
      type: String,
      value: ''
    }
  },
  data: {
    comments: [],
    totalCount: 0,
    showInput: false,
    replyTarget: null,   // { id, userName, parentId }   parentId用于标识一级评论id
    commentText: ''
  },
  lifetimes: {
    attached() {
      this.loadComments();
    }
  },
  methods: {
    loadComments() {
      // 模拟数据：为每个用户增加 userId 字段
      setTimeout(() => {
        const mockComments = [
          {
            id: 'c1',
            userId: 'user1',
            userAvatar: 'https://randomuser.me/api/portraits/women/1.jpg',
            userName: '小甜心',
            content: '看起来很不错诶！我也想要',
            createTime: '2小时前',
            isLiked: false,
            likeCount: 5,
            replies: [
              {
                id: 'r1',
                parentId: 'c1',
                userId: 'user2',
                userAvatar: 'https://randomuser.me/api/portraits/men/2.jpg',
                userName: '卖家回复',
                content: '可以私聊我哦',
                replyToUserName: '小甜心',   // 回复对象
                createTime: '1小时前',
                isLiked: false,
                likeCount: 1
              }
            ]
          },
          {
            id: 'c2',
            userId: 'user3',
            userAvatar: 'https://randomuser.me/api/portraits/men/3.jpg',
            userName: '技术宅',
            content: '这个价格合理吗？',
            createTime: '3小时前',
            isLiked: true,
            likeCount: 12,
            replies: []
          }
        ];
        const totalCount = mockComments.reduce((sum, c) => sum + 1 + c.replies.length, 0);
        this.setData({ comments: mockComments, totalCount });
      }, 300);
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

    // 提交评论
    onSubmitComment() {
      const data = this.data;  // 先保存到局部变量
      const { commentText, replyTarget, postId } = data;
      if (!commentText.trim()) {
        wx.showToast({ title: '请输入内容', icon: 'none' });
        return;
      }

      const newId = Date.now().toString();
      const currentUser = {
        userId: 'currentUser',   // 实际应从登录态获取
        userName: '当前用户',
        userAvatar: 'https://randomuser.me/api/portraits/men/6.jpg'
      };

      if (replyTarget) {
        // 回复操作：构造二级回复
        const newReply = {
          id: newId,
          parentId: replyTarget.parentId ? replyTarget.parentId : replyTarget.id, // 如果回复的是一级评论，parentId 就是那个一级评论的id
          userId: currentUser.userId,
          userAvatar: currentUser.userAvatar,
          userName: currentUser.userName,
          content: commentText,
          replyToUserName: replyTarget.userName,   // 被回复的用户名
          createTime: '刚刚',
          isLiked: false,
          likeCount: 0
        };

        // 确定要插入到哪一条一级评论的 replies 中
        const comments = [...this.data.comments];
        let targetCommentIndex = -1;
        if (replyTarget.parentId) {
          // 回复的是二级回复，那么需要找到该二级回复所属的一级评论
          for (let i = 0; i < comments.length; i++) {
            const hasReply = comments[i].replies.some(r => r.id === replyTarget.id);
            if (hasReply) {
              targetCommentIndex = i;
              break;
            }
          }
        } else {
          // 回复的是一级评论
          targetCommentIndex = comments.findIndex(c => c.id === replyTarget.id);
        }

        if (targetCommentIndex !== -1) {
          comments[targetCommentIndex].replies.push(newReply);
          this.setData({ comments });
          this.setData({ totalCount: this.data.totalCount + 1 });
        }
      } else {
        // 全局评论（一级评论）
        const newComment = {
          id: newId,
          userId: currentUser.userId,
          userAvatar: currentUser.userAvatar,
          userName: currentUser.userName,
          content: commentText,
          createTime: '刚刚',
          isLiked: false,
          likeCount: 0,
          replies: []
        };
        const comments = [newComment, ...this.data.comments];
        this.setData({ comments, totalCount: this.data.totalCount + 1 });
      }

      this.hideInput();
      // 调用后端接口保存评论
      console.log('提交评论:', commentText, replyTarget);
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