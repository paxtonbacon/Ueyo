// modules/social/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const socialService = require('./service')

exports.getTopicList = catchAsync(async (event) => {
  const data = await socialService.getTopicList(event)
  return SUCCESS(data)
})

exports.getPostList = catchAsync(async (event) => {
  const data = await socialService.getPostList(event)
  return SUCCESS(data)
})

exports.getTopicPosts = catchAsync(async (event) => {
  const data = await socialService.getTopicPosts(event)
  return SUCCESS(data)
})

exports.getPostDetail = catchAsync(async (event) => {
  const data = await socialService.getPostDetail(event)
  return SUCCESS(data)
})

exports.publishPost = catchAsync(async (event) => {
  const data = await socialService.publishPost(event)
  return SUCCESS(data)
})

exports.submitReply = catchAsync(async (event) => {
  const data = await socialService.submitReply(event)
  return SUCCESS(data)
})