// server/.test/task-manager-fix-test.js
// 测试task-manager.js中的ID解析问题

// 设置环境变量以确保配置正确加载
process.env.NODE_ENV = 'development';

const TaskManager = require('../utils/task-manager.js');

// 测试ID解析问题
console.log('测试ID解析逻辑...\n');

// 直接测试解析函数
const taskManager = require('../utils/task-manager.js');

// 由于_parseTaskId是私有方法，我们需要通过其他方式测试
// 通过创建任务来间接测试解析逻辑
console.log('1. 测试正常的ID格式:');

// 为测试私有方法，我们直接访问（在实际应用中这不是好做法，但这里是测试）
// 我们可以通过重新定义类来测试解析逻辑
function _parseTaskId(taskId) {
  // 匹配 generate-flow-projectId 或 generate-code-projectId-pageId
  const match = taskId.match(/^generate-(flow|code)-(.+)$/);
  if (!match) {
    throw new Error(`无效的 taskId 格式: ${taskId}，期望格式: generate-flow-projectId 或 generate-code-projectId-pageId`);
  }

  const taskType = match[1]; // 'flow' 或 'code'
  const restPart = match[2]; // projectId 或 projectId-pageId

  if (taskType === 'flow') {
    // generate-flow-projectId
    return { projectId: restPart, taskType: 'flow', pageId: null };
  } else {
    // generate-code-projectId-pageId
    // 找到最后一个 '-' 的位置来分隔 projectId 和 pageId
    const lastDashIndex = restPart.lastIndexOf('-');

    if (lastDashIndex === -1) {
      throw new Error(`无效的 code taskId 格式: ${taskId}，期望格式: generate-code-projectId-pageId`);
    }

    const projectId = restPart.substring(0, lastDashIndex);
    const pageId = restPart.substring(lastDashIndex + 1);

    return { projectId, taskType: 'code', pageId };
  }
}

// 测试正常的ID格式
console.log('1. 测试正常的ID格式:');
const normalFlowId = 'generate-flow-test-1234';
try {
  const parsed = _parseTaskId(normalFlowId);
  console.log(`解析 ${normalFlowId}:`, parsed);
} catch (e) {
  console.error(`解析 ${normalFlowId} 失败:`, e.message);
}

// 测试code ID格式
const normalCodeId = 'generate-code-test-1234-page001';
try {
  const parsed = _parseTaskId(normalCodeId);
  console.log(`解析 ${normalCodeId}:`, parsed);
} catch (e) {
  console.error(`解析 ${normalCodeId} 失败:`, e.message);
}

// 测试包含多个连字符的ID（可能会有问题）
console.log('\n2. 测试可能有问题的ID格式:');
const complexCodeId = 'generate-code-test-1234-page-001';
try {
  const parsed = _parseTaskId(complexCodeId);
  console.log(`解析 ${complexCodeId}:`, parsed);
} catch (e) {
  console.error(`解析 ${complexCodeId} 失败:`, e.message);
}

const anotherComplexId = 'generate-code-project-id-with-dashes-page-id';
try {
  const parsed = _parseTaskId(anotherComplexId);
  console.log(`解析 ${anotherComplexId}:`, parsed);
} catch (e) {
  console.error(`解析 ${anotherComplexId} 失败:`, e.message);
}

console.log('\n3. 验证解析逻辑问题:');
console.log('预期: projectId=test-1234, pageId=page-001');
console.log('实际: 如上面解析结果所示');
console.log('\n问题: 当pageId包含连字符时，解析逻辑会错误地将projectId和pageId分界点设在最后一个连字符处');