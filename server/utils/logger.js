const fs = require('fs-extra');
const path = require('path');

class DetailedLogger {
  constructor() {
    this.logDir = path.join(__dirname, '../logs');
    fs.ensureDirSync(this.logDir);
  }

  /**
   * 生成带缩进的日志内容
   * @param {*} content - 要记录的内容
   * @param {number} indentLevel - 缩进级别
   * @returns {string} 格式化后的日志内容
   */
  formatContent(content, indentLevel = 0) {
    if (typeof content === 'object') {
      const indent = '  '.repeat(indentLevel);
      return JSON.stringify(content, null, 2)
        .split('\n')
        .map(line => `${indent}${line}`)
        .join('\n');
    }
    return content;
  }

  /**
   * 生成函数调用日志
   * @param {string} functionName - 函数名称
   * @param {object} params - 函数参数
   * @param {string} caller - 调用者
   * @param {object} result - 函数执行结果
   * @param {Array} toolCalls - 工具调用列表
   * @param {string} status - 执行状态
   */
  logFunctionCall(functionName, params, caller, result, toolCalls = [], status = 'completed') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      functionName,
      caller,
      status,
      params: this.formatContent(params),
      result: this.formatContent(result),
      toolCalls: toolCalls.map((toolCall, index) => ({
        index,
        name: toolCall.name,
        arguments: this.formatContent(toolCall.arguments),
        result: this.formatContent(toolCall.result)
      }))
    };

    // 写入日志文件
    const logFilePath = path.join(this.logDir, `detailed-log-${new Date().toISOString().split('T')[0]}.json`);
    const logLine = JSON.stringify(logEntry, null, 2) + '\n';
    fs.appendFileSync(logFilePath, logLine);

    // 控制台输出格式化的日志
    this.logToConsole(logEntry);
  }

  /**
   * 控制台输出格式化的日志
   * @param {object} logEntry - 日志条目
   */
  logToConsole(logEntry) {
    const { timestamp, functionName, caller, status, params, result, toolCalls } = logEntry;

    console.log(`\n╔══════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║ 📝 ${functionName} - ${status.toUpperCase()} | ${timestamp}              ║`);
    console.log(`║ 🏷️  调用者: ${caller}                                                      ║`);
    console.log(`╠══════════════════════════════════════════════════════════════════════════════╣`);

    if (params) {
      console.log(`║ 📥 参数 (Params):                                                           ║`);
      console.log(`║${this.formatContent(params, 1).replace(/\n/g, '\n║')}                     ║`);
    }

    if (toolCalls && toolCalls.length > 0) {
      console.log(`║ 🔧 工具调用 (Tool Calls):                                                    ║`);
      toolCalls.forEach(toolCall => {
        console.log(`║   ┌─ 工具 #${toolCall.index}: ${toolCall.name} ──────────────────────────────────────┐   ║`);
        console.log(`║   │ 参数: ${toolCall.arguments.replace(/\n/g, '\n║   │ ')}                         │   ║`);
        console.log(`║   │ 结果: ${toolCall.result.replace(/\n/g, '\n║   │ ')}                         │   ║`);
        console.log(`║   └─────────────────────────────────────────────────────────────────────────┘   ║`);
      });
    }

    if (result) {
      console.log(`║ 📤 结果 (Result):                                                           ║`);
      console.log(`║${this.formatContent(result, 1).replace(/\n/g, '\n║')}                     ║`);
    }

    console.log(`╚══════════════════════════════════════════════════════════════════════════════╝\n`);
  }

  /**
   * 记录工具调用
   * @param {string} toolName - 工具名称
   * @param {object} args - 工具参数
   * @param {any} result - 工具执行结果
   * @param {string} caller - 调用者
   */
  logToolCall(toolName, args, result, caller) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type: 'tool_call',
      toolName,
      caller,
      arguments: this.formatContent(args),
      result: this.formatContent(result)
    };

    // 写入日志文件
    const logFilePath = path.join(this.logDir, `tool-call-log-${new Date().toISOString().split('T')[0]}.json`);
    const logLine = JSON.stringify(logEntry, null, 2) + '\n';
    fs.appendFileSync(logFilePath, logLine);

    // 控制台输出
    console.log(`\n🔧 [${timestamp}] 工具调用: ${toolName} (调用者: ${caller})`);
    // console.log(`   参数: ${JSON.stringify(args, null, 2).replace(/\n/g, '\n   ')}`);
    // console.log(`   结果: ${JSON.stringify(result, null, 2).replace(/\n/g, '\n   ')}`);
  }
}

// 创建单例
const logger = new DetailedLogger();
module.exports = logger;