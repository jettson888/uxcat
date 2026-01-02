const fileTools = require('../tools/file-tools.js');
const knowledgeTool = require('../tools/knowledge-tool.js');

const allTools = [...fileTools, knowledgeTool];

/**
 * 解析模型生成的数据，自动判断格式并处理
 * @param {string|object} content - 模型生成的内容
 * @param {string} filePath - 目标文件路径
 * @returns {Object} { content: 处理后的内容, useJsonWrite: 是否使用 writeJson }
 * 
 * @example
 * // 场景1: 模型返回 JSON 对象，写入 .json 文件
 * parseModelGeneratedData({ name: 'test', pages: [] }, 'workflow.json')
 * // => { content: { name: 'test', pages: [] }, useJsonWrite: true }
 * // 将使用 fs.writeJson 格式化写入
 * 
 * @example
 * // 场景2: 模型返回 JSON 字符串，写入 .json 文件
 * parseModelGeneratedData('{"name":"test"}', 'workflow.json')
 * // => { content: { name: 'test' }, useJsonWrite: true }
 * // 自动解析后使用 fs.writeJson 格式化写入
 * 
 * @example
 * // 场景3: 模型返回代码字符串，写入 .vue 文件
 * parseModelGeneratedData('<template>...</template>', 'HomePage.vue')
 * // => { content: '<template>...</template>', useJsonWrite: false }
 * // 使用 fs.outputFile 直接写入
 * 
 * @example
 * // 场景4: 模型返回对象，但写入非 JSON 文件（转为字符串）
 * parseModelGeneratedData({ code: 'xxx' }, 'test.vue')
 * // => { content: '{\n  "code": "xxx"\n}', useJsonWrite: false }
 */
function parseModelGeneratedData(content, filePath) {
    const ext = filePath ? filePath.toLowerCase().split('.').pop() : '';

    // 如果已经是字符串
    if (typeof content === 'string') {
        try {
            // 尝试解析为 JSON，检查是否是有效的 JSON 字符串
            const parsed = JSON.parse(content);

            // 如果是 .json 文件，返回对象用于 writeJson
            if (ext === 'json') {
                return { content: parsed, useJsonWrite: true };
            }

            // 其他文件（如 .vue, .js），保持字符串格式
            return { content, useJsonWrite: false };
        } catch (e) {
            // 不是有效的 JSON 字符串，直接返回原字符串（代码文件）
            return { content, useJsonWrite: false };
        }
    }

    // 如果是对象或数组
    if (typeof content === 'object' && content !== null) {
        // .json 文件，使用 writeJson
        if (ext === 'json') {
            return { content, useJsonWrite: true };
        }

        // 非 .json 文件但是对象，转为字符串
        return { content: JSON.stringify(content, null, 2), useJsonWrite: false };
    }

    // 其他类型（数字、布尔等），转为字符串
    return { content: String(content), useJsonWrite: false };
}

/**
 * 策略性处理工具参数
 */
function executeToolStrategyToParams(args) {
    switch (args.scope) {
        case 'write_flow':
            // 解析 workflow 数据
            const result = parseModelGeneratedData(args.content, args.path);
            args.content = result.useJsonWrite ? result.content : JSON.stringify(result.content, null, 2);
            args.useJsonWrite = result.useJsonWrite;
            break;

        default:
            // 通用处理：根据文件路径自动判断
            if (args.content && args.path) {
                const parsed = parseModelGeneratedData(args.content, args.path);
                args.content = parsed.useJsonWrite ? parsed.content : parsed.content;
                args.useJsonWrite = parsed.useJsonWrite;
            }
            break;
    }
}

// 工具执行器
async function executeTool(toolCall, signal) {
    const { name, arguments: argsStr } = toolCall.function;
    let args;

    try {
        args = JSON.parse(argsStr);
    } catch (e) {
        throw new Error(`工具参数解析失败: ${argsStr}`);
    }

    console.log(`执行工具: ${name}`, args);
    const tool = allTools.find(tool => tool.name === name)
    if (!tool) {
        throw new Error(`未找到工具: ${name}`);
    }

    if (signal?.aborted) {
        throw new Error('工具调用被取消');
    }
    console.log('args----', args)
    // executeToolStrategyToParams(args); 

    return await tool.execute(args);
}

// 处理工具调用循环
async function handleToolCalls(options) {
    const { messages, tools, signal, callback = () => null, maxIterations = 10, earlyExit = true } = options
    let iteration = 0;

    let response = await callback(messages, tools);
    console.log('🤖 第1次调用模型，返回:', response.content ? '文本内容' : '工具调用请求');

    // 工具调用循环
    while (response.tool_calls && response.tool_calls.length > 0) {
        iteration++;

        if (iteration > maxIterations) {
            console.error(`工具调用循环超过最大次数限制 (${maxIterations})`);
            throw new Error(`工具调用循环次数超限，可能陷入死循环`);
        }

        console.log(`\n📋 第${iteration}轮工具调用，共 ${response.tool_calls.length} 个工具`);

        const toolResults = [];
        let allToolsSucceeded = true;

        // 执行所有工具调用
        for (const toolCall of response.tool_calls) {
            try {
                const result = await executeTool(toolCall, signal);

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolCall.function.name,
                    content: JSON.stringify(result)
                });

                console.log(`  ✅ 工具 ${toolCall.function.name} 执行成功`);
            } catch (error) {
                allToolsSucceeded = false;

                toolResults.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolCall.function.name,
                    content: JSON.stringify({ error: error.message })
                });

                console.error(`  ❌ 工具 ${toolCall.function.name} 执行失败:`, error.message);
            }
        }

        // 将工具执行结果添加到消息历史中
        messages.push({
            role: "assistant",
            tool_calls: response.tool_calls
        });
        messages.push(...toolResults);

        // 🎯 关键优化：如果所有工具都执行成功且启用了早期退出，直接返回
        if (earlyExit && allToolsSucceeded) {
            console.log('\n✅ 所有工具执行成功，提前退出（不再调用模型）');

            // 构造一个成功的响应返回
            return {
                role: "assistant",
                content: `已成功执行 ${response.tool_calls.length} 个工具调用，任务完成。`,
                tool_calls_executed: response.tool_calls.length,
                early_exit: true
            };
        }

        // 如果有工具失败，或者禁用了早期退出，继续调用模型让它看结果
        console.log(`\n🔄 继续调用模型（${allToolsSucceeded ? '已禁用早期退出' : '有工具执行失败'}）...`);
        response = await callback(messages, tools);
        console.log(`🤖 第${iteration + 1}次调用模型，返回:`, response.content ? '文本内容' : '继续工具调用');
    }

    return response;
}


module.exports = {
    handleToolCalls,
}