// modules/user/validator.js

const validateUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('用户ID不能为空且必须为字符串')
  }
  return true
}

const validateUpdateProfile = (data) => {
  const { nickName, avatarUrl, phone, studentId, college, grade } = data
  if (nickName && (typeof nickName !== 'string' || nickName.length > 24)) {
    throw new Error('昵称长度不能超过24个字符')
  }
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    throw new Error('手机号格式不正确')
  }
  if (studentId && studentId.length > 20) {
    throw new Error('学号长度不能超过20个字符')
  }
  return true
}

module.exports = { validateUserId, validateUpdateProfile }