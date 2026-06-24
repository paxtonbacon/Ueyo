// constants/enums.js
module.exports = {
  GOODS_STATUS: {
    ON_SALE: '1',      // 出售中
    RESERVED: '2',     // 已预留
    SOLD_OUT: '3',     // 已售出
    OFF_SALE: '4'      // 已下架
  },
  CONDITION: {
    NEW: '1',
    LIKE_NEW: '2',
    SLIGHT_TRACE: '3',
    OBVIOUS_TRACE: '4'
  }
  // TRADE_TYPE 已废弃，改为用户自由输入文本字符串
}