// modules/bounty/service.js
const { validateBountyId, validatePublish } = require('./validator')

// ========== 枚举白名单（对齐数据库） ==========
const BOUNTY_STATUS_MAP = { '1': true, '2': true, '3': true, '4': true }

// ========== 1. 发布悬赏 ==========
async function publishBounty(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { title, description, category, expectedPrice, deliveryRequirement, images } = event.data || {}

  // 校验
  validatePublish(event.data)

  if (!OPENID) {
    throw new Error('无法获取当前用户身份，请重新登录')
  }

  // 金额转分（防止浮点误差）
  const priceInFen = Math.round(expectedPrice * 100)

  // 写入数据库
  const result = await db.collection('bounties').add({
    data: {
      title: title.trim(),
      description: description.trim(),
      category,
      expectedPrice: priceInFen,
      deliveryRequirement: deliveryRequirement || '',
      images: images || [],
      status: '1', // 默认"待接取"
      buyerInfo: { _id: OPENID },
      takerInfo: null,
      createdAt: Date.now()
    }
  })

  return {
    bountyId: result._id,
    message: '悬赏发布成功'
  }
}

// ========== 2. 悬赏列表（主页/流） ==========
async function getBountyList(event) {
  const db = event.db
  const { page = 1, pageSize = 10, category } = event.data || {}

  const where = { status: '1' } // 仅展示待接取
  if (category) where.category = category

  const res = await db.collection('bounties')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []

  // 需联查发布者信息（为了显示头像和昵称）
  const formattedList = []
  for (const item of list) {
    let buyerInfo = {}
    if (item.buyerInfo && item.buyerInfo._id) {
      try {
        const userRes = await db.collection('users').doc(item.buyerInfo._id).get()
        buyerInfo = userRes.data || {}
      } catch (e) { /* 忽略 */ }
    }

    const price = item.expectedPrice || 0
    formattedList.push({
      id: item._id,
      title: item.title || '',
      price: {
        min: price / 100,
        max: price / 100
      }, // 前端期望 (lower_num, upper_num)，这里单个价格就传相同的值
      sellerId: item.buyerInfo?._id || '', // 前端字段名用了 seller，实际是发布者
      sellerAvatarCDN: buyerInfo.avatarUrl || '',
      sellerName: buyerInfo.nickName || '匿名用户',
      firstPictureCDN: item.images?.[0] || ''
    })
  }

  return {
    rewards_num: formattedList.length,
    rewards_list: formattedList
  }
}

// ========== 3. 悬赏详情 ==========
async function getBountyDetail(event) {
  const db = event.db
  const { RewardId } = event.data || {}
  validateBountyId(RewardId)

  // 1. 查询悬赏主表
  const bountyRes = await db.collection('bounties').doc(RewardId).get()
  const bounty = bountyRes.data
  if (!bounty) throw new Error('悬赏不存在或已失效')

  // 2. 查询发布者（buyer）信息
  let buyerInfo = {}
  if (bounty.buyerInfo && bounty.buyerInfo._id) {
    try {
      const userRes = await db.collection('users').doc(bounty.buyerInfo._id).get()
      buyerInfo = userRes.data || {}
    } catch (e) { /* 忽略 */ }
  }

  // 3. 查询评论（复用 topics 表，约定 linkedGoodsInfo 存悬赏 ID）
  //    注意：这里用 linkedGoodsInfo 存储 { _id: RewardId }，与商品评论逻辑一致
  let comments = []
  try {
    const commentsRes = await db.collection('topics')
      .where({
        linkedGoodsInfo: { _id: RewardId },
        type: '3'
      })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()

    for (const c of (commentsRes.data || [])) {
      let authorInfo = {}
      if (c.authorInfo && c.authorInfo._id) {
        try {
          const authorRes = await db.collection('users').doc(c.authorInfo._id).get()
          authorInfo = authorRes.data || {}
        } catch (e) { /* 忽略 */ }
      }
      comments.push({
        id: c._id,
        parentId: c.parentReplyId || null,
        userId: c.authorInfo?._id || '',
        username: authorInfo.nickName || '匿名用户',
        userAvatarCDN: authorInfo.avatarUrl || '',
        content: c.content || '',
        replyToUserName: null,
        createTime: c.createdAt || '',
        is_liked: false,
        likeCount: c.likeCount || 0
      })
    }
  } catch (e) {
    console.warn('悬赏评论查询失败:', e.message)
  }

  // 4. 组装返回（与前端 #9 完全对齐）
  const price = bounty.expectedPrice || 0
  return {
    title: bounty.title || '',
    buyerId: bounty.buyerInfo?._id || '',
    buyerAvatarCDN: buyerInfo.avatarUrl || '',
    buyerName: buyerInfo.nickName || '匿名用户',
    PictureCDN: bounty.images || [],
    minprice: price / 100,
    maxprice: price / 100,
    desc: bounty.description || '',
    tradeWays: '3', // 前端需要，数据库暂无，默认均可
    comments: comments,
    is_favorite: false,
    recommend_rewards: {
      rewards_num: 0,
      rewards_list: []
    }
  }
}

// ========== 4. 接单 ==========
async function takeBounty(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { RewardId } = event.data || {}
  validateBountyId(RewardId)

  if (!OPENID) {
    throw new Error('无法获取当前用户身份，请重新登录')
  }

  // 1. 查询悬赏是否存在且状态为“待接取”
  const bountyRes = await db.collection('bounties').doc(RewardId).get()
  const bounty = bountyRes.data
  if (!bounty) throw new Error('悬赏不存在')
  if (bounty.status !== '1') {
    throw new Error('该悬赏已被接取或已过期')
  }

  // 2. 禁止发布者自己接自己的单
  if (bounty.buyerInfo && bounty.buyerInfo._id === OPENID) {
    throw new Error('不能接取自己发布的悬赏')
  }

  // ========== 3. 使用 set 操作符一步到位更新 ==========
  // 使用 _.set() 操作符，直接将 takerInfo 设置为 { _id: OPENID }
  const _ = db.command
  await db.collection('bounties').doc(RewardId).update({
    data: {
      status: '2',
      takerInfo: _.set({ _id: OPENID }),
      updatedAt: Date.now()
    }
  })

  return {
    bountyId: RewardId,
    message: '接单成功，请尽快与发布者联系'
  }
}

module.exports = {
  publishBounty,
  getBountyList,
  getBountyDetail,
  takeBounty
}