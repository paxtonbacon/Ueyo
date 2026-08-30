// modules/user/service.js
const { validateUserId, validateUpdateProfile } = require('./validator')
const jwt = require('../../utils/jwt')
const crypto = require('crypto')
const { getUserByOpenId, updateUserByOpenId } = require('../../utils/helper')

// ========== 1. 微信登录（一级鉴权：返回 JWT） ==========
async function wxLogin(event) {
  const db = event.db
  const OPENID = event.OPENID

  if (!OPENID) {
    throw new Error('无法获取微信身份，请重新进入小程序')
  }

  // 查询或创建用户
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  let user = userRes.data[0]

  if (!user) {
    const result = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: '微信用户',
        avatarUrl: '',
        creditScore: 100,
        creditLevel: '1',
        authStatus: '0',       // 0=未注册邮箱
        favorites: [],
        history: [],
        publishedGoods: [],     // 发布的商品
        publishedTasks: [],     // 发布的悬赏
        getGood: [],            // 购买的商品
        acceptTasks: [],        // 接取的悬赏
        createdAt: Date.now()
      }
    })
    user = { _id: result._id, nickName: '微信用户', avatarUrl: '', cauEmail: '', authStatus: '0' }
  }

  // 签发 JWT（authLevel 根据用户是否已验证邮箱）
  const authLevel = user.authStatus === '2' ? 2 : (user.authStatus === '1' ? 1 : 0)
  const token = jwt.sign({
    userId: user._id,
    openId: OPENID,
    email: user.cauEmail || '',
    authLevel: authLevel
  })

  return {
    userId: user._id,
    openId: OPENID,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl,
    email: user.cauEmail || '',
    authLevel: authLevel,
    token: token
  }
}

// ========== 2. 邮箱注册（二级鉴权：注册邮箱+密码） ==========
async function emailRegister(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { email, password } = event.data || {}

  if (!OPENID) throw new Error('无法获取微信身份，请重新进入小程序')

  // 校验
  const emailReg = /^[a-zA-Z0-9._-]+@(cau\.edu\.cn|cau\.cn)$/
  if (!email || !emailReg.test(email)) {
    throw new Error('请输入正确的农大邮箱（@cau.edu.cn 或 @cau.cn）')
  }
  if (!password || password.length < 6) {
    throw new Error('密码长度不能少于6位')
  }

  // 检查邮箱是否已被注册
  const existRes = await db.collection('users').where({ cauEmail: email }).get()
  if (existRes.data.length > 0) {
    throw new Error('该邮箱已被注册')
  }

  const hashedPw = hashPassword(password)

  // 查找或创建用户记录
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  let user = userRes.data[0]

  if (!user) {
    // 首次使用：先创建用户记录
    const createRes = await db.collection('users').add({
      data: {
        _openid: OPENID,
        nickName: 'koko',
        avatarUrl: '',
        creditScore: 100,
        creditLevel: '1',
        cauEmail: email,
        password: hashedPw,
        authStatus: '1',       // 1=已注册，待验证
        favorites: [],
        history: [],
        publishedGoods: [],
        publishedTasks: [],
        getGood: [],
        acceptTasks: [],
        createdAt: Date.now()
      }
    })
    user = { _id: createRes._id }
  } else {
    // 已有记录：更新邮箱和密码
    await db.collection('users').doc(user._id).update({
      data: {
        cauEmail: email,
        password: hashedPw,
        authStatus: '1',
        updatedAt: Date.now()
      }
    })
  }

  const token = jwt.sign({
    userId: user._id,
    openId: OPENID,
    email: email,
    authLevel: 1
  })

  return {
    userId: user._id,
    email: email,
    authLevel: 1,
    token: token,
    message: '注册成功，请验证邮箱'
  }
}

// ========== 3. 邮箱验证 ==========
async function verifyEmail(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { code } = event.data || {}  // 验证码（开发阶段可传 '000000'）

  if (!OPENID) throw new Error('无法获取微信身份，请重新进入小程序')

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  const user = userRes.data[0]
  if (!user) throw new Error('用户不存在')
  if (!user.cauEmail) throw new Error('请先注册邮箱')

  // 开发阶段：任意6位验证码或 '000000' 均可通过
  // 生产环境：校验真实邮箱验证码
  if (!code || code.length !== 6) {
    throw new Error('请输入6位验证码')
  }
  if (code !== '000000') {
    // 生产环境此处校验真实验证码
    throw new Error('验证码错误，开发阶段请使用 000000')
  }

  // 更新验证状态
  await db.collection('users').doc(user._id).update({
    data: {
      authStatus: '2',       // 2=已验证
      verifiedAt: Date.now()
    }
  })

  const token = jwt.sign({
    userId: user._id,
    openId: OPENID,
    email: user.cauEmail,
    authLevel: 2
  })

  return {
    userId: user._id,
    email: user.cauEmail,
    authLevel: 2,
    token: token,
    message: '邮箱验证成功'
  }
}

// ========== 4. 邮箱登录 ==========
async function emailLogin(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { email, password } = event.data || {}

  if (!OPENID) throw new Error('无法获取微信身份，请重新进入小程序')
  if (!email || !password) throw new Error('请输入邮箱和密码')

  const hashedPw = hashPassword(password)
  const userRes = await db.collection('users')
    .where({ cauEmail: email, password: hashedPw })
    .get()

  const user = userRes.data[0]
  if (!user) throw new Error('邮箱或密码错误')

  // 如果当前微信 openid 与注册时的不同，绑定新 openid
  if (user._openid !== OPENID) {
    // 简单处理：允许同一邮箱多设备登录，不强制绑定
    // 生产环境可在此做 openid 绑定逻辑
  }

  const authLevel = user.authStatus === '2' ? 2 : 1
  const token = jwt.sign({
    userId: user._id,
    openId: OPENID,
    email: user.cauEmail,
    authLevel: authLevel
  })

  return {
    userId: user._id,
    nickName: user.nickName,
    avatarUrl: user.avatarUrl,
    email: user.cauEmail,
    authLevel: authLevel,
    token: token,
    message: '登录成功'
  }
}

// ========== 辅助：密码哈希 ==========
function hashPassword(password) {
  return crypto.createHash('sha256').update('ueyo_salt_' + password).digest('hex')
}

// ========== 2. 获取个人资料 ==========
async function getProfile(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const user = await getUserByOpenId(db, OPENID)
  if (!user._id) throw new Error('用户不存在')

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
  const allowedFields = ['nickName', 'avatarUrl', 'gender', 'realName', 'studentId', 'phone', 'college', 'grade', 'dormArea']
  const updateData = {}
  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      updateData[key] = data[key]
    }
  }
  if (Object.keys(updateData).length === 0) {
    throw new Error('没有可更新的字段')
  }

  // 通过 _openid 查找用户（而非用 OPENID 作 doc id）
  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  if (!userRes.data || userRes.data.length === 0) {
    throw new Error('用户不存在')
  }
  await db.collection('users').doc(userRes.data[0]._id).update({
    data: updateData
  })

  return { message: '更新成功' }
}

// ========== 4. 获取收藏列表 ==========
async function getFavorites(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const user = await getUserByOpenId(db, OPENID)
  if (!user._id) throw new Error('用户不存在')

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

// ========== 5. 切换收藏状态 ==========
async function toggleFavorite(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { goodsId } = event.data || {}
  if (!OPENID) throw new Error('用户未登录')
  if (!goodsId) throw new Error('商品ID不能为空')

  const user = await getUserByOpenId(db, OPENID)
  if (!user._id) throw new Error('用户不存在')

  const favorites = user.favorites || []
  const index = favorites.indexOf(goodsId)
  const _ = db.command

  if (index > -1) {
    // 取消收藏
    await updateUserByOpenId(db, OPENID, { favorites: _.pull(goodsId) })
    return { isFavorited: false, message: '已取消收藏' }
  } else {
    // 添加收藏
    await updateUserByOpenId(db, OPENID, { favorites: _.push(goodsId) })
    return { isFavorited: true, message: '已收藏' }
  }
}

// ========== 6. 我的商品（发布+购买，按状态分类） ==========
async function myGoods(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  const user = userRes.data[0]
  if (!user) throw new Error('用户不存在')

  const publishedIds = user.publishedGoods || []
  const boughtIds = user.getGood || []

  const published = { '1have_pub': [], '2waited_for_del': [], '3waited_for_dis': [], '4all_down': [] }
  const bought = { 'none': [], '1waited_for_pay': [], '2waited_for_get': [], '3waited_for_dis': [], '4have_down': [] }

  // 查询发布的商品
  if (publishedIds.length > 0) {
    const goodsRes = await db.collection('goods').where({ _id: db.command.in(publishedIds) }).get()
    for (const g of (goodsRes.data || [])) {
      const item = formatGoodsItem(g)
      const status = g.seller_status || '1have_pub'
      if (published[status]) published[status].push(item)
    }
  }

  // 查询购买的商品
  if (boughtIds.length > 0) {
    const goodsRes = await db.collection('goods').where({ _id: db.command.in(boughtIds) }).get()
    for (const g of (goodsRes.data || [])) {
      const item = formatGoodsItem(g)
      const status = g.buyer_status || '1waited_for_pay'
      if (bought[status]) bought[status].push(item)
    }
  }

  return { published, bought }
}

// ========== 7. 我的悬赏（发布+接取，按状态分类） ==========
async function myBounties(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const userRes = await db.collection('users').where({ _openid: OPENID }).get()
  const user = userRes.data[0]
  if (!user) throw new Error('用户不存在')

  const publishedIds = user.publishedTasks || []
  const takenIds = user.acceptTasks || []

  const published = { '1haven_pub': [], '2waited_for_dis': [], '3all_down': [] }
  const taken = { 'none': [], '1waited_for_do': [], '2waited_for_dis': [], '3have_down': [] }

  // 查询发布的悬赏
  if (publishedIds.length > 0) {
    const bountyRes = await db.collection('bounties').where({ _id: db.command.in(publishedIds) }).get()
    for (const b of (bountyRes.data || [])) {
      const item = formatBountyItem(b)
      const status = b.put_status || '1haven_pub'
      if (published[status]) published[status].push(item)
    }
  }

  // 查询接取的悬赏
  if (takenIds.length > 0) {
    const bountyRes = await db.collection('bounties').where({ _id: db.command.in(takenIds) }).get()
    for (const b of (bountyRes.data || [])) {
      const item = formatBountyItem(b)
      const status = b.get_status || '1waited_for_do'
      if (taken[status]) taken[status].push(item)
    }
  }

  return { published, taken }
}

// ========== 格式化辅助 ==========
function formatGoodsItem(g) {
  const CT = { '1': '全新', '2': '几乎全新', '3': '轻微痕迹', '4': '明显痕迹' }
  return {
    id: g._id,
    title: g.title || '',
    name: g.title || '',
    price: (g.price || 0) / 100,
    amount: (g.price || 0) / 100,
    condition: CT[g.condition] || g.condition || '',
    tradeType: g.tradeType || '',
    image: g.images?.[0] || '',
    firstPictureCDN: g.images?.[0] || '',
    orderNo: '',
    finalStatus: g.seller_status === '4all_down' ? '已完成' : (g.seller_status === '2waited_for_del' ? '待发货' : '')
  }
}

function formatBountyItem(b) {
  return {
    id: b._id,
    title: b.title || '',
    reward: (b.expectedPrice || 0) / 100,
    amount: (b.expectedPrice || 0) / 100,
    tradeType: b.deliveryRequirement || '面交/快递均可',
    image: b.images?.[0] || '',
    firstPictureCDN: b.images?.[0] || '',
    orderNo: '',
    finalStatus: b.put_status === '3all_down' ? '已完成' : (b.put_status === '1haven_pub' ? '待接取' : '')
  }
}

// ========== 8. 用户活跃统计（聚合所有已有集合） ==========
async function getActivity(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const now = new Date()
  now.setHours(23, 59, 59, 999)

  // 近90天日期范围（热力图用）
  const quarterAgo = new Date(now)
  quarterAgo.setDate(quarterAgo.getDate() - 90)
  quarterAgo.setHours(0, 0, 0, 0)
  const tsStart = quarterAgo.getTime()

  // 并行查询所有集合并聚合
  const [goodsRes, bountiesRes, topicsRes, ordersRes, bountyOrdersRes, messagesRes] = await Promise.all([
    db.collection('goods').where({ 'sellerInfo._id': OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] })),
    db.collection('bounties').where({ 'buyerInfo._id': OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] })),
    db.collection('topics').where({ 'authorInfo._id': OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] })),
    db.collection('orders').where({ 'buyerInfo._id': OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] })),
    db.collection('bounties_order').where({ 'takerInfo._id': OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] })),
    db.collection('messages_detail').where({ from: OPENID, createdAt: db.command.gte(tsStart) }).field({ createdAt: true }).get().catch(() => ({ data: [] }))
  ])

  // 合并所有时间戳
  const allTimestamps = [
    ...(goodsRes.data || []).map(r => r.createdAt),
    ...(bountiesRes.data || []).map(r => r.createdAt),
    ...(topicsRes.data || []).map(r => r.createdAt),
    ...(ordersRes.data || []).map(r => r.createdAt),
    ...(bountyOrdersRes.data || []).map(r => r.createdAt),
    ...(messagesRes.data || []).map(r => r.createdAt)
  ]

  // 按日期聚合: { '2026-06-25': 5, ... }
  const dateMap = {}
  for (const ts of allTimestamps) {
    const d = new Date(ts)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dateMap[key] = (dateMap[key] || 0) + 1
  }

  // ===== 热力图数据：7行(周一~周日) × 约13列(近91天) =====
  const heatmapData = [[], [], [], [], [], [], []] // 0=周日, 1=周一...6=周六 → 显示为 周一~周日
  const monthColumns = []
  let lastMonth = -1

  for (let i = 90; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const count = dateMap[key] || 0

    let level = 0
    if (count > 0 && count <= 1) level = 1
    else if (count <= 3) level = 2
    else if (count <= 6) level = 3
    else if (count > 6) level = 4

    const dayOfWeek = d.getDay() // 0=Sun, 1=Mon...
    const rowIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // 转为 周一=0...周日=6

    heatmapData[rowIndex].push({ date: key, count, level })

    // 月份标签（列索引）
    const m = d.getMonth() + 1
    if (m !== lastMonth) {
      monthColumns.push({ name: `${m}月`, show: true })
      lastMonth = m
    } else {
      monthColumns.push({ name: `${m}月`, show: false })
    }
  }

  // ===== 近7天趋势数据 =====
  const weekDays = []
  const weeklyData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const count = dateMap[key] || 0
    weekDays.push(`${d.getMonth() + 1}/${d.getDate()}`)
    weeklyData.push(count)
  }

  // ===== 汇总统计 =====
  const total7Days = weeklyData.reduce((a, b) => a + b, 0)

  // 连续活跃天数（从今天往前数）
  let streak = 0
  for (let i = 0; i < 90; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (dateMap[key] && dateMap[key] > 0) {
      streak++
    } else {
      break
    }
  }

  // 总发布数（商品+悬赏+帖子）
  const totalPosts = (goodsRes.data || []).length + (bountiesRes.data || []).length + (topicsRes.data || []).length

  // 趋势百分比（近7天 vs 前7天）
  const prevWeekData = []
  for (let i = 13; i >= 7; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    prevWeekData.push(dateMap[key] || 0)
  }
  const prevTotal = prevWeekData.reduce((a, b) => a + b, 0)
  let weeklyTrend = 0
  if (prevTotal > 0) {
    weeklyTrend = Math.round(((total7Days - prevTotal) / prevTotal) * 100)
  } else if (total7Days > 0) {
    weeklyTrend = 100
  }

  // ===== 洞察建议 =====
  const insights = [
    '你通常在下午时段最活跃，建议在这个时间段发布内容，获得更多互动！',
    '周末你的活跃度更高，多参与热门话题讨论吧！',
    `连续活跃 ${streak} 天！保持这个节奏，即将解锁「活跃达人」勋章！`,
    '本周数据稳步上升，继续加油！',
    '晚上浏览商品最多，不妨看看有什么好物上新~'
  ]
  const insightText = insights[Math.floor(Math.random() * insights.length)]

  return {
    heatmapData,
    monthColumns,
    weekDays,
    weeklyData,
    weeklyTrend,
    summaryData: [
      { icon: '📊', value: total7Days, label: '近7天活跃' },
      { icon: '🔥', value: streak, label: '连续活跃' },
      { icon: '⭐', value: 0, label: '获得点赞' },
      { icon: '✏️', value: totalPosts, label: '新增发布' }
    ],
    insightText
  }
}

module.exports = {
  wxLogin,
  emailRegister,
  verifyEmail,
  emailLogin,
  getProfile,
  updateProfile,
  getFavorites,
  toggleFavorite,
  myGoods,
  myBounties,
  getActivity
}