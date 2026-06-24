// modules/goods/service.js
const { generateDescription } = require('../../utils/aiClient')
const { validateGoodsId } = require('./validator')
const { SELLER_STATUS, BUYER_STATUS, CONDITION } = require('../../constants/enums')

// ========== 枚举白名单 ==========
const CONDITION_MAP = { '1': true, '2': true, '3': true, '4': true }
// tradeType 已改为自由文本字符串，不再校验枚举
// status 已拆分为 seller_status / buyer_status

const isValidEnum = (value, map) => map[value] === true

// ========== 1. 商品发布 ==========
async function publishGoods(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { 
    title, description, category, subCategory, price, originalPrice,
    condition, tradeType, images, video, tags, attrs 
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
      const sellerRes = await db.collection('users').doc(goods.sellerInfo._id).get()
      sellerInfo = sellerRes.data || {}
    } catch (e) { /* 忽略 */ }
  }

  // 评论查询
  let comments = []
  try {
    const commentsRes = await db.collection('topics')
      .where({ linkedGoodsInfo: { _id: GoodId }, type: '3' })
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
          condition: g.condition || '',
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
    condition: goods.condition || '',
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
  const { page = 1, pageSize = 10, category, keyword } = event.data || {}

  const where = { seller_status: SELLER_STATUS.HAVE_PUB }   // 仅展示在售商品
  if (category) where.category = category
  if (keyword) {
    where.title = db.RegExp({ regexp: keyword, options: 'i' })
  }

  const res = await db.collection('goods')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  return {
    goods_num: list.length,
    goods_list: list.map(g => ({
      id: g._id,
      title: g.title || '',
      price: (g.price || 0) / 100,
      condition: g.condition || '',
      sellerId: g.sellerInfo?._id || '',
      sellerAvatarCDN: '',
      sellerName: g.sellerInfo?.nickName || '',
      firstPictureCDN: g.images?.[0] || ''
    }))
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

module.exports = {
  getGoodsDetail,
  getGoodsList,
  publishGoods,
  generateGoodsDescription
}