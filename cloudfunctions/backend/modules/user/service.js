// modules/user/service.js
const { validateUserId, validateUpdateProfile } = require('./validator')

// modules/user/service.js (仅替换 wxLogin 部分)

// ========== 1. 微信登录（支持测试模式） ==========
async function wxLogin(event) {
  const db = event.db
  const { code, openid } = event.data || {}

  let realOpenid = openid // 测试模式直接传入

  // 正式模式：用 code 换取 openid
  if (!realOpenid && code) {
    // 实际应调用微信接口：https://api.weixin.qq.com/sns/jscode2session
    // 此处模拟，实际需使用 axios 或 cloud.callFunction
    // 为了演示，假设返回的 openid 为 'mock_openid_' + code
    // realOpenid = await exchangeCodeForOpenid(code)
    throw new Error('正式环境需实现 code 换取 openid 的逻辑')
  }

  if (!realOpenid) {
    throw new Error('缺少登录凭证 code 或 openid（测试模式）')
  }

  // 查询用户是否存在
  const userRes = await db.collection('users').where({ _openid: realOpenid }).get()
  let user = userRes.data[0]

  if (!user) {
    // 新用户：创建记录
    const result = await db.collection('users').add({
      data: {
        _openid: realOpenid,
        nickName: '微信用户',
        avatarUrl: '',
        creditScore: 100,
        creditLevel: '1',
        authStatus: '1',
        favorites: [],
        createdAt: Date.now()
      }
    })
    user = { _id: result._id, nickName: '微信用户', avatarUrl: '' }
  }

  // 返回用户信息 + 模拟 token
  return {
    userId: user._id,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl,
    token: 'mock-token-' + Date.now()
  }
}

// ========== 2. 获取个人资料 ==========
async function getProfile(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const userRes = await db.collection('users').doc(OPENID).get()
  const user = userRes.data
  if (!user) throw new Error('用户不存在')

  // 过滤敏感字段
  return {
    userId: user._id,
    nickName: user.nickName || '',
    avatarUrl: user.avatarUrl || '',
    realName: user.realName || '',
    studentId: user.studentId || '',
    phone: user.phone || '',
    college: user.college || '',
    grade: user.grade || '',
    dormArea: user.dormArea || '',
    creditScore: user.creditScore || 100,
    creditLevel: user.creditLevel || '1',
    authStatus: user.authStatus || '1',
    email: user.cauEmail || ''
  }
}

// ========== 3. 更新个人资料 ==========
async function updateProfile(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const data = event.data || {}
  validateUpdateProfile(data)

  // 只允许更新部分字段
  const allowedFields = ['nickName', 'avatarUrl', 'realName', 'studentId', 'phone', 'college', 'grade', 'dormArea']
  const updateData = {}
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key]
    }
  }

  await db.collection('users').doc(OPENID).update({
    data: updateData
  })

  return { message: '更新成功' }
}

// ========== 4. 获取收藏列表 ==========
async function getFavorites(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const userRes = await db.collection('users').doc(OPENID).get()
  const user = userRes.data
  if (!user) throw new Error('用户不存在')

  const favoriteIds = user.favorites || []
  if (favoriteIds.length === 0) {
    return { goods: [], bounties: [] }
  }

  // 查询收藏的商品
  const goodsRes = await db.collection('goods')
    .where({ _id: db.command.in(favoriteIds) })
    .get()
  const goodsList = goodsRes.data.map(g => ({
    id: g._id,
    title: g.title,
    price: g.price / 100,
    firstPictureCDN: g.images?.[0] || ''
  }))

  // 收藏的悬赏（如果有）
  // 由于收藏机制目前只针对商品，悬赏收藏暂不实现

  return { goods: goodsList, bounties: [] }
}

module.exports = {
  wxLogin,
  getProfile,
  updateProfile,
  getFavorites
}