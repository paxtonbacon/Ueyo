// utils/jwt.js — JWT 签发与验证（HS256）
const crypto = require('crypto')

// ⚠️ 生产环境应使用环境变量存储，此处为开发用密钥
const JWT_SECRET = 'ueyo_jwt_secret_2026_dev'

/**
 * 签发 JWT Token
 * @param {Object} payload - 载荷 { userId, openId, email, authLevel }
 * @param {number} expiresIn - 过期时间（秒），默认 7 天
 */
function sign(payload, expiresIn = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)

  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload))
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64')

  return `${headerB64}.${payloadB64}.${toBase64Url(signature)}`
}

/**
 * 验证并解析 JWT Token
 * @returns {Object|null} 解析后的 payload，无效则返回 null
 */
function verify(token) {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signature] = parts

  // 验证签名
  const expectedSig = toBase64Url(crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64'))

  if (signature !== expectedSig) return null

  // 解析并检查过期
  try {
    const payload = JSON.parse(base64UrlDecode(payloadB64))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null // 已过期
    return payload
  } catch (e) {
    return null
  }
}

// ========== 辅助函数 ==========
function toBase64Url(b64) {
  return b64.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(str) {
  // 补齐 padding
  let padded = str.replace(/-/g, '+').replace(/_/g, '/')
  while (padded.length % 4) padded += '='
  return Buffer.from(padded, 'base64').toString('utf8')
}

module.exports = { sign, verify }
