// modules/bounty/service.js
const { validateBountyId, validatePublish } = require('./validator')
const { PUT_STATUS, GET_STATUS } = require('../../constants/enums')

// ========== 发布悬赏 ==========
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
      put_status: PUT_STATUS.HAVEN_PUB,     // 已发布
      get_status: GET_STATUS.NONE,           // 无接收者
      buyerInfo: { _id: OPENID },
      createdAt: Date.now()
    }
  })

  // 将悬赏ID追加到用户发布列表
  const _ = db.command
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0) {
    await db.collection('users').doc(userRes.data[0]._id).update({
      data: { publishedTasks: _.push(result._id) }
    })
  }

  return {
    bountyId: result._id,
    message: '悬赏发布成功'
  }
}

// ========== 2. 悬赏列表（主页/流） ==========
async function getBountyList(event) {
  const db = event.db
  const { page = 1, pageSize = 10, category } = event.data || {}

  const where = { put_status: PUT_STATUS.HAVEN_PUB } // 仅展示待接取悬赏
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
    tradeWays: '面交/快递均可', // 前端需要，悬赏暂无独立交易方式字段
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
  if (bounty.put_status !== PUT_STATUS.HAVEN_PUB || bounty.get_status !== GET_STATUS.NONE) {
    throw new Error('该悬赏已被接取或已过期')
  }

  // 2. 禁止发布者自己接自己的单
  if (bounty.buyerInfo && bounty.buyerInfo._id === OPENID) {
    throw new Error('不能接取自己发布的悬赏')
  }

  // 注意：正式接单请使用 bounty_order/create（包含完整订单创建 + 状态更新 + 用户绑定）
  // bounty/take 仅保留基础验证，不修改数据库
  return {
    bountyId: RewardId,
    message: '验证通过，请使用 bounty_order/create 完成接单'
  }
}

module.exports = {
  publishBounty,
  getBountyList,
  getBountyDetail,
  takeBounty
}