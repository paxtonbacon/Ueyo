// modules/social/service.js
const { validateId, validatePublishPost, validateSubmitReply } = require('./validator')

// ========== 1. 话题列表（前端 #11） ==========
async function getTopicList(event) {
  const db = event.db
  const { page = 1, pageSize = 20 } = event.data || {}

  const res = await db.collection('topics')
    .where({ type: '1' }) // 仅查询话题
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  
  // 为每个话题查询其下最近的4篇帖子
  const formattedList = []
  for (const topic of list) {
    const postsRes = await db.collection('topics')
      .where({ topicId: topic._id, type: '2' })
      .orderBy('createdAt', 'desc')
      .limit(4)
      .get()
    
    const fourPostList = (postsRes.data || []).map(p => ({
      id: p._id,
      title: p.title || '',
      postCDN: p.images?.[0] || ''
    }))

    formattedList.push({
      id: topic._id,
      title: topic.title || '',
      desc: topic.content || '',
      four_postlist: fourPostList
    })
  }

  return {
    topic_number: formattedList.length,
    topic_list: formattedList
  }
}

// ========== 2. 帖子列表（前端 #12） ==========
async function getPostList(event) {
  const db = event.db
  const { page = 1, pageSize = 10 } = event.data || {}

  const res = await db.collection('topics')
    .where({ type: '2' }) // 仅查询帖子
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  const formattedList = []
  
  for (const post of list) {
    // 查询作者信息
    let authorInfo = {}
    if (post.authorInfo && post.authorInfo._id) {
      try {
        const authorRes = await db.collection('users').doc(post.authorInfo._id).get()
        authorInfo = authorRes.data || {}
      } catch (e) { /* 忽略 */ }
    }

    formattedList.push({
      id: post._id,
      title: post.title || '',
      posterId: post.authorInfo?._id || '',
      posterAvatarCDN: authorInfo.avatarUrl || '',
      posterName: authorInfo.nickName || '匿名用户',
      firstPictureCDN: post.images?.[0] || '',
      is_liked: false, // 后续扩展
      likeCount: post.likeCount || 0
    })
  }

  return {
    posts_number: formattedList.length,
    posts_list: formattedList
  }
}

// ========== 3. 话题内部帖子列表（前端 #13） ==========
async function getTopicPosts(event) {
  const db = event.db
  const { TopicId } = event.data || {}
  validateId(TopicId)

  // 1. 查询话题基本信息
  const topicRes = await db.collection('topics').doc(TopicId).get()
  const topic = topicRes.data
  if (!topic) throw new Error('话题不存在')

  // 查询话题创建者
  let adminInfo = {}
  if (topic.authorInfo && topic.authorInfo._id) {
    try {
      const adminRes = await db.collection('users').doc(topic.authorInfo._id).get()
      adminInfo = adminRes.data || {}
    } catch (e) { /* 忽略 */ }
  }

  // 2. 查询该话题下的所有帖子
  const { page = 1, pageSize = 10 } = event.data || {}
  const postsRes = await db.collection('topics')
    .where({ topicId: TopicId, type: '2' })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const postsList = []
  for (const post of (postsRes.data || [])) {
    let authorInfo = {}
    if (post.authorInfo && post.authorInfo._id) {
      try {
        const authorRes = await db.collection('users').doc(post.authorInfo._id).get()
        authorInfo = authorRes.data || {}
      } catch (e) { /* 忽略 */ }
    }

    // 查询该帖子的回复数
    const replyRes = await db.collection('topics')
      .where({ postId: post._id, type: '3' })
      .count()
    const replyCount = replyRes.total || 0

    postsList.push({
      id: post._id,
      title: post.title || '',
      posterId: post.authorInfo?._id || '',
      posterAvatarCDN: authorInfo.avatarUrl || '',
      posterName: authorInfo.nickName || '匿名用户',
      postTime: post.createdAt || '',
      PictureCDN: (post.images || []).slice(0, 3),
      desc: (post.content || '').substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
      is_liked: false,
      likeCount: post.likeCount || 0,
      commentCount: replyCount
    })
  }

  return {
    topic_title: topic.title || '',
    topic_desc: topic.content || '',
    adminId: topic.authorInfo?._id || '',
    adminName: adminInfo.nickName || '匿名用户',
    adminAvatarCDN: adminInfo.avatarUrl || '',
    posts_number: postsList.length,
    posts_list: postsList
  }
}

// ========== 4. 帖子详情（前端 #15） ==========
async function getPostDetail(event) {
  const db = event.db
  const { PostId } = event.data || {}
  validateId(PostId)

  // 1. 查询帖子
  const postRes = await db.collection('topics').doc(PostId).get()
  const post = postRes.data
  if (!post) throw new Error('帖子不存在')
  if (post.type !== '2') throw new Error('该记录不是帖子')

  // 2. 查询作者信息
  let authorInfo = {}
  if (post.authorInfo && post.authorInfo._id) {
    try {
      const authorRes = await db.collection('users').doc(post.authorInfo._id).get()
      authorInfo = authorRes.data || {}
    } catch (e) { /* 忽略 */ }
  }

  // 3. 查询所属话题
  let topicName = ''
  if (post.topicId) {
    try {
      const topicRes = await db.collection('topics').doc(post.topicId).get()
      topicName = topicRes.data?.title || ''
    } catch (e) { /* 忽略 */ }
  }

  // 4. 查询回复列表（type='3'）
  let comments = []
  try {
    const commentsRes = await db.collection('topics')
      .where({ postId: PostId, type: '3' })
      .orderBy('createdAt', 'asc')
      .limit(100)
      .get()

    for (const c of (commentsRes.data || [])) {
      let commentAuthor = {}
      if (c.authorInfo && c.authorInfo._id) {
        try {
          const authorRes = await db.collection('users').doc(c.authorInfo._id).get()
          commentAuthor = authorRes.data || {}
        } catch (e) { /* 忽略 */ }
      }

      // 如果有 parentReplyId，查询被回复的用户
      let replyToUserName = null
      if (c.parentReplyId) {
        try {
          const parentRes = await db.collection('topics').doc(c.parentReplyId).get()
          const parent = parentRes.data
          if (parent && parent.authorInfo && parent.authorInfo._id) {
            const parentAuthorRes = await db.collection('users').doc(parent.authorInfo._id).get()
            replyToUserName = parentAuthorRes.data?.nickName || null
          }
        } catch (e) { /* 忽略 */ }
      }

      comments.push({
        id: c._id,
        parentId: c.parentReplyId || null,
        userId: c.authorInfo?._id || '',
        username: commentAuthor.nickName || '匿名用户',
        userAvatarCDN: commentAuthor.avatarUrl || '',
        content: c.content || '',
        replyToUserName: replyToUserName,
        createTime: c.createdAt || '',
        is_liked: false,
        likeCount: c.likeCount || 0
      })
    }
  } catch (e) {
    console.warn('回复查询失败:', e.message)
  }

  // 5. 组装返回
  return {
    posterId: post.authorInfo?._id || '',
    posterAvatarCDN: authorInfo.avatarUrl || '',
    posterName: authorInfo.nickName || '匿名用户',
    PictureCDN: post.images || [],
    title: post.title || '',
    content: post.content || '',
    topic: topicName,
    time: post.createdAt || '',
    comments: comments,
    is_liked: false,
    is_favorited: false,
    likeCount: post.likeCount || 0,
    favoriteCount: 0, // 暂不支持收藏
    commentsCount: comments.length
  }
}

// ========== 5. 发布帖子（前端 #19） ==========
async function publishPost(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { title, content, topicId, images } = event.data || {}

  validatePublishPost(event.data)

  if (!OPENID) {
    throw new Error('无法获取当前用户身份，请重新登录')
  }

  // 验证话题是否存在
  const topicRes = await db.collection('topics').doc(topicId).get()
  if (!topicRes.data) throw new Error('话题不存在')

  // 写入数据库
  const result = await db.collection('topics').add({
    data: {
      type: '2', // 帖子
      title: title.trim(),
      content: content.trim(),
      images: images || [],
      topicId: topicId,
      authorInfo: { _id: OPENID },
      likeCount: 0,
      replyCount: 0,
      auditStatus: '1', // 待审核（后续可扩展）
      createdAt: Date.now()
    }
  })

  // 更新话题的 postCount（可选）
  // await db.collection('topics').doc(topicId).update({
  //   data: { postCount: _.inc(1) }
  // })

  return {
    postId: result._id,
    message: '帖子发布成功'
  }
}

// ========== 6. 提交回复（前端 #8，评论复用） ==========
async function submitReply(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { ParentId, content, replyToUserName } = event.data || {}

  validateSubmitReply(event.data)

  if (!OPENID) {
    throw new Error('无法获取当前用户身份，请重新登录')
  }

  // 验证父级（帖子或回复）是否存在
  const parentRes = await db.collection('topics').doc(ParentId).get()
  const parent = parentRes.data
  if (!parent) throw new Error('目标不存在')

  // 确定 postId（如果是回复帖子，ParentId 就是帖子ID；如果是回复楼中楼，需要追溯到帖子ID）
  let postId = ParentId
  let parentReplyId = null
  if (parent.type === '3') {
    // 如果父级是回复，则 postId 取父级的 postId
    postId = parent.postId || ParentId
    parentReplyId = ParentId
  } else if (parent.type === '2') {
    // 如果父级是帖子，postId 就是 ParentId
    postId = ParentId
  } else {
    throw new Error('只能对帖子或回复进行评论')
  }

  // 写入数据库
  const result = await db.collection('topics').add({
    data: {
      type: '3', // 回复/评论
      content: content.trim(),
      images: [],
      postId: postId,
      parentReplyId: parentReplyId,
      topicId: parent.topicId || '',
      authorInfo: { _id: OPENID },
      linkedGoodsInfo: parent.linkedGoodsInfo || null,
      likeCount: 0,
      auditStatus: '1',
      createdAt: Date.now()
    }
  })

  // 更新帖子的 replyCount
  // await db.collection('topics').doc(postId).update({
  //   data: { replyCount: _.inc(1) }
  // })

  return {
    replyId: result._id,
    message: '回复成功'
  }
}

module.exports = {
  getTopicList,
  getPostList,
  getTopicPosts,
  getPostDetail,
  publishPost,
  submitReply
}