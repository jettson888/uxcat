const axios = require('axios');
const config = require('../config.js')

const CHAT_GPT_API = `${config.LLM_HOST}/v1/chat/completions`;

async function callChatCompletion(params) {
  const { messages, tools = null, model = "mistralai/devstral-2512:free", timeout = 120000, signal, headers } = params;

  const body = {
    model,
    messages,
    temperature: 0.3,
  };
  const defaultHeaders = {
    Authorization: `Bearer ${config.OPEN_ROUTER_KEY}`,
    'Content-Type': 'application/json',
  };
  const options = {
    timeout,
    headers: defaultHeaders,
  }
  console.log('params----', params)
  try {
    if (tools) body.tools = tools;
    if (signal) options.signal = signal;
    if (headers) options.headers = { ...defaultHeaders, ...headers };

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

/**
 * 从RAG接口获取UI组件文档
 * @param {Array} list - 组件列表
 * @returns {Promise<string>} 组件文档内容
 */
async function getUIDocs(list) {
  const docs = [];
  // 必须带上图标组件的使用信息查询，防止模型乱用
  if (!list.find((d) => d.name?.toLowerCase() === "icon")) {
    list.push({ name: "Icon", keywords: "使用方法" });
  }
  for (const item of list) {
    const fileName =
      item.name
        .replace(/([A-Z])/g, "-$1")
        .toLowerCase()
        .replace(/^-/, "") + ".md";
    try {
      const response = await axios.post(config.UI_DOCS_CONFIG.REQUEST_URL, {
        input: {
          knowledgeId: config.UI_DOCS_CONFIG.KNOWLEDGE_ID,
          query: item.keywords + " 基础用法",
          retrieval_setting: config.UI_DOCS_CONFIG.RETRIEVAL_SETTING,
          metadata_filter_params: {
            title: [fileName],
          },
          channelCode: config.UI_DOCS_CONFIG.CHANNEL_CODE,
          sceneCode: config.UI_DOCS_CONFIG.SCENE_CODE,
        },
      });

      const result = await response.data;
      const content = result.output?.response || "无";
      docs.push(`${item.name}.md\n${content}`);
    } catch (error) {
      console.error(`获取组件${item.name}文档失败:`, error);
      docs.push(`${item.name}.md\n获取文档失败`);
    }
  }
  return docs.join("\n\n");
}
module.exports = { callChatCompletion, getUIDocs };
