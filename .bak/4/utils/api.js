const axios = require('axios');
const config = require('../config.js')

const CHAT_GPT_API = `${config.LLM_HOST}/v1/chat/completions`;

async function callChatCompletion(messages, tools = null, model = "xiaomi/mimo-v2-flash:free") {
  const body = {
    model,
    messages,
    temperature: 0.3,
  };
  if (tools) body.tools = tools;
  console.log('body----', body)

  const res = await axios.post(CHAT_GPT_API, body, {
    headers: {
      Authorization: `Bearer ${config.OPEN_ROUTER_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  return res.data.choices[0].message;
}
module.exports = { callChatCompletion };
