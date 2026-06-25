// modules/user/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const userService = require('./service')

exports.wxLogin = catchAsync(async (event) => {
  const data = await userService.wxLogin(event)
  return SUCCESS(data)
})

exports.emailRegister = catchAsync(async (event) => {
  const data = await userService.emailRegister(event)
  return SUCCESS(data)
})

exports.verifyEmail = catchAsync(async (event) => {
  const data = await userService.verifyEmail(event)
  return SUCCESS(data)
})

exports.emailLogin = catchAsync(async (event) => {
  const data = await userService.emailLogin(event)
  return SUCCESS(data)
})

exports.getProfile = catchAsync(async (event) => {
  const data = await userService.getProfile(event)
  return SUCCESS(data)
})

exports.updateProfile = catchAsync(async (event) => {
  const data = await userService.updateProfile(event)
  return SUCCESS(data)
})

exports.getFavorites = catchAsync(async (event) => {
  const data = await userService.getFavorites(event)
  return SUCCESS(data)
})

exports.toggleFavorite = catchAsync(async (event) => {
  const data = await userService.toggleFavorite(event)
  return SUCCESS(data)
})

exports.myGoods = catchAsync(async (event) => {
  const data = await userService.myGoods(event)
  return SUCCESS(data)
})

exports.myBounties = catchAsync(async (event) => {
  const data = await userService.myBounties(event)
  return SUCCESS(data)
})