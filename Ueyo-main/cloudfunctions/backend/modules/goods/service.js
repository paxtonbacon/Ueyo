// modules/goods/service.js
const { validateGoodsId } = require('./validator')

// ========== 枚举值白名单（与数据库模型严格对齐） ==========
const CONDITION_MAP = { '1': true, '2': true, '3': true, '4': true }
const TRADE_TYPE_MAP = { '1': true, '2': true, '3': true }
const STATUS_MAP = { '1': true, '2': true, '3': true, '4': true }

// ========== 工具函数：校验枚举值 ==========
const isValidEnum = (value, map) => map[value] === true

// ========== 商品发布（带完整手写校验） ==========
async function publishGoods(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { 
    title, description, category, subCategory, price, originalPrice,
    condition, tradeType, images, video, tags, attrs 
  } = event.data || {}

  // ----- 必填字段校验 -----
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('商品标题不能为空')
  }
  if (title.length > 120) {
    throw new Error('商品标题不能超过120个字符')
  }
  if (!category || typeof category !== 'string') {
    throw new Error('一级分类不能为空')
  }
  if (!subCategory || typeof subCategory !== 'string') {
    throw new Error('二级分类不能为空')
  }
  if (price === undefined || price === null || typeof price !== 'number' || price < 0) {
    throw new Error('价格必须为非负数字')
  }
  if (!images || !Array.isArray(images) || images.length === 0) {
    throw new Error('至少上传一张图片')
  }
  if (images.length > 5) {
    throw new Error('图片最多5张')
  }

  // ----- 枚举值校验 -----
  if (!isValidEnum(condition, CONDITION_MAP)) {
    throw new Error(`新旧程度必须为 1-4，当前值: ${condition}`)
  }
  if (!isValidEnum(tradeType, TRADE_TYPE_MAP)) {
    throw new Error(`交易方式必须为 1-3，当前值: ${tradeType}`)
  }

  // ----- 金额转分（防止浮点误差） -----
  const priceInFen = Math.round(price * 100)
  const originalPriceInFen = originalPrice ? Math.round(originalPrice * 100) : undefined

  // ----- 关联字段校验 -----
  if (!OPENID) {
    throw new Error('无法获取当前用户身份，请重新登录')
  }

  // ----- 写入数据库 -----
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
      status: '1',  // 默认在售
      images,
      video: video || '',
      tags: tags || [],
      attrs: attrs || {},
      sellerInfo: { _id: OPENID },
      likeCount: 0,
      createdAt: Date.now()
    }
  })

  return {
    goodsId: result._id,
    message: '商品发布成功（已通过校验）'
  }
}

// ========== 商品详情（保持原样，无需改动） ==========
async function getGoodsDetail(event) {
  const db = event.db
  const { GoodId } = event.data || {}
  validateGoodsId(GoodId)

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

  // 评论查询（如有 topics 集合）
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

  let recommendGoods = { goods_num: 0, goods_list: [] }
  if (goods.category) {
    try {
      const recRes = await db.collection('goods')
        .where({
          category: goods.category,
          status: '1',
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

// ========== 商品列表（保持原样） ==========
async function getGoodsList(event) {
  const db = event.db
  const { page = 1, pageSize = 10, category, keyword } = event.data || {}

  const where = { status: '1' }
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

module.exports = { getGoodsDetail, getGoodsList, publishGoods }