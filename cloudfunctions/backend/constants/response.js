// constants/response.js
module.exports = {
  // 成功返回
  SUCCESS: (data = null, msg = 'success') => ({
    code: 0,
    msg,
    data,
    error: null,
    meta: null
  }),
  
  // 失败返回
  ERROR: (code = 400, msg = '请求失败', data = null) => ({
    code,
    msg,
    data,
    error: { code, msg },
    meta: null
  })
}