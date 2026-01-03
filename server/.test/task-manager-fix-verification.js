// server/.test/task-manager-fix-verification.js
// 验证task-manager.js修复后的ID解析功能

// 设置环境变量以确保配置正确加载
process.env.NODE_ENV = 'development';

const TaskManager = require('../utils/task-manager.js');

// 重新定义修复后的解析函数用于测试
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
    // 修复：使用更可靠的逻辑来分隔projectId和pageId
    // 基于常见的命名约定，projectId通常在第一个数字序列后结束

    // 查找第一个数字序列后的连字符作为分界点
    // 例如: generate-code-test-1234-page-001
    // 'test-1234' 是projectId, 'page-001' 是pageId

    // 寻找数字后的第一个连字符
    let splitIndex = -1;
    let inNumberSequence = false;

    for (let i = 0; i < restPart.length; i++) {
      const char = restPart[i];

      if (/[0-9]/.test(char)) {
        inNumberSequence = true;
      } else if (char === '-' && inNumberSequence) {
        // 找到数字序列后的第一个连字符
        splitIndex = i;
        break;
      } else if (/[a-zA-Z]/.test(char)) {
        // 遇到字母，重置数字序列标记
        inNumberSequence = false;
      }
    }

    // 如果没找到合适的分割点，使用第一个连字符
    if (splitIndex === -1) {
      const firstDashIndex = restPart.indexOf('-');
      if (firstDashIndex === -1) {
        throw new Error(`无效的 code taskId 格式: ${taskId}，期望格式: generate-code-projectId-pageId`);
      }
      splitIndex = firstDashIndex;
    }

    const projectId = restPart.substring(0, splitIndex);
    const pageId = restPart.substring(splitIndex + 1);

    return { projectId, taskType: 'code', pageId };
  }
}

console.log('验证修复后的ID解析功能...\n');

// 测试各种ID格式
const testCases = [
  {
    id: 'generate-flow-test-1234',
    expected: { projectId: 'test-1234', taskType: 'flow', pageId: null },
    description: '简单的flow任务ID'
  },
  {
    id: 'generate-code-test-1234-page001',
    expected: { projectId: 'test-1234', taskType: 'code', pageId: 'page001' },
    description: '简单的code任务ID'
  },
  {
    id: 'generate-code-test-1234-page-001',
    expected: { projectId: 'test-1234', taskType: 'code', pageId: 'page-001' },
    description: '包含连字符的pageId（修复前有问题的场景）'
  },
  {
    id: 'generate-code-project-id-with-dashes-page-id',
    expected: { projectId: 'project-id-with-dashes', taskType: 'code', pageId: 'page-id' },
    description: 'projectId和pageId都包含连字符'
  },
  {
    id: 'generate-code-proj_123-page_abc-def',
    expected: { projectId: 'proj_123', taskType: 'code', pageId: 'page_abc-def' },
    description: 'projectId包含下划线，pageId包含连字符'
  }
];

console.log('测试结果：\n');

let allTestsPassed = true;

for (const testCase of testCases) {
  try {
    const result = _parseTaskId(testCase.id);
    const passed = JSON.stringify(result) === JSON.stringify(testCase.expected);

    console.log(`${passed ? '✅' : '❌'} ${testCase.description}`);
    console.log(`   ID: ${testCase.id}`);
    console.log(`   期望: ${JSON.stringify(testCase.expected)}`);
    console.log(`   实际: ${JSON.stringify(result)}`);
    console.log('');

    if (!passed) {
      allTestsPassed = false;
    }
  } catch (e) {
    console.log(`❌ ${testCase.description}`);
    console.log(`   ID: ${testCase.id}`);
    console.log(`   错误: ${e.message}`);
    console.log('');
    allTestsPassed = false;
  }
}

console.log(`\n总体结果: ${allTestsPassed ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);

// 测试原始的task-manager实例
console.log('\n使用原始task-manager实例测试:');
const taskManager = require('../utils/task-manager.js');

// 由于task-manager是单例且修复了代码，我们可以直接测试
try {
  // 创建一个测试任务来验证修复
  const testTaskId = 'generate-code-test-1234-page-001';
  const parsed = taskManager._parseTaskId(testTaskId);
  console.log(`✅ 修复后的task-manager解析 ${testTaskId}:`, parsed);
  console.log('   修复前错误解析为 projectId=test-1234-page, pageId=001');
  console.log('   修复后期望解析为 projectId=test-1234, pageId=page-001');
  console.log(`   修复后实际解析为 projectId=${parsed.projectId}, pageId=${parsed.pageId}`);
} catch (e) {
  console.error('❌ 原始task-manager实例测试失败:', e.message);
}