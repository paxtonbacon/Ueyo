// constants/enums.js
module.exports = {
  // ========== 商品卖家状态 ==========
  SELLER_STATUS: {
    HAVE_PUB: '1have_pub',           // 已发布
    WAITED_FOR_DEL: '2waited_for_del', // 待发货
    WAITED_FOR_DIS: '3waited_for_dis', // 待评价
    ALL_DOWN: '4all_down'            // 已完成
  },
  // ========== 商品买家状态 ==========
  BUYER_STATUS: {
    NONE: 'none',                    // 无（未下单）
    WAITED_FOR_PAY: '1waited_for_pay',  // 待付款
    WAITED_FOR_GET: '2waited_for_get',  // 待收货
    WAITED_FOR_DIS: '3waited_for_dis',  // 待评价
    HAVE_DOWN: '4have_down'          // 已完成
  },
  // ========== 悬赏发布者状态 ==========
  PUT_STATUS: {
    HAVEN_PUB: '1haven_pub',         // 已发布
    WAITED_FOR_DIS: '2waited_for_dis', // 待评价
    ALL_DOWN: '3all_down'            // 已完成
  },
  // ========== 悬赏接收者状态 ==========
  GET_STATUS: {
    NONE: 'none',                    // 无（未接单）
    WAITED_FOR_DO: '1waited_for_do',   // 待履约
    WAITED_FOR_DIS: '2waited_for_dis', // 待评价
    HAVE_DOWN: '3have_down'          // 已完成
  },
  // ========== 新旧程度 ==========
  CONDITION: {
    NEW: '1',
    LIKE_NEW: '2',
    SLIGHT_TRACE: '3',
    OBVIOUS_TRACE: '4'
  }
  // TRADE_TYPE 已废弃，改为用户自由输入文本字符串
}