// modules/order/service.js
const { validateOrderId, validateCreateOrder } = require('./validator')
const { SELLER_STATUS, BUYER_STATUS } = require('../../constants/enums')

// ========== 1. 创建订单（购买） ==========
async function createOrder(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { goodsId, tradeType, meetLocation, meetTime } = event.data || {}

  if (!OPENID) throw new Error('用户未登录')
  validateCreateOrder(event.data)

  // 1. 查询商品信息
  const goodsRes = await db.collection('goods').doc(goodsId).get()
  const goods = goodsRes.data
  if (!goods) throw new Error('商品不存在')
  if (goods.seller_status !== SELLER_STATUS.HAVE_PUB) throw new Error('商品已下架或已售出')

  // 2. 生成订单号
  const orderNo = 'ORD' + Date.now() + Math.floor(Math.random() * 1000)

  // 3. 创建订单
  const orderData = {
    orderNo: orderNo,
    amount: goods.price,
    tradeType: tradeType,
    orderStatus: '1', // 待支付
    payStatus: '1',   // 未支付
    refundStatus: '1',
    buyerInfo: { _id: OPENID },
    sellerInfo: goods.sellerInfo,
    goodsInfo: { _id: goodsId },
    goodsSnapshot: {
      title: goods.title,
      price: goods.price,
      images: goods.images,
      description: goods.description
    },
    createdAt: Date.now()
  }

  // 如有面交地点则记录（tradeType 已改为自由文本，不再用枚举判断）
  if (meetLocation) {
    orderData.meetingInfo = { place: meetLocation, time: meetTime || null }
  }

  const result = await db.collection('orders').add({ data: orderData })

  // 4. 更新商品状态：买家→待付款，卖家→待发货(预留)
  await db.collection('goods').doc(goodsId).update({
    data: {
      buyer_status: BUYER_STATUS.WAITED_FOR_PAY,
      seller_status: SELLER_STATUS.WAITED_FOR_DEL
    }
  })

  // 5. 将商品ID追加到买家的 getGood 列表
  const _ = db.command
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0) {
    await db.collection('users').doc(userRes.data[0]._id).update({
      data: { getGood: _.push(goodsId) }
    })
  }

  return {
    orderId: result._id,
    orderNo: orderNo,
    amount: goods.price / 100,
    message: '订单创建成功，请支付'
  }
}

// ========== 2. 查询订单列表 ==========
async function getOrderList(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { role = 'buyer', page = 1, pageSize = 10 } = event.data || {}

  if (!OPENID) throw new Error('用户未登录')

  const where = {}
  if (role === 'buyer') {
    where['buyerInfo._id'] = OPENID
  } else if (role === 'seller') {
    where['sellerInfo._id'] = OPENID
  } else {
    throw new Error('角色参数错误')
  }

  const res = await db.collection('orders')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  // 格式化返回
  const formatted = list.map(o => ({
    orderId: o._id,
    orderNo: o.orderNo,
    amount: o.amount / 100,
    orderStatus: o.orderStatus,
    payStatus: o.payStatus,
    goodsTitle: o.goodsSnapshot?.title || '',
    firstPictureCDN: o.goodsSnapshot?.images?.[0] || '',
    createdAt: o.createdAt,
    // 其他需要的字段可补充
  }))

  return {
    total: list.length,
    orders: formatted
  }
}

// ========== 3. 订单详情 ==========
async function getOrderDetail(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { orderId } = event.data || {}
  validateOrderId(orderId)

  if (!OPENID) throw new Error('用户未登录')

  const orderRes = await db.collection('orders').doc(orderId).get()
  const order = orderRes.data
  if (!order) throw new Error('订单不存在')

  // 权限校验：只有买家或卖家能查看
  if (order.buyerInfo._id !== OPENID && order.sellerInfo._id !== OPENID) {
    throw new Error('无权查看该订单')
  }

  // 可展开买家/卖家信息
  let buyerInfo = {}
  if (order.buyerInfo && order.buyerInfo._id) {
    const buyerRes = await db.collection('users').doc(order.buyerInfo._id).get()
    buyerInfo = buyerRes.data || {}
  }
  let sellerInfo = {}
  if (order.sellerInfo && order.sellerInfo._id) {
    const sellerRes = await db.collection('users').doc(order.sellerInfo._id).get()
    sellerInfo = sellerRes.data || {}
  }

  return {
    orderId: order._id,
    orderNo: order.orderNo,
    amount: order.amount / 100,
    tradeType: order.tradeType,
    orderStatus: order.orderStatus,
    payStatus: order.payStatus,
    refundStatus: order.refundStatus,
    goodsSnapshot: order.goodsSnapshot,
    buyerInfo: {
      userId: buyerInfo._id,
      nickName: buyerInfo.nickName || '',
      avatarUrl: buyerInfo.avatarUrl || ''
    },
    sellerInfo: {
      userId: sellerInfo._id,
      nickName: sellerInfo.nickName || '',
      avatarUrl: sellerInfo.avatarUrl || ''
    },
    meetingInfo: order.meetingInfo || null,
    payTime: order.payTime || null,
    deliveryTime: order.deliveryTime || null,
    completeTime: order.completeTime || null,
    createdAt: order.createdAt
  }
}

// ========== 4. 取消订单 ==========
async function cancelOrder(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { orderId } = event.data || {}
  validateOrderId(orderId)

  if (!OPENID) throw new Error('用户未登录')

  const orderRes = await db.collection('orders').doc(orderId).get()
  const order = orderRes.data
  if (!order) throw new Error('订单不存在')
  if (order.buyerInfo._id !== OPENID) throw new Error('只有买家可以取消订单')
  if (order.orderStatus !== '1') throw new Error('只有待支付订单可以取消')

  await db.collection('orders').doc(orderId).update({
    data: {
      orderStatus: '6', // 已取消
      canceledAt: Date.now()
    }
  })

  // 恢复商品状态为"在售"
  if (order.goodsInfo && order.goodsInfo._id) {
    await db.collection('goods').doc(order.goodsInfo._id).update({
      data: {
        seller_status: SELLER_STATUS.HAVE_PUB,
        buyer_status: BUYER_STATUS.NONE
      }
    })
  }

  return { message: '订单已取消' }
}

// ========== 5. 确认收货 ==========
async function confirmOrder(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { orderId } = event.data || {}
  validateOrderId(orderId)

  if (!OPENID) throw new Error('用户未登录')

  const orderRes = await db.collection('orders').doc(orderId).get()
  const order = orderRes.data
  if (!order) throw new Error('订单不存在')
  if (order.buyerInfo._id !== OPENID) throw new Error('只有买家可以确认收货')
  if (order.orderStatus !== '3') throw new Error('当前订单状态不是待收货')

  await db.collection('orders').doc(orderId).update({
    data: {
      orderStatus: '4', // 已完成
      completeTime: Date.now()
    }
  })

  // 更新商品状态：双方都进入待评价
  if (order.goodsInfo && order.goodsInfo._id) {
    await db.collection('goods').doc(order.goodsInfo._id).update({
      data: {
        seller_status: SELLER_STATUS.WAITED_FOR_DIS,
        buyer_status: BUYER_STATUS.WAITED_FOR_DIS
      }
    })
  }

  return { message: '确认收货成功' }
}

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder,
  confirmOrder
}