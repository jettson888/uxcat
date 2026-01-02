const { loadESLint } = require('eslint');
const overrideConfig = require('../lint-override.js')

let eslint;
/**
 * overrideConfig.extends
 * plugin:vue/base 基础规则
 * plugin:vue/essential 推荐默认级别
 * plugin:vue/recommended 更严格
 * plugin:vue/strongly-recommended 最严格
 */
async function getEslintInstance() {
  if (!eslint) {
    const ESLint = await loadESLint({ useFlatConfig: false });
    eslint = new ESLint({
      fix: false,
      overrideConfig
    });
  }
  return eslint;
}

async function checkVueCode(code, fileName = 'temp.vue') {
  const eslintInstance = await getEslintInstance();
  const results = await eslintInstance.lintText(code, { filePath: fileName });
  if (!results || !results[0]) {
    return { ok: false, message: 'ESLint returned no results' };
  }
  const errors = results[0].messages.filter(m => m.severity === 2);
  if (errors.length === 0) return { ok: true, message: '代码符合规范' };
  return {
    ok: false,
    message: `发现 ${errors.length} 个错误`,
    details: errors.slice(0, 10).map(e => `${e.line}:${e.column} ${e.message} [${e.ruleId}]`).join('\n')
  };
}

module.exports = { checkVueCode };