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
  const { title, description, category, minPrice, maxPrice } = data
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
  if (minPrice === undefined || minPrice === null || typeof minPrice !== 'number' || minPrice < 0) {
    throw new Error('最低价格必须为非负数字')
  }
  if (maxPrice === undefined || maxPrice === null || typeof maxPrice !== 'number' || maxPrice < 0) {
    throw new Error('最高价格必须为非负数字')
  }
  if (maxPrice < minPrice) {
    throw new Error('最高价格不能低于最低价格')
  }
  return true
}

module.exports = { validateBountyId, validatePublish }