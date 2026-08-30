// modules/review/service.js
const { validateSubmitReview } = require('./validator')
const { SELLER_STATUS, BUYER_STATUS, PUT_STATUS, GET_STATUS } = require('../../constants/enums')
const { getUserByOpenId } = require('../../utils/helper')

// ========== 1. 提交评价（支持 goods + bounty） ==========
async function submitReview(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { goodsId, ratingType, content, images, isAnonymous, direction, reviewType } = event.data || {}
  // reviewType: 'goods' | 'bounty'
  // direction: 'buyer_to_seller' | 'seller_to_buyer'

  if (!OPENID) throw new Error('无法获取当前用户身份')
  if (!goodsId) throw new Error('ID不能为空')

  const type = reviewType || 'goods'

  if (type === 'bounty') {
    return await submitBountyReview(db, OPENID, event.data)
  }
  return await submitGoodsReview(db, OPENID, event.data)
}

// ========== 商品评价 ==========
async function submitGoodsReview(db, OPENID, data) {
  const { goodsId, ratingType, content, images, isAnonymous, direction } = data

  const goodsRes = await db.collection('goods').doc(goodsId).get()
  const goods = goodsRes.data
  if (!goods) throw new Error('商品不存在')

  let dir = direction || 'buyer_to_seller'
  let revieweeId

  if (dir === 'buyer_to_seller') {
    revieweeId = goods.sellerInfo?._id
  } else {
    const orderRes = await db.collection('orders').where({ 'goodsInfo._id': goodsId }).get()
    if (orderRes.data.length > 0) revieweeId = orderRes.data[0].buyerInfo?._id
    if (!revieweeId) throw new Error('找不到买家信息')
  }

  if (!revieweeId) throw new Error('被评价方不存在')
  if (OPENID === revieweeId) throw new Error('不能评价自己')

  // 防重复
  const existRes = await db.collection('reviews').where({ goodsId, 'reviewerInfo._id': OPENID }).count()
  if (existRes.total > 0) throw new Error('您已评价过该商品')

  // 1) 先更新商品状态（核心流程，必须成功）
  if (dir === 'seller_to_buyer') {
    await db.collection('goods').doc(goodsId).update({ data: { seller_status: SELLER_STATUS.ALL_DOWN } })
  } else {
    await db.collection('goods').doc(goodsId).update({ data: { buyer_status: BUYER_STATUS.HAVE_DOWN } })
  }

  // 2) 写入评价记录
  const result = await db.collection('reviews').add({
    data: { goodsId, direction: dir, ratingType: ratingType || 'good', content: content || '', images: images || [], isAnonymous: isAnonymous || false, reviewerInfo: { _id: OPENID }, revieweeInfo: { _id: revieweeId }, reviewType: 'goods', createdAt: Date.now() }
  })

  // 3) 更新信用分（非核心流程，失败不影响主流程）
  const scoreResult = await updateCreditScore(db, revieweeId, ratingType)

  return { reviewId: result._id, message: '评价成功', newCreditScore: scoreResult.score, newCreditLevel: scoreResult.level }
}

// ========== 悬赏评价 ==========
async function submitBountyReview(db, OPENID, data) {
  const { goodsId: bountyId, ratingType, content, images, isAnonymous, direction } = data

  const bountyRes = await db.collection('bounties').doc(bountyId).get()
  const bounty = bountyRes.data
  if (!bounty) throw new Error('悬赏不存在')

  let dir = direction || 'buyer_to_seller'  // buyer_to_seller = 接取方评发布方
  let revieweeId

  if (dir === 'buyer_to_seller') {
    // 接取方评发布方 → 被评方是发布者
    revieweeId = bounty.buyerInfo?._id
  } else {
    // 发布方评接取方 → 被评方是接取者
    revieweeId = bounty.takerInfo?._id
  }

  if (!revieweeId) throw new Error('被评价方不存在')
  if (OPENID === revieweeId) throw new Error('不能评价自己')

  // 防重复
  const existRes = await db.collection('bounties_reviews').where({ bountyId, 'reviewerInfo._id': OPENID }).count()
  if (existRes.total > 0) throw new Error('您已评价过该悬赏')

  // 1) 先更新悬赏状态（核心流程）
  if (dir === 'seller_to_buyer') {
    await db.collection('bounties').doc(bountyId).update({ data: { put_status: PUT_STATUS.ALL_DOWN } })
  } else {
    await db.collection('bounties').doc(bountyId).update({ data: { get_status: GET_STATUS.HAVE_DOWN } })
  }

  // 2) 写入评价记录
  const result = await db.collection('bounties_reviews').add({
    data: { bountyId, direction: dir, ratingType: ratingType || 'good', content: content || '', images: images || [], isAnonymous: isAnonymous || false, reviewerInfo: { _id: OPENID }, revieweeInfo: { _id: revieweeId }, reviewType: 'bounty', createdAt: Date.now() }
  })

  // 3) 更新信用分（非核心流程）
  const scoreResult = await updateCreditScore(db, revieweeId, ratingType)

  return { reviewId: result._id, message: '评价成功', newCreditScore: scoreResult.score, newCreditLevel: scoreResult.level }
}

// ========== 辅助：更新信用分 + 等级 ==========
// 注意：userId 参数是 _openid（非 users 集合的 doc._id）
async function updateCreditScore(db, openid, ratingType) {
  if (!openid) return { score: 100, level: '1' }

  // 通过 _openid 查找用户（不可直接用 doc(openid)，因为 openid 不是 _id）
  const user = await getUserByOpenId(db, openid)
  if (!user || !user._id) return { score: 100, level: '1' }

  // 评分权重：好评+2，中评0，差评-3
  const deltaMap = { 'good': 2, 'neutral': 0, 'bad': -3 }
  const delta = deltaMap[ratingType] || 0

  const currentScore = user.creditScore || 100
  let newScore = Math.min(100, Math.max(0, currentScore + delta))

  // 信用等级（4级，均分100分）
  let level = '1'
  if (newScore >= 80) level = '1'       // 优秀
  else if (newScore >= 60) level = '2'  // 良好
  else if (newScore >= 40) level = '3'  // 一般
  else level = '4'                       // 较差

  await db.collection('users').doc(user._id).update({
    data: { creditScore: newScore, creditLevel: level }
  })

  return { score: newScore, level }
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