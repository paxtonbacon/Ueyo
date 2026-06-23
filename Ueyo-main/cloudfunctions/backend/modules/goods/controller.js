// modules/goods/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const goodsService = require('./service')

exports.getGoodsDetail = catchAsync(async (event) => {
  const data = await goodsService.getGoodsDetail(event)
  return SUCCESS(data)
})

exports.getGoodsList = catchAsync(async (event) => {
  const data = await goodsService.getGoodsList(event)
  return SUCCESS(data)
})

// 新增：发布商品
exports.publishGoods = catchAsync(async (event) => {
  const data = await goodsService.publishGoods(event)
  return SUCCESS(data)
})

// ========== 新增：AI 生成描述 ==========
exports.generateDescription = catchAsync(async (event) => {
  const data = await goodsService.generateGoodsDescription(event)
  return SUCCESS(data)
})