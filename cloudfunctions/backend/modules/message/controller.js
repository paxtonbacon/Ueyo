// modules/message/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const messageService = require('./service')

exports.getConversations = catchAsync(async (event) => {
  const data = await messageService.getConversations(event)
  return SUCCESS(data)
})

exports.getMessages = catchAsync(async (event) => {
  const data = await messageService.getMessages(event)
  return SUCCESS(data)
})

exports.sendMessage = catchAsync(async (event) => {
  const data = await messageService.sendMessage(event)
  return SUCCESS(data)
})
