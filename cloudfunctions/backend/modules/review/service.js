// modules/review/service.js
const { validateOrderId, validateSubmitReview } = require('./validator')

// ========== 1. 提交评价 ==========
async function submitReview(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { orderId, rating, content, images, isAnonymous } = event.data || {}

  if (!OPENID) throw new Error('无法获取当前用户身份')

  validateSubmitReview(event.data)

  // 1. 查询订单，验证状态和权限
  const orderRes = await db.collection('orders').doc(orderId).get()
  const order = orderRes.data
  if (!order) throw new Error('订单不存在')
  if (order.orderStatus !== '4') {
    throw new Error('只有已完成订单才能评价')
  }

  // 检查当前用户是否为买家或卖家
  const isBuyer = order.buyerInfo && order.buyerInfo._id === OPENID
  const isSeller = order.sellerInfo && order.sellerInfo._id === OPENID
  if (!isBuyer && !isSeller) {
    throw new Error('您不是该订单的参与方，无权评价')
  }

  // 2. 确定评价对象（被评价方）
  let revieweeId
  if (isBuyer) {
    // 买家评价卖家
    revieweeId = order.sellerInfo?._id
  } else {
    // 卖家评价买家
    revieweeId = order.buyerInfo?._id
  }
  if (!revieweeId) throw new Error('被评价方不存在')

  // 3. 检查是否已经评价过（防止重复评价）
  const existingRes = await db.collection('reviews')
    .where({
      orderId: orderId,
      reviewerInfo: { _id: OPENID }
    })
    .count()
  if (existingRes.total > 0) {
    throw new Error('您已评价过该订单')
  }

  // 4. 写入评价
  const result = await db.collection('reviews').add({
    data: {
      rating,
      content: content || '',
      images: images || [],
      isAnonymous: isAnonymous || false,
      reviewerInfo: { _id: OPENID },
      revieweeInfo: { _id: revieweeId },
      orderId: orderId,
      createdAt: Date.now()
    }
  })

  // 5. 更新被评价方的信用分（简化版）
  await updateCreditScore(db, revieweeId, rating)

  return {
    reviewId: result._id,
    message: '评价成功'
  }
}

// ========== 辅助函数：更新信用分 ==========
async function updateCreditScore(db, userId, rating) {
  // 计算变动：5星+2分，4星+1分，3星0，2星-1，1星-2
  const delta = rating - 3
  const scoreDelta = delta // 直接使用差值作为分数变动

  // 查询用户当前信用分
  const userRes = await db.collection('users').doc(userId).get()
  const user = userRes.data
  if (!user) return

  const currentScore = user.creditScore || 100
  let newScore = Math.min(100, Math.max(0, currentScore + scoreDelta))
  // 如果新分数超出0-100范围则截断

  // 更新信用分
  await db.collection('users').doc(userId).update({
    data: {
      creditScore: newScore,
      // 如果需要更新信用等级，可在此扩展
    }
  })
}

// ========== 2. 查询评价列表（按被评价用户） ==========
async function getReviewList(event) {
  const db = event.db
  const { userId, page = 1, pageSize = 10 } = event.data || {}
  if (!userId) throw new Error('用户ID不能为空')

  const res = await db.collection('reviews')
    .where({ 'revieweeInfo._id': userId })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  // 可选：为每条评价补充评价人信息（reviewerInfo已存储_id，但未展开）
  // 这里不做联查，前端可自行获取或服务端补充
  // 若需展开，可循环查询users集合

  return {
    total: list.length,
    reviews: list.map(r => ({
      id: r._id,
      rating: r.rating,
      content: r.content,
      images: r.images,
      isAnonymous: r.isAnonymous,
      reviewerId: r.reviewerInfo?._id || '',
      createdAt: r.createdAt
    }))
  }
}

module.exports = { submitReview, getReviewList }