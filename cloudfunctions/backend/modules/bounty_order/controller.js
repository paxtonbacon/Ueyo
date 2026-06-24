// modules/bounty_order/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const bountyOrderService = require('./service')

exports.createBountyOrder = catchAsync(async (event) => {
  const data = await bountyOrderService.createBountyOrder(event)
  return SUCCESS(data)
})

exports.getBountyOrderList = catchAsync(async (event) => {
  const data = await bountyOrderService.getBountyOrderList(event)
  return SUCCESS(data)
})

exports.confirmBountyOrder = catchAsync(async (event) => {
  const data = await bountyOrderService.confirmBountyOrder(event)
  return SUCCESS(data)
})
