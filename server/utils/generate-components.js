const simpleLogger = require('./simple-logger.js');
const fileTools = require('../tools/file-tools.js');
const { handleToolCalls } = require('./tools.js');
const { callWithTimeoutAndRetry } = require('./wrapper.js');
const HZB_ICONS = require('../prompts/icons.js');
const { checkVueCode } = require('./eslint-checker.js');
const vue2VerificationTool = require('../tools/vue2-verification-tool.js');
const config = require('../config.js');
const { getLintConfigs } = require('./lint-config.js');
const { replacePlaceholders } = require('../utils/slot-template.js');
const { callChatCompletion } = require('./api.js');
const { getHistoryByMessage } = require('./history.js');

async function generateCommonComponents(pages) {
  console.log("正在分析页面以生成公共组件...");
  simpleLogger.info('正在分析页面以生成公共组件...');

  const pagesDesc = pages.map(p => `Page: ${p.name} (${p.pageId})\nDescription: ${p.description}`).join('\n\n');
  const componentPrompt = `
You are a Senior Frontend Architect.
Analyze the following page descriptions and identify reusable Vue 2 UI components (e.g., Layouts, Headers, Footers, Cards, Lists).
Generate the COMPLETE Vue 2 code for each identified common component.

# 页面风格
简约留白视觉设计，类似Apple设计风格，创造宁静感、提升可读性、突出重要内容（如图片、标题、产品）、营造高级感和纯粹感。
主要使用无衬线字体，具有现代感、易读性高。标题、正文、说明文字之间有显著的大小、字重或色彩对比字母间距、行高往往设置得略大于默认值，提升易读性和开放感。
网格对齐，保持视觉秩序，让布局感觉开阔、不拥挤。
按钮形状简单，文本标签清晰，常用主色或反白处理，视觉重量轻巧，但足够醒目。表单边框简洁，有足够的间距，标签清晰，视觉干扰少。

# 图标使用规范
- 页面中的所有图标必须从以下列表选择,使用语义最接近功能的现有图标,禁止虚构
   {{icons}}
- 禁止使用名称类似但不存在的图标（如用hzb-icon-doc代替hzb-icon-document）
- 引用图标后根据页面风格及图标背景自定义调整图标颜色
- 使用示例：
   -  图标引用
      <i class="iconfont hzb-icon-document-checked"></i>
   -  样式自定义(可选)
      .hzb-icon-document-checked-custom-style{
        color: #000000
      }

Return a JSON object with the following structure inside a Markdown code block:
\`\`\`json
{
"components": [
{ "fileName": "GlobalHeader.vue", "code": "<template>...</template><script>...</script><style>...</style>" },
{ "fileName": "ProductCard.vue", "code": "..." }
]
}
\`\`\`

Pages to analyze:
${pagesDesc} \n\n

# 代码规范
{{lintConfig}}

# 代码检查
- 生成完代码必须调用vue2_code_verification工具进行检查，检查完才能把代码写入到磁盘

# 要求
1. 生成的代码并且通过了vue2_code_verification工具的检查后存储到{{projectDir}}/{{projectId}}/1/components目录下
2. 然后调用copy_file_to_client工具将代码复制到{{clientDir}}/src/components目录下

# 文件写入和读取
写入: {{projectDir}}/{{projectId}}/1/components
读取: {{clientDir}}
    `;

  const lintConfig = await getLintConfigs()
  const prompt = replacePlaceholders(componentPrompt, {
    projectDir: config.PROJECT_DIR,
    clientDir: config.CLIENT_DIR,
    lintConfig,
    icons: HZB_ICONS,
  })
  const messages = [{ role: "user", content: prompt }];
  // Use available tools except write_file to avoid premature writing
  const availableTools = [...fileTools, vue2VerificationTool]
    .map(t => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema
      }
    }));

  // 使用超时控制包装器
  const task = async (signal) => {
    const options = {
      messages,
      tools: availableTools,
      signal,
      // transaction: false,  // 是否支持事务
      callback: async (messages, tools) => {
        return await callChatCompletion({
          messages,
          tools,
          signal,
          model: 'qwen-coder',
          timeout: 120000
        });
      },
      maxIterations: 10,
      earlyExit: false  // ✅ 启用早期退出：工具执行成功后不再调用模型
    }
    return await handleToolCalls(options);
  }

  // Call model (simple call, no complex retry loop for components yet, generic handling)
  // leveraging handleToolCalls to support knowledge retrieval if needed
  await callWithTimeoutAndRetry(task, 3, 600000);

  const { lastCode, lastFilePath, isVerified, verificationResult, toolResults } = getHistoryByMessage(messages);
  simpleLogger.info('公共组件生成完毕', { lastCode, lastFilePath, isVerified, verificationResult, toolResults });

  return {
    success: !!lastCode,
    code: lastCode,
    filePath: lastFilePath,
    verified: isVerified,
    verificationResult,
    toolResults
  };
}


module.exports = {
  generateCommonComponents
}