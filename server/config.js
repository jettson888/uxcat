
const path = require('path')
const ROOT_DIR = path.join(__dirname, '..')
const { OPEN_ROUTER_KEY } = require('./secret')

const common = {
  ROOT_DIR,
  AIUX_DIR: 'D:/frontend-code/ai-ux',
  PROJECT_DIR: 'D:/frontend-code/hzux',
  UI_DOCS_CONFIG: {
    REQUEST_URL: "http://197.68.33.72:6007/llm/knowledge_chat/invoke",
    KNOWLEDGE_ID: "17647483700990000000417743218421",
    CHANNEL_CODE: "0004",
    SCENE_CODE: "default",
    RETRIEVAL_SETTING: {
      top_k: 5,
      score_threshold: 0.01,
      initial_recall_limit: 32,
      retrieval_mode: "vector",
      recall_mode: "normal",
      proper_noun_table_enabled: false,
    },
  },
  LLM_HOST: "http://158.2.130.21:9997", // https://openrouter.ai/api
  OPEN_ROUTER_KEY, // must be config
}

const config = {
  development: {
    ...common,
    CLIENT_DIR: path.join(common.ROOT_DIR, 'client')
  },
  production: {
    ...common,
    CLIENT_DIR: path.join(common.AIUX_DIR, 'client')
  }
}
module.exports = config[process.env.NODE_ENV];
