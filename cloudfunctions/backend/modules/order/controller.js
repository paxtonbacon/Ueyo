// modules/order/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const orderService = require('./service')

exports.createOrder = catchAsync(async (event) => {
  const data = await orderService.createOrder(event)
  return SUCCESS(data)
})

exports.getOrderList = catchAsync(async (event) => {
  const data = await orderService.getOrderList(event)
  return SUCCESS(data)
})

exports.getOrderDetail = catchAsync(async (event) => {
  const data = await orderService.getOrderDetail(event)
  return SUCCESS(data)
})

exports.cancelOrder = catchAsync(async (event) => {
  const data = await orderService.cancelOrder(event)
  return SUCCESS(data)
})

exports.confirmOrder = catchAsync(async (event) => {
  const data = await orderService.confirmOrder(event)
  return SUCCESS(data)
})