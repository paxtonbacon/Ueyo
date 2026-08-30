// modules/message/service.js
const { getUserByOpenId } = require('../../utils/helper')

// ========== 1. 获取会话列表 ==========
async function getConversations(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  // 查询 participants 数组中包含当前用户的会话
  const res = await db.collection('messages')
    .where({
      participants: db.command.all([OPENID])
    })
    .orderBy('lastTime', 'desc')
    .limit(50)
    .get()

  const list = res.data || []
  const conversations = []
  for (const msg of list) {
    const otherId = (msg.participants || []).find(p => p !== OPENID) || ''
    let otherUser = {}
    if (otherId) {
      try {
        otherUser = await getUserByOpenId(db, otherId)
      } catch (e) { /* 忽略 */ }
    }
    conversations.push({
      id: otherId,
      nickname: otherUser.nickName || '用户',
      avatar: otherUser.avatarUrl || '',
      lastMsg: msg.lastContent || '',
      lastTime: msg.lastTime || '',
      unreadCount: msg.unreadCount || 0
    })
  }

  return { conversations }
}

// ========== 2. 获取聊天消息 ==========
async function getMessages(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { targetUserId, page = 1, pageSize = 20 } = event.data || {}
  if (!OPENID) throw new Error('用户未登录')
  if (!targetUserId) throw new Error('目标用户ID不能为空')

  const _ = db.command
  const res = await db.collection('messages_detail')
    .where(_.or([
      { from: OPENID, to: targetUserId },
      { from: targetUserId, to: OPENID }
    ]))
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = (res.data || []).reverse()

  // 获取双方头像
  let myAvatar = '', otherAvatar = ''
  try {
    const myUser = await getUserByOpenId(db, OPENID)
    myAvatar = myUser.avatarUrl || ''
  } catch (e) {}
  try {
    const otherUser = await getUserByOpenId(db, targetUserId)
    otherAvatar = otherUser.avatarUrl || ''
  } catch (e) {}

  const messages = list.map(m => ({
    id: m._id,
    from: m.from === OPENID ? 'self' : 'other',
    content: m.content || '',
    time: m.createdAt || '',
    avatar: m.from === OPENID ? myAvatar : otherAvatar
  }))

  return { messages }
}

// ========== 3. 发送消息 ==========
async function sendMessage(event) {
  const db = event.db
  const OPENID = event.OPENID
  const { targetUserId, content } = event.data || {}
  if (!OPENID) throw new Error('用户未登录')
  if (!targetUserId) throw new Error('目标用户ID不能为空')
  if (!content || !content.trim()) throw new Error('消息内容不能为空')

  const now = Date.now()
  
  // 1) 写入消息详情
  await db.collection('messages_detail').add({
    data: {
      from: OPENID,
      to: targetUserId,
      content: content.trim(),
      createdAt: now
    }
  })

  // 2) 更新/创建会话摘要（双方公用一条记录）
  // 先查出当前用户参与的所有会话，再用 JS 筛选匹配的那条
  const myConversations = await db.collection('messages')
    .where({ participants: db.command.all([OPENID]) })
    .get()

  const existing = (myConversations.data || []).find(
    c => c.participants && c.participants.includes(targetUserId)
  )

  if (existing) {
    // 更新已有会话
    await db.collection('messages').doc(existing._id).update({
      data: {
        lastContent: content.trim(),
        lastTime: now,
        unreadCount: db.command.inc(1)
      }
    })
  } else {
    // 新建会话（参与者排序固定）
    const participants = [OPENID, targetUserId].sort()
    await db.collection('messages').add({
      data: {
        participants: participants,
        lastContent: content.trim(),
        lastTime: now,
        unreadCount: 1
      }
    })
  }

  return { message: '发送成功' }
}

module.exports = { getConversations, getMessages, sendMessage }
