import { LlmService } from './llm-service.js';
const llmService = new LlmService();

const SYSTEM_PROMPT = `
你需要解决一个问题。为此，你需要将问题分解为多个步骤。对于每个步骤，首先使用 <thought> 思考要做什么，然后使用可用工具之一决定一个 <action>。接着，你将根据你的行动从环境/工具中收到一个 <observation>。持续这个思考和行动的过程，直到你有足够的信息来提供 <final_answer>。

所有步骤请严格使用以下 XML 标签格式输出：
- <question> 用户问题
- <thought> 思考
- <action> 采取的工具操作
- <observation> 工具或环境返回的结果
- <final_answer> 最终答案

 请严格遵守：
- 你每次回答都必须包括两个标签，第一个是 <thought>，第二个是 <action> 或 <final_answer>
- 输出 <action> 后立即停止生成，等待真实的 <observation>，擅自生成 <observation> 将导致错误
- 如果 <action> 中的某个工具参数有多行的话，请使用 \n 来表示，如：<action>write_to_file("/tmp/test.txt", "a\nb\nc")</action>
- 工具参数中的文件路径请使用绝对路径，不要只给出一个文件名。比如要写 write_to_file("/tmp/test.txt", "内容")，而不是 write_to_file("test.txt", "内容")
`
class ReActAgent {
  constructor(tools, model) {
    this.tools = tools
    this.model = model
  }

  async run(prompt) {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]

    while (true) {
      const content = await this.callModel(messages)
      const thougthMatch = content.match(/<thought>(.*?)<\/thought>/s)
      if (thougthMatch) {
        console.log("\n\n💭 Thought: ", thougthMatch[1])
      }
      if (content.includes('<final_answer>')) {
        return content.match(/<final_answer>(.*?)<\/final_answer>/s)[1]
      }

      // 检测action
      const actionMatch = content.match(/<action>(.*?)<\/action>/s)
      if (!actionMatch) {
        throw new Error('模型未输出action')
      }

      // 解析action
      const { toolName, args } = this._parseAction(actionMatch[1])
      console.log(`\n\n🔧 Action: ${toolName}(${', '.join(args)})`)

      // 执行action
      const tool = this.tools[toolName]
      if (!tool) {
        throw new Error(`未找到工具 ${toolName}`)
      }
      try {
        const observation = await tool(...args)
        console.log(`\n\n📝 Observation: ${observation}`)
        const obsMsg = `<observation>${observation}</observation>`
        messages.append({ "role": "user", "content": obsMsg })
      } catch (error) {
        console.error('工具执行错误:', error);
      }
    }
  }

  _parseAction(action) {
    // 解析action
    const match = action.match(/^(\w+)\((.*)\)$/s); // 使用/s标志以支持多行参数
    if (!match) {
      throw new Error('无效的action格式');
    }
    const toolName = match[1];
    const toolArgsString = match[2];

    let args = [];
    if (toolArgsString.trim() !== '') {
      try {
        // 使用 Function 构造函数安全地解析参数数组
        // 这比直接用 eval 安全得多
        const argResolver = new Function(`return [${toolArgsString}]`);
        args = argResolver();
      } catch (e) {
        console.error('解析action参数失败:', e);
        throw new Error('无法解析action参数');
      }
    }

    return {
      toolName,
      args
    };
  }

  async callModel(messages) {
    return await llmService.chatCompletion(messages, this.model)
  }
}

// console.log(`<action>write_to_file("/a/b/c/d/e.vue", "<template>xxxx</template>", "sss")</action>`.match(/<action>(.*?)<\/action>/s))
// console.log(new ReActAgent()._parseAction(`write_to_file("/a/b/c/d/e.vue", "<template>xxxx</template>", "sss")`))
// finalAnswer = new ReActAgent(tools, model).run(page)