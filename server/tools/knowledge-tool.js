// tools/knowledgeTool.js
const axios = require('axios');
const config = require('../config.js')

const KNOWLEDGE_API = `${config.UI_DOCS_CONFIG.REQUEST_URL}`
module.exports = {
  name: "knowledge_chat",
  description: "查询公司内部 <hzb-ui> 和 <hzb-icon> 的组件/图标文档，返回使用说明",
  input_schema: {
    type: "object",
    properties: { query: { type: "string", description: "检索关键词，如 Table options、Button 禁用状态 等" } },
    required: ["query"]
  },
  async execute({ query }) {
    const res = await axios.post(KNOWLEDGE_API, { query }, {
      timeout: 60000 // 60秒超时
    });
    return res.data.response || "无相关文档";
  }
};
