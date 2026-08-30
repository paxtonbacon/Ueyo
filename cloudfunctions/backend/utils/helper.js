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

/**
 * 通过 _openid 查询用户（非 doc._id）
 * @returns {Object} 用户数据，查不到返回 {}
 */
async function getUserByOpenId(db, openid) {
  if (!openid) return {}
  const res = await db.collection('users').where({ _openid: openid }).get()
  return (res.data && res.data[0]) || {}
}

/**
 * 通过 _openid 更新用户（非 doc._id）
 */
async function updateUserByOpenId(db, openid, data) {
  if (!openid) return
  const res = await db.collection('users').where({ _openid: openid }).get()
  if (res.data && res.data.length > 0) {
    await db.collection('users').doc(res.data[0]._id).update({ data })
  }
}

module.exports = { catchAsync, getUserByOpenId, updateUserByOpenId }