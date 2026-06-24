// utils/auth.js — 鉴权中间件
const jwt = require('./jwt')

/**
 * 鉴权中间件：从 cloud 上下文获取 openid，从请求头/JWT 获取用户身份
 * 
 * 鉴权层级：
 *   一级鉴权 — cloud 环境自动注入 event.OPENID（微信 openid），确保是真实微信用户
 *   二级鉴权 — JWT 中的 email/authLevel，标识用户已完成邮箱注册/验证
 * 
 * 使用方式：
 *   const { requireAuth, getAuthInfo } = require('../../utils/auth')
 *   const auth = requireAuth(event)  // 未登录抛错
 *   const { openId, userId, email, authLevel } = auth
 */
function getAuthInfo(event) {
  const openId = event.OPENID || ''
  let userId = null
  let email = null
  let authLevel = 0 // 0=未注册, 1=已注册(邮箱), 2=已验证(邮箱)

  // 从请求数据中提取 JWT
  const token = (event.data && event.data.__auth) || event.__auth || ''

  if (token) {
    const payload = jwt.verify(token)
    if (payload) {
      userId = payload.userId || null
      email = payload.email || null
      authLevel = payload.authLevel || 0
    }
  }

  return { openId, userId, email, authLevel, isAuthed: authLevel >= 1 }
}

/**
 * 要求用户已登录（一级鉴权：必须有 openid）
 */
function requireAuth(event) {
  const auth = getAuthInfo(event)
  if (!auth.openId) {
    throw new Error('未获取到用户身份（openid），请重新登录')
  }
  return auth
}

/**
 * 要求用户已完成邮箱注册（二级鉴权）
 */
function requireEmailAuth(event) {
  const auth = getAuthInfo(event)
  if (!auth.openId) {
    throw new Error('未获取到用户身份（openid），请重新登录')
  }
  if (auth.authLevel < 1) {
    throw new Error('请先完成邮箱注册')
  }
  return auth
}

module.exports = { getAuthInfo, requireAuth, requireEmailAuth }

module.exports = { getAuthInfo, requireAuth, requireEmailAuth }
