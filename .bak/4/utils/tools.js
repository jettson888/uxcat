const fileTools = require('../tools/file-tools.js');
const knowledgeTool = require('../tools/knowledge-tool.js');
const allTools = [...fileTools, knowledgeTool];

function executeToolStragtyToParams(args) {
    switch (args.scope) {
        case 'write_flow':
            args.content = JSON.stringify(args.content)
            break;
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
async function handleToolCalls(messages, availableTools, callChatCompletion) {
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


module.exports = {
    handleToolCalls,
}