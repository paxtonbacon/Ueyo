// modules/goods/service.js
const { generateDescription } = require('../../utils/aiClient')
const { validateGoodsId } = require('./validator')
const { SELLER_STATUS, BUYER_STATUS, CONDITION } = require('../../constants/enums')
const { getUserByOpenId } = require('../../utils/helper')

// ========== 枚举白名单 ==========
const CONDITION_MAP = { '1': true, '2': true, '3': true, '4': true }
// tradeType 已改为自由文本字符串，不再校验枚举
// status 已拆分为 seller_status / buyer_status

const isValidEnum = (value, map) => map[value] === true

// ========== 新旧程度映射 ==========
const CONDITION_TEXT = { '1': '全新', '2': '几乎全新', '3': '轻微痕迹', '4': '明显痕迹' }
function mapCondition(v) { return CONDITION_TEXT[v] || v || '' }

// ========== 1. 商品发布 ==========
async function publishGoods(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { 
    title, description, category, subCategory, price, originalPrice,
    condition, tradeType, images, video, tags, attrs, relatedTopics
  } = event.data || {}

  // 校验（使用导入的 validatePublish）
  // validatePublish(event.data)

  if (!OPENID) throw new Error('无法获取当前用户身份，请重新登录')

  // 金额转分
  const priceInFen = Math.round(price * 100)
  const originalPriceInFen = originalPrice ? Math.round(originalPrice * 100) : undefined

  // 写入数据库
  const result = await db.collection('goods').add({
    data: {
      title: title.trim(),
      description: (description || '').trim(),
      category,
      subCategory,
      price: priceInFen,
      originalPrice: originalPriceInFen,
      condition,
      tradeType,
      seller_status: SELLER_STATUS.HAVE_PUB,    // 已发布
      buyer_status: BUYER_STATUS.NONE,           // 无买家
      images,
      video: video || '',
      tags: tags || [],
      attrs: attrs || {},
      sellerInfo: { _id: OPENID },
      relatedTopics: relatedTopics || '',
      likeCount: 0,
      createdAt: Date.now()
    }
  })

  // 将商品ID追加到用户发布列表
  const _ = db.command
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0) {
    await db.collection('users').doc(userRes.data[0]._id).update({
      data: { publishedGoods: _.push(result._id) }
    })
  }

  return {
    goodsId: result._id,
    message: '商品发布成功'
  }
}

// ========== 2. 商品详情 ==========
async function getGoodsDetail(event) {
  const db = event.db
  const { GoodId } = event.data || {}
  validateGoodsId(GoodId)  // 使用导入的 validateGoodsId

  const goodsRes = await db.collection('goods').doc(GoodId).get()
  const goods = goodsRes.data
  if (!goods) throw new Error('商品不存在或已下架')

  let sellerInfo = {}
  if (goods.sellerInfo && goods.sellerInfo._id) {
    try {
      sellerInfo = await getUserByOpenId(db, goods.sellerInfo._id)
    } catch (e) { /* 忽略 */ }
  }

  // 评论查询: detail_type=2 表示商品评论
  let comments = []
  try {
    const commentsRes = await db.collection('topics')
      .where({ detail_type: 2, postId: GoodId, type: '3' })
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
    for (const c of (commentsRes.data || [])) {
      let authorInfo = {}
      if (c.authorInfo && c.authorInfo._id) {
        try {
          authorInfo = await getUserByOpenId(db, c.authorInfo._id)
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
  } catch (e) { /* 忽略 */ }

  // 推荐商品
  let recommendGoods = { goods_num: 0, goods_list: [] }
  if (goods.category) {
    try {
      const recRes = await db.collection('goods')
        .where({
          category: goods.category,
          seller_status: SELLER_STATUS.HAVE_PUB,   // 仅推荐在售商品
          _id: db.command.neq(GoodId)
        })
        .orderBy('likeCount', 'desc')
        .limit(5)
        .get()
      const list = recRes.data || []
      recommendGoods = {
        goods_num: list.length,
        goods_list: list.map(g => ({
          id: g._id,
          title: g.title || '',
          price: (g.price || 0) / 100,
          condition: mapCondition(g.condition),
          sellerId: g.sellerInfo?._id || '',
          sellerAvatarCDN: '',
          sellerName: g.sellerInfo?.nickName || '',
          firstPictureCDN: g.images?.[0] || ''
        }))
      }
    } catch (e) { /* 忽略 */ }
  }

  return {
    title: goods.title || '',
    sellerId: goods.sellerInfo?._id || '',
    sellerAvatarCDN: sellerInfo.avatarUrl || '',
    sellerName: sellerInfo.nickName || '匿名用户',
    PictureCDN: goods.images || [],
    price: (goods.price || 0) / 100,
    condition: mapCondition(goods.condition),
    desc: goods.description || '',
    tradeWays: goods.tradeType || '',
    comments,
    is_favorited: false,
    recommend_goods: recommendGoods
  }
}

// ========== 3. 商品列表 ==========
async function getGoodsList(event) {
  const db = event.db
  const { page = 1, pageSize = 10, category, keyword, relatedTopics } = event.data || {}

  const where = { seller_status: SELLER_STATUS.HAVE_PUB }   // 仅展示在售商品
  if (category) where.category = category
  if (keyword) {
    where.title = db.RegExp({ regexp: keyword, options: 'i' })
  }
  if (relatedTopics) {
    where.relatedTopics = relatedTopics
  }

  const res = await db.collection('goods')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []

  // 联查卖家信息（头像和昵称）
  const formattedList = []
  for (const g of list) {
    let sellerInfo = {}
    if (g.sellerInfo && g.sellerInfo._id) {
      try {
        sellerInfo = await getUserByOpenId(db, g.sellerInfo._id)
      } catch (e) { /* 忽略 */ }
    }
    formattedList.push({
      id: g._id,
      title: g.title || '',
      price: (g.price || 0) / 100,
      condition: mapCondition(g.condition),
      sellerId: g.sellerInfo?._id || '',
      sellerAvatarCDN: sellerInfo.avatarUrl || '',
      sellerName: sellerInfo.nickName || '匿名用户',
      firstPictureCDN: g.images?.[0] || ''
    })
  }

  return {
    goods_num: formattedList.length,
    goods_list: formattedList
  }
}

// ========== 4. AI 生成商品描述 ==========
async function generateGoodsDescription(event) {
  const { title, user_brief, price, condition } = event.data || {}

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('标题不能为空')
  }
  if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
    throw new Error('价格必须为非负数字')
  }

  const description = await generateDescription({
    title: title.trim(),
    user_brief: (user_brief || '').trim(),
    price: price,
    condition: String(condition || '1')
  })

  return {
    description: description,
    generated: description !== null,
    message: description ? 'AI 生成成功' : 'AI 生成失败，请手动填写'
  }
}

// ========== 5. 商品状态流转（卖方/买方操作按钮） ==========
async function updateGoodsStatus(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { goodsId, action } = event.data || {}

  if (!OPENID) throw new Error('无法获取当前用户身份，请重新登录')
  validateGoodsId(goodsId)

  const goodsRes = await db.collection('goods').doc(goodsId).get()
  const goods = goodsRes.data
  if (!goods) throw new Error('商品不存在')

  switch (action) {

    // ====== 卖方操作 ======
    case 'shelve':  // 下架（1have_pub → 4all_down）
      if (goods.sellerInfo?._id !== OPENID) throw new Error('只有卖家可以下架')
      await db.collection('goods').doc(goodsId).update({
        data: { seller_status: SELLER_STATUS.ALL_DOWN, buyer_status: BUYER_STATUS.HAVE_DOWN }
      })
      return { message: '已下架', seller_status: SELLER_STATUS.ALL_DOWN }

    case 'deliver':  // 发货（2waited_for_del → 3waited_for_dis）
      if (goods.sellerInfo?._id !== OPENID) throw new Error('只有卖家可以发货')
      if (goods.seller_status !== SELLER_STATUS.WAITED_FOR_DEL) throw new Error('当前状态不允许发货')
      await db.collection('goods').doc(goodsId).update({
        data: { seller_status: SELLER_STATUS.WAITED_FOR_DIS }
      })
      return { message: '已发货', seller_status: SELLER_STATUS.WAITED_FOR_DIS }

    // ====== 买方操作 ======
    case 'cancel': {  // 取消订单（1waited_for_pay）
      // 验证是否是当前买家
      const buyerOpenid = OPENID
      // 1. 当前商品标记为取消
      await db.collection('goods').doc(goodsId).update({
        data: { seller_status: SELLER_STATUS.ALL_DOWN, buyer_status: BUYER_STATUS.HAVE_DOWN }
      })
      // 2. 复制一份新商品（重新上架）
      const _ = db.command
      const newGoods = { ...goods }
      delete newGoods._id
      newGoods.seller_status = SELLER_STATUS.HAVE_PUB
      newGoods.buyer_status = BUYER_STATUS.NONE
      newGoods.createdAt = Date.now()
      const newRes = await db.collection('goods').add({ data: newGoods })
      // 3. 更新卖家的 publishedGoods（移除旧ID，添加新ID）
      const sellerRes = await db.collection('users').where({ _openid: goods.sellerInfo?._id }).get()
      if (sellerRes.data.length > 0) {
        const seller = sellerRes.data[0]
        await db.collection('users').doc(seller._id).update({
          data: { publishedGoods: _.pull(goodsId) }
        })
        await db.collection('users').doc(seller._id).update({
          data: { publishedGoods: _.push(newRes._id) }
        })
      }
      // 4. 移除买家的 getGood
      const buyerRes = await db.collection('users').where({ _openid: buyerOpenid }).get()
      if (buyerRes.data.length > 0) {
        await db.collection('users').doc(buyerRes.data[0]._id).update({
          data: { getGood: _.pull(goodsId) }
        })
      }
      return { message: '已取消，商品已重新上架', newGoodsId: newRes._id }
    }

    case 'pay':  // 付款（1waited_for_pay → 2waited_for_get）
      if (goods.buyer_status !== BUYER_STATUS.WAITED_FOR_PAY) throw new Error('当前状态不允许付款')
      await db.collection('goods').doc(goodsId).update({
        data: { buyer_status: BUYER_STATUS.WAITED_FOR_GET }
      })
      return { message: '已付款' }

    case 'refund': {  // 退款（2waited_for_get → 4have_down，卖家→4all_down）
      if (goods.buyer_status !== BUYER_STATUS.WAITED_FOR_GET) throw new Error('当前状态不允许退款')
      await db.collection('goods').doc(goodsId).update({
        data: { buyer_status: BUYER_STATUS.HAVE_DOWN, seller_status: SELLER_STATUS.ALL_DOWN }
      })
      return { message: '已退款' }
    }

    case 'confirm':  // 确认收货（2waited_for_get → 3waited_for_dis）
      if (goods.buyer_status !== BUYER_STATUS.WAITED_FOR_GET) throw new Error('当前状态不允许确认收货')
      await db.collection('goods').doc(goodsId).update({
        data: { buyer_status: BUYER_STATUS.WAITED_FOR_DIS }
      })
      return { message: '已确认收货，请评价' }

    case 'evaluateSeller':  // 卖方评价完成 → seller_status变为4all_down
      if (goods.sellerInfo?._id !== OPENID) throw new Error('只有卖家可以操作')
      await db.collection('goods').doc(goodsId).update({
        data: { seller_status: SELLER_STATUS.ALL_DOWN }
      })
      return { message: '评价完成' }

    case 'evaluateBuyer':  // 买方评价完成 → buyer_status变为4have_down
      if (goods.buyer_status !== BUYER_STATUS.WAITED_FOR_DIS) throw new Error('当前状态不允许')
      await db.collection('goods').doc(goodsId).update({
        data: { buyer_status: BUYER_STATUS.HAVE_DOWN }
      })
      return { message: '评价完成' }

    default:
      throw new Error('未知操作: ' + action)
  }
}

module.exports = {
  getGoodsDetail,
  getGoodsList,
  publishGoods,
  generateGoodsDescription,
  updateGoodsStatus
}