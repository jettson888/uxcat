const axios = require('axios');
const config = require('../config.js')

const CHAT_GPT_API = `${config.LLM_HOST}/v1/chat/completions`;

async function callChatCompletion(params) {
  const { messages, tools = null, model = "mistralai/devstral-2512:free", timeout = 60000, signal } = params;

  const body = {
    model,
    messages,
    temperature: 0.3,
  };
  const options = {
    timeout,
    headers: {
      Authorization: `Bearer ${config.OPEN_ROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
  }
  console.log('params----', params)
  try {
    if (tools) body.tools = tools;
    if (signal) options.signal = signal;

    const res = await axios.post(CHAT_GPT_API, body, options);
    return res.data.choices[0].message;

  } catch (error) {
    // 详细的错误处理
    if (error.code === 'ECONNRESET') {
      console.error('⚠️ 连接被重置，可能的原因:');
      console.error('  1. API Key 无效或过期');
      console.error('  2. 网络连接问题');
      console.error('  3. 服务器拒绝连接');
      console.error('  4. 请求格式错误');
    }

    if (error.response) {
      // 服务器返回了错误响应
      console.error('服务器错误:', error.response.status, error.response.data);
    } else if (error.request) {
      // 请求发出了但没收到响应
      console.error('网络错误: 没有收到响应');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
    }

    throw error;
  }

}
module.exports = { callChatCompletion };
