// modules/order/validator.js

const validateOrderId = (orderId) => {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('订单ID不能为空且必须为字符串')
  }
  return true
}

const validateCreateOrder = (data) => {
  const { goodsId, tradeType } = data
  if (!goodsId) throw new Error('商品ID不能为空')
  if (!tradeType) throw new Error('交易方式不能为空')
  return true
}

module.exports = { validateOrderId, validateCreateOrder }