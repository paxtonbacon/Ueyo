// modules/social/validator.js

// 校验 ID
const validateId = (id) => {
  if (!id || typeof id !== 'string') {
    throw new Error('ID不能为空且必须为字符串')
  }
  return true
}

// 校验发布帖子
const validatePublishPost = (data) => {
  const { title, content, topicId } = data
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('帖子标题不能为空')
  }
  if (title.length > 100) {
    throw new Error('帖子标题不能超过100个字符')
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('帖子内容不能为空')
  }
  if (content.length > 4000) {
    throw new Error('帖子内容不能超过4000个字符')
  }
  if (!topicId) {
    throw new Error('所属话题ID不能为空')
  }
  return true
}


const validateSubmitReply = (data) => {
  const { ParentId, content } = data  // ✅ 改为 ParentId
  if (!ParentId) {
    throw new Error('所属帖子ID不能为空')
  }
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    throw new Error('回复内容不能为空')
  }
  return true
}

module.exports = { validateId, validatePublishPost, validateSubmitReply }