function getHistoryByMessage(messages) {
  // 从消息历史中提取最终状态
  let lastCode = '';
  let lastFilePath = '';
  let isVerified = false;
  let verificationResult = null;
  let toolResults = [];

  // 遍历消息历史寻找工具调用结果
  for (const msg of messages) {
    if (msg.role === 'tool') {
      try {
        const content = JSON.parse(msg.content);

        // 收集所有工具结果
        toolResults.push({
          name: msg.name,
          result: content
        });

        // 2. 检查是否有成功的写入操作
        if (msg.name === 'write_file' && content.success) {
          // 记录最后一次成功的写入
          // write_file 的 content 可能是简单的 success 消息，我们需要从对应的 tool_calls 参数中找代码
          // 但这里 tools.js 的 executeTool 返回的是 result
          // 实际上我们需要找对应的 tool_call 参数来获取 content/code
          // 让我们稍微回溯一下找到这个 tool_call
          const assistantMsg = messages.find(m =>
            m.tool_calls && m.tool_calls.some(tc => tc.id === msg.tool_call_id)
          );

          if (assistantMsg) {
            const toolCall = assistantMsg.tool_calls.find(tc => tc.id === msg.tool_call_id);
            if (toolCall) {
              const args = JSON.parse(toolCall.function.arguments);
              // 优先使用 content (write_file), 如果没有则可能是其他参数? 
              // file-tools.js 中 write_file 参数是 { path, content, ... }
              if (args.content) {
                lastCode = args.content;
                lastFilePath = args.path;
              }
            }
          }
        }

        // 3. 检查代码验证结果
        if (msg.name === 'vue2_code_verification') {
          verificationResult = content;
          isVerified = content.success;
        }

      } catch (e) {
        console.warn('解析工具结果失败:', e);
      }
    }
  }

  return {
    lastCode,
    lastFilePath,
    isVerified,
    verificationResult,
    toolResults
  }
}

module.exports = {
  getHistoryByMessage
}