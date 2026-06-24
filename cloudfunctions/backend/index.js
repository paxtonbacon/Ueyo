// 云函数入口文件 index.js（最终稳定版 - 原生API + 手写校验）
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

// 引入商品控制器
const goodsController = require('./modules/goods/controller')
// 引入悬赏控制器
const bountyController = require('./modules/bounty/controller')
// 引入社区控制器
const socialController = require('./modules/social/controller')
// 引入评价控制器
const reviewController = require('./modules/review/controller')
// 引入消息控制器
const messageController = require('./modules/message/controller')
// 引入用户和订单控制器
const userController = require('./modules/user/controller')
const orderController = require('./modules/order/controller')

const routeMap = {
  'test/ping': async () => ({
    code: 0,
    msg: 'pong（原生API + 手写校验）',
    data: { timestamp: Date.now() }
  }),
  'goods/detail': goodsController.getGoodsDetail,
  'goods/list': goodsController.getGoodsList,
  'goods/publish': goodsController.publishGoods,
  'bounty/list': bountyController.getBountyList,
  'bounty/detail': bountyController.getBountyDetail,
  'bounty/publish': bountyController.publishBounty,
  'bounty/take': bountyController.takeBounty,
  // ===== 社区模块路由 =====
  'social/topic/list': socialController.getTopicList,
  'social/post/list': socialController.getPostList,
  'social/topic/posts': socialController.getTopicPosts,
  'social/post/detail': socialController.getPostDetail,
  'social/post/publish': socialController.publishPost,
  'social/reply/submit': socialController.submitReply,
  'social/topic/create': socialController.createTopic,
  'review/submit': reviewController.submitReview,
  'review/list': reviewController.getReviewList,
   // ===== 用户模块 =====
   'user/wxlogin': userController.wxLogin,
   'user/profile': userController.getProfile,
   'user/updateProfile': userController.updateProfile,
   'user/favorites': userController.getFavorites,
   'user/toggleFavorite': userController.toggleFavorite,
   // ===== 订单模块 =====
   'order/create': orderController.createOrder,
   'order/list': orderController.getOrderList,
   'order/detail': orderController.getOrderDetail,
   'order/cancel': orderController.cancelOrder,
   'order/confirm': orderController.confirmOrder,
   'goods/generateDesc': goodsController.generateDescription,
   // ===== 消息模块 =====
   'message/conversations': messageController.getConversations,
   'message/list': messageController.getMessages,
   'message/send': messageController.sendMessage,
}

exports.main = async (event, context) => {
  // 注入数据库实例
  event.db = cloud.database()

  // 支持测试模式手动传入 _openid
  let OPENID = event._openid || null
  if (!OPENID) {
    try {
      const wxContext = cloud.getWXContext()
      OPENID = wxContext.OPENID || null
    } catch (e) {}
  }
  event.OPENID = OPENID || ''

  console.log('【请求】action:', event.action, 'OPENID:', event.OPENID)

  const handler = routeMap[event.action]
  if (handler) {
    try {
      return await handler(event)
    } catch (error) {
      console.error('【全局异常】', error.message, error.stack)
      return { code: 500, msg: error.message || '服务器错误', data: null }
    }
  }
  return { code: 404, msg: `接口 "${event.action}" 未找到`, data: null }
}