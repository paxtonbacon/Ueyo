// modules/bounty/controller.js
const { SUCCESS } = require('../../constants/response')
const { catchAsync } = require('../../utils/helper')
const bountyService = require('./service')

exports.publishBounty = catchAsync(async (event) => {
  const data = await bountyService.publishBounty(event)
  return SUCCESS(data)
})

exports.getBountyList = catchAsync(async (event) => {
  const data = await bountyService.getBountyList(event)
  return SUCCESS(data)
})

exports.getBountyDetail = catchAsync(async (event) => {
  const data = await bountyService.getBountyDetail(event)
  return SUCCESS(data)
})

exports.takeBounty = catchAsync(async (event) => {
  const data = await bountyService.takeBounty(event)
  return SUCCESS(data)
})

exports.updateBountyStatus = catchAsync(async (event) => {
  const data = await bountyService.updateBountyStatus(event)
  return SUCCESS(data)
})