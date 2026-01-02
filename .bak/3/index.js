const { callChatCompletion } = require('./utils/api.js');


const flowPrompt = require('./prompts/flow.js');
const codePromptTemplate = require('./prompts/code.js');
const fileTools = require('./tools/file-tools.js');
const knowledgeTool = require('./tools/knowledge-tool.js');
const { checkVueCode } = require('./utils/eslint-checker.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config.js');

// 添加超时和重试机制
async function callWithTimeoutAndRetry(fn, retries = 3, timeout = 30000) {
  for (let i = 0; i < retries; i++) {
    try {
      // 使用 Promise.race 实现超时控制
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`操作超时 (${timeout}ms)`)), timeout);
      });

      const result = await Promise.race([fn(), timeoutPromise]);
      return result;
    } catch (error) {
      console.log(`第 ${i + 1} 次尝试失败:`, error.message);
      if (i === retries - 1) {
        throw error;
      }
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

const allTools = [...fileTools, knowledgeTool];

function executeToolStragtyToParams(args) {
  switch (args.scope) {
    case 'write_flow':
      args.content = JSON.stringify(args.content)
      break;

    default:
      break;
  }
}

// 工具执行器
async function executeTool(toolCall) {
  const { name, arguments: argsStr } = toolCall.function;
  let args;

  try {
    args = JSON.parse(argsStr);
  } catch (e) {
    throw new Error(`工具参数解析失败: ${argsStr}`);
  }

  console.log(`执行工具: ${name}`, args);
  const tool = allTools.find(tool => tool.name === name)
  if (!tool) { throw new Error(`未找到工具: ${name}`); }

  executeToolStragtyToParams(args);

  return await tool.execute(args);
}

// 处理工具调用循环
async function handleToolCalls(messages, availableTools) {
  let response = await callChatCompletion(messages, availableTools);

  // 工具调用循环
  while (response.tool_calls && response.tool_calls.length > 0) {
    console.log("检测到工具调用，正在处理...");

    const toolResults = [];

    // 并行执行所有工具调用
    for (const toolCall of response.tool_calls) {
      try {
        const result = await executeTool(toolCall);
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify(result)
        });
      } catch (error) {
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify({ error: error.message })
        });
      }
    }

    // 将工具执行结果添加到消息历史中
    messages.push({
      role: "assistant",
      tool_calls: response.tool_calls
    });

    messages.push(...toolResults);

    console.log('messages-----', messages)
    // 继续调用模型
    response = await callChatCompletion(messages, availableTools);
  }

  return response;
}


async function getLintConfigs() {
  let configContent = 'Linting Rules Content:\n';
  try {
    const eslintRc = await fs.readFile(path.join(__dirname, '.eslintrc.js'), 'utf8');
    configContent += `\n--- .eslintrc.js ---\n${eslintRc}\n`;
  } catch (e) {
    console.warn('Failed to read .eslintrc.js');
  }

  try {
    const lintOverride = await fs.readFile(path.join(__dirname, 'lint-override.js'), 'utf8');
    configContent += `\n--- lint-override.js ---\n${lintOverride}\n`;
  } catch (e) {
    console.warn('Failed to read lint-override.js');
  }

  return configContent;
}


async function run() {
  const { default: PQueue } = await import('p-queue');
  const queue = new PQueue({ concurrency: 3 });

  console.log("请描述你想要的产品功能（自然语言）：");
  process.stdin.once('data', async (input) => {
    const userInput = input.toString().trim();

    try {
      // Step 1: 生成流程 JSON
      const flowMessages = [
        { role: "system", content: flowPrompt.replace('{{userInput}}', userInput) },
        { role: "user", content: "请根据以上需求生成完整的流程JSON字符串，直接返回JSON内容，**不要**返回Markdown代码块，并把内容写入docs/flow.json文件。scope: write_flow" }
      ];

      const availableTools = fileTools
        .map(t => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.input_schema
          }
        }));
      // 处理工具调用循环
      let message = await handleToolCalls(flowMessages, availableTools);
      console.log('-----message', message);


      let flowJson;
      try {
        const content = await fs.readFile('./docs/flow.json', 'utf-8');
        flowJson = JSON.parse(content);
      } catch (parseError) {
        console.error('解析JSON失败, 尝试修复格式:', parseError);
        const jsonMatch = message.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          flowJson = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法从响应中提取有效的JSON');
        }
      }

      console.log(`\n生成项目：${flowJson.projectName}`);
      console.log(`共 ${flowJson.pages.length} 个页面，请输入你想生成的页面序号（多个用逗号分隔，或输入 all）：`);

      // 显示页面列表供用户勾选
      flowJson.pages.forEach((p, i) => console.log(`${i + 1}. ${p.name} (${p.pageId})`));

      process.stdin.once('data', async (selection) => {
        const indices = selection.toString().trim() === 'all'
          ? flowJson.pages.map((_, i) => i)
          : selection.toString().trim().split(',').map(s => parseInt(s.trim()) - 1);

        const selectedPages = indices.map(i => flowJson.pages[i]);

        const lintConfigs = await getLintConfigs();

        async function generateCommonComponents(pages) {
          console.log("正在分析页面以生成公共组件...");
          const pagesDesc = pages.map(p => `Page: ${p.name} (${p.pageId})\nDescription: ${p.description}`).join('\n\n');
          const componentPrompt = `
You are a Senior Frontend Architect.
Analyze the following page descriptions and identify reusable Vue 2 UI components (e.g., Layouts, Headers, Footers, Cards, Lists).
Generate the COMPLETE Vue 2 code for each identified common component.

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

list_files dir 从当前项目的output开始, read_file path 也从当前项目的output开始, 如果你需要读取components 那么它在 output/components里
            `;

          const messages = [{ role: "user", content: componentPrompt }];
          // Use available tools except write_file to avoid premature writing
          const availableTools = fileTools
            .filter(t => t.name !== 'write_file')
            .map(t => ({
              type: "function",
              function: {
                name: t.name,
                description: t.description,
                parameters: t.input_schema
              }
            }));

          // Call model (simple call, no complex retry loop for components yet, generic handling)
          // leveraging handleToolCalls to support knowledge retrieval if needed
          let message = await callWithTimeoutAndRetry(() => handleToolCalls(messages, availableTools), 2, 600000);

          let components = [];
          try {
            const content = message.content;
            const jsonMatch = content.match(/```json\s*(\{[\s\S]*?\})\s*```/) || content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
              components = parsed.components || [];
            } else {
              console.warn("无法从响应中解析公共组件JSON, 跳过公共组件生成。");
            }
          } catch (e) {
            console.error("解析公共组件失败:", e);
          }

          const generatedComponents = [];
          for (const comp of components) {
            try {
              // Check code (optional, log warning on fail)
              const check = await checkVueCode(comp.code, comp.fileName);
              if (!check.ok) {
                console.warn(`Common Component ${comp.fileName} lint warning: ${check.message}`);
                // We write it anyway for now, or could skip. Let's write it.
              }
              const outputPath = `./output/components/${comp.fileName}`;
              await fs.outputFile(outputPath, comp.code);
              console.log(`Generated Common Component: ${comp.fileName}`);
              generatedComponents.push(comp.fileName);
            } catch (e) {
              console.error(`Failed to write component ${comp.fileName}:`, e);
            }
          }
          return generatedComponents;
        }

        const commonComponents = await generateCommonComponents(selectedPages);
        const commonCompsDesc = commonComponents.length > 0
          ? `\n\n[AVAILABLE COMMON COMPONENTS]\nThe following components have been generated in '@/components/'. YOU MUST USE THEM where applicable:\n${commonComponents.map(c => `- ${c} (Import from '@/components/${c}')`).join('\n')}`
          : "";

        // Step 2: 并发生成代码（最多3个并发）
        const results = await Promise.all(
          selectedPages.map(page =>
            queue.add(async () => {
              try {
                const initialSystemContent = codePromptTemplate
                  .replace('{{projectDirs}}', './output')
                  .replace('{{pageName}}', page.name)
                  .replace('{{pageDesc}}', page.description)
                  .replace('{{pageNavigation}}', JSON.stringify(page.navigationList))
                  .replace('{{deviceType}}', 'PC') // 可改为动态
                  .replace('{{icons}}', JSON.stringify(['hzb-icon-user', 'hzb-icon-home']))
                  .replace('{{backgroundImages}}', JSON.stringify(['hzb-background-001'])) +
                  commonCompsDesc +
                  `\n\n[CRITICAL] You MUST strictly follow the linting rules provided below. Ensure your code complies with them to avoid errors.\n${lintConfigs}\n\n list_files dir 从当前项目的output开始, read_file path 也从当前项目的output开始, 如果你需要读取components 那么它在 output/components里 `;

                const messages = [
                  {
                    role: "system",
                    content: initialSystemContent
                  },
                  { role: "user", content: "请生成该页面的完整 Vue2 代码，以 markdown 代码块格式返回。请注意：**不要**调用 write_file 工具写入文件，只需要返回代码内容即可，我会在验证通过后自动写入。" }
                ];

                const availableTools = allTools
                  .filter(t => t.name !== 'write_file') // 禁止直接写入
                  .map(t => ({
                    type: "function",
                    function: {
                      name: t.name,
                      description: t.description,
                      parameters: t.input_schema
                    }
                  }));

                let attempts = 0;
                const maxAttempts = 3;
                let lastCheckResult = { ok: false, message: 'Not started' };
                let vueCode = '';

                while (attempts < maxAttempts) {
                  attempts++;
                  console.log(`Generating page ${page.pageId} (Attempt ${attempts}/${maxAttempts})...`);

                  let codeMessage = await callWithTimeoutAndRetry(() =>
                    handleToolCalls(messages, availableTools), 3, 60000
                  );

                  let code = codeMessage.content;
                  const vueCodeMatch = code.match(/```vue\s*([\s\S]*?)\s*```/);
                  vueCode = vueCodeMatch ? vueCodeMatch[1] : code;

                  // 检查规范
                  const fileName = `${page.pageId}.vue`;
                  lastCheckResult = await checkVueCode(vueCode, fileName);

                  if (lastCheckResult.ok) {
                    break;
                  }

                  console.log(`Page ${page.pageId} lint check failed: ${lastCheckResult.message}`);

                  // Add assistant response and user error feedback to history
                  messages.push({ role: "assistant", content: code });
                  messages.push({
                    role: "user",
                    content: `The code you generated failed linting validation with the following errors:\n${lastCheckResult.details}\n\nPlease fix these errors and regenerate the COMPLETE, valid Vue2 code.`
                  });
                }

                if (!lastCheckResult.ok) {
                  throw new Error(`Failed to generate valid code after ${maxAttempts} attempts. Last error: ${lastCheckResult.message}`);
                }

                // 写入文件
                const outputPath = `./output/${page.pageId}.vue`;
                await fs.outputFile(outputPath, vueCode);

                return {
                  pageId: page.pageId,
                  success: true,
                  message: '生成成功 (Lint Passed)',
                  path: outputPath
                };
              } catch (error) {
                console.error(`生成页面 ${page.pageId} 失败:`, error.message);
                return {
                  pageId: page.pageId,
                  success: false,
                  message: `生成失败: ${error.message}`,
                  path: ''
                };
              }
            })
          )
        );

        console.log("\n生成完成：");
        results.forEach(r => {
          console.log(`${r.pageId}: ${r.message} ${r.path ? '→ ' + r.path : ''}`);
        });

        process.exit(0);
      });
    } catch (error) {
      console.error('执行过程中发生错误:', error.message);
      process.exit(1);
    }
  });
}

run();
