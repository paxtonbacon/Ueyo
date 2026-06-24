// modules/message/service.js

// ========== 1. 获取会话列表 ==========
async function getConversations(event) {
  const db = event.db
  const OPENID = event.OPENID
  if (!OPENID) throw new Error('用户未登录')

  const res = await db.collection('messages')
    .where({
      participants: OPENID
    })
    .orderBy('lastTime', 'desc')
    .limit(50)
    .get()

  const list = res.data || []
  const conversations = []
  for (const msg of list) {
    const otherId = msg.participants.find(p => p !== OPENID) || ''
    let otherUser = {}
    if (otherId) {
      try {
        const userRes = await db.collection('users').doc(otherId).get()
        otherUser = userRes.data || {}
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

  const res = await db.collection('messages_detail')
    .where({
      $or: [
        { from: OPENID, to: targetUserId },
        { from: targetUserId, to: OPENID }
      ]
    })
    .orderBy('createdAt', 'desc')
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .get()

  const list = (res.data || []).reverse()
  const messages = list.map(m => ({
    id: m._id,
    from: m.from === OPENID ? 'self' : 'other',
    content: m.content || '',
    time: m.createdAt || '',
    avatar: m.from === OPENID ? '' : ''
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
  
  // 写入消息详情
  await db.collection('messages_detail').add({
    data: {
      from: OPENID,
      to: targetUserId,
      content: content.trim(),
      createdAt: now
    }
  })

  // 更新会话摘要
  const participants = [OPENID, targetUserId].sort()
  const existingRes = await db.collection('messages')
    .where({ participants: db.command.all(participants) })
    .get()

  if (existingRes.data.length > 0) {
    await db.collection('messages').doc(existingRes.data[0]._id).update({
      data: {
        lastContent: content.trim(),
        lastTime: now,
        unreadCount: db.command.inc(1)
      }
    })
  } else {
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
