// modules/review/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const reviewService = require('./service')

exports.submitReview = catchAsync(async (event) => {
  const data = await reviewService.submitReview(event)
  return SUCCESS(data)
})

exports.getReviewList = catchAsync(async (event) => {
  const data = await reviewService.getReviewList(event)
  return SUCCESS(data)
})