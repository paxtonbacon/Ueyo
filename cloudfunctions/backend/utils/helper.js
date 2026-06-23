// utils/helper.js
const { ERROR } = require('../constants/response')

const catchAsync = (fn) => {
  return async (event) => {
    try {
      return await fn(event)
    } catch (error) {
      console.error('【业务异常】', error.message)
      return ERROR(500, error.message || '服务器内部错误')
    }
  }
}

module.exports = { catchAsync }