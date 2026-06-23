// modules/goods/validator.js
const validateGoodsId = (goodsId) => {
  if (!goodsId || typeof goodsId !== 'string') {
    throw new Error('商品ID不能为空且必须为字符串')
  }
  return true
}

module.exports = { validateGoodsId }