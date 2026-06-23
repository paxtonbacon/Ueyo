// modules/review/validator.js

const validateOrderId = (orderId) => {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('订单ID不能为空且必须为字符串')
  }
  return true
}

const validateSubmitReview = (data) => {
  const { orderId, rating, content } = data
  if (!orderId) throw new Error('订单ID不能为空')
  if (rating === undefined || rating === null || typeof rating !== 'number') {
    throw new Error('评分必须为数字')
  }
  if (rating < 1 || rating > 5) {
    throw new Error('评分必须在1-5之间')
  }
  if (content && content.length > 500) {
    throw new Error('评价内容不能超过500个字符')
  }
  return true
}

module.exports = { validateOrderId, validateSubmitReview }