// modules/bounty_order/service.js — 悬赏订单流转
const { PUT_STATUS, GET_STATUS } = require('../../constants/enums')

// ========== 1. 创建悬赏订单（接单） ==========
async function createBountyOrder(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { bountyId, tradeType } = event.data || {}

  if (!OPENID) throw new Error('用户未登录')
  if (!bountyId) throw new Error('悬赏ID不能为空')

  // 1. 查询悬赏信息
  const bountyRes = await db.collection('bounties').doc(bountyId).get()
  const bounty = bountyRes.data
  if (!bounty) throw new Error('悬赏不存在')

  // 2. 生成订单号
  const orderNo = 'BTO' + Date.now() + Math.floor(Math.random() * 1000)

  // 3. 写入悬赏订单表
  const orderData = {
    orderNo: orderNo,
    amount: bounty.expectedPrice || 0,
    tradeType: tradeType || '面交/快递均可',
    orderStatus: '1',          // 待履约
    putterInfo: bounty.buyerInfo,     // 发布者
    takerInfo: { _id: OPENID },       // 接单者
    bountyInfo: { _id: bountyId },
    bountySnapshot: {
      title: bounty.title || '',
      price: bounty.expectedPrice || 0,
      images: bounty.images || [],
      description: bounty.description || ''
    },
    createdAt: Date.now()
  }

  const result = await db.collection('bounties_order').add({ data: orderData })

  // 4. 更新悬赏状态：发布者→待评价，接收者→待履约，同时写入接单者信息
  await db.collection('bounties').doc(bountyId).update({
    data: {
      put_status: PUT_STATUS.WAITED_FOR_DIS,
      get_status: GET_STATUS.WAITED_FOR_DO,
      takerInfo: { _id: OPENID },
      updatedAt: Date.now()
    }
  })

  // 5. 将悬赏ID追加到接单者的 acceptTasks 列表
  const _ = db.command
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (userRes.data.length > 0) {
    await db.collection('users').doc(userRes.data[0]._id).update({
      data: { acceptTasks: _.push(bountyId) }
    })
  }

  return {
    orderId: result._id,
    orderNo: orderNo,
    amount: (bounty.expectedPrice || 0) / 100,
    message: '接单成功'
  }
}

// ========== 2. 悬赏订单列表 ==========
async function getBountyOrderList(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { role = 'taker', page = 1, pageSize = 10 } = event.data || {}

  if (!OPENID) throw new Error('用户未登录')

  const where = {}
  if (role === 'taker') {
    where['takerInfo._id'] = OPENID
  } else if (role === 'putter') {
    where['putterInfo._id'] = OPENID
  } else {
    throw new Error('角色参数错误（应为 taker 或 putter）')
  }

  const res = await db.collection('bounties_order')
    .where(where)
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = res.data || []
  const formatted = list.map(o => ({
    orderId: o._id,
    orderNo: o.orderNo,
    amount: o.amount / 100,
    orderStatus: o.orderStatus,
    goodsTitle: o.bountySnapshot?.title || '',
    firstPictureCDN: o.bountySnapshot?.images?.[0] || '',
    createdAt: o.createdAt
  }))

  return { total: list.length, orders: formatted }
}

// ========== 3. 确认完成（悬赏人确认） ==========
async function confirmBountyOrder(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { orderId } = event.data || {}

  if (!OPENID) throw new Error('用户未登录')
  if (!orderId) throw new Error('订单ID不能为空')

  const orderRes = await db.collection('bounties_order').doc(orderId).get()
  const order = orderRes.data
  if (!order) throw new Error('订单不存在')
  if (order.putterInfo._id !== OPENID) throw new Error('只有悬赏发布者可以确认完成')

  await db.collection('bounties_order').doc(orderId).update({
    data: {
      orderStatus: '3',     // 待评价
      completeTime: Date.now()
    }
  })

  // 更新悬赏状态：双方都进入待评价
  if (order.bountyInfo && order.bountyInfo._id) {
    await db.collection('bounties').doc(order.bountyInfo._id).update({
      data: {
        put_status: PUT_STATUS.WAITED_FOR_DIS,
        get_status: GET_STATUS.WAITED_FOR_DIS
      }
    })
  }

  return { message: '确认完成，请评价' }
}

module.exports = { createBountyOrder, getBountyOrderList, confirmBountyOrder }
