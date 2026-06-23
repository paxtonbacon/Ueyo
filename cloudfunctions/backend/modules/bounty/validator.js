// modules/bounty/validator.js

// 校验悬赏ID
const validateBountyId = (bountyId) => {
  if (!bountyId || typeof bountyId !== 'string') {
    throw new Error('悬赏ID不能为空且必须为字符串')
  }
  return true
}

// 校验发布悬赏的必填字段
const validatePublish = (data) => {
  const { title, description, category, expectedPrice } = data
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    throw new Error('悬赏标题不能为空')
  }
  if (title.length > 100) {
    throw new Error('悬赏标题不能超过100个字符')
  }
  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('悬赏描述不能为空')
  }
  if (!category) {
    throw new Error('分类不能为空')
  }
  if (expectedPrice === undefined || expectedPrice === null || typeof expectedPrice !== 'number' || expectedPrice < 0) {
    throw new Error('期望价格必须为非负数字')
  }
  return true
}

module.exports = { validateBountyId, validatePublish }