// modules/user/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const userService = require('./service')

exports.wxLogin = catchAsync(async (event) => {
  const data = await userService.wxLogin(event)
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