// utils/aiClient.js
const axios = require('axios')

// ============================================================
// 配置区（正式上线前必须修改）
// ============================================================

// ✅ AI 服务内网地址（已替换为实际地址）
// 注意：必须加 http:// 前缀，不能只写域名
const AI_SERVICE_URL = "https://ai-service-272979-6-1434247538.sh.run.tcloudbase.com/api/ai/generate_desc";

// 模拟模式开关
// - true  : 不调用真实服务，返回模拟文案（适合联调测试）
// - false : 调用真实 AI 服务（正式上线前必须设为 false）
const USE_MOCK = false

// ============================================================
// 核心函数：调用 AI 服务生成商品描述
// ============================================================

/**
 * 调用 AI 服务生成商品描述
 * @param {Object} params
 * @param {string} params.title - 商品标题（必填）
 * @param {string} params.user_brief - 用户填写的简介（必填）
 * @param {number} params.price - 价格，单位：元（必填）
 * @param {string} params.condition - 新旧程度 "1/2/3/4"（必填）
 * @returns {Promise<string|null>} 生成的描述文案，失败返回 null
 */
async function generateDescription({ title, user_brief, price, condition }) {
  // ----- 模拟模式 -----
  if (USE_MOCK) {
    console.log('【AI 模拟模式】生成描述:', title)
    // 返回一个简单的示例文案，方便前端联调
    return `✨ ${title}，${user_brief}，价格${price}元，成色不错，感兴趣可联系～`
  }

  // ----- 真实调用模式 -----
  try {
    console.log('【AI 真实调用】请求参数:', { title, user_brief, price, condition })

    const response = await axios.post(
      AI_SERVICE_URL,
      {
        title: title || '',
        user_brief: user_brief || '',
        price: typeof price === 'number' ? price : parseFloat(price) || 0,
        condition: String(condition || '1')
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // ⚠️ 必须 10 秒超时，否则 3 秒无响应会报错
      }
    )

    // 检查业务状态码
    if (response.data && response.data.code === 200) {
      const description = response.data.data?.description || ''
      console.log('【AI 真实调用】生成成功:', description.substring(0, 50) + '...')
      return description
    } else {
      console.warn('【AI 真实调用】业务错误:', response.data?.msg || '未知错误')
      return null
    }
  } catch (error) {
    // 超时或网络错误，返回 null，不影响主流程
    console.error('【AI 真实调用】失败:', error.message)
    if (error.response) {
      console.error('响应状态:', error.response.status)
      console.error('响应数据:', JSON.stringify(error.response.data))
    }
    return null
  }
}

module.exports = { generateDescription }