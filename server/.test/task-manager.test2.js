// server/.test/task-manager.test.js
// 测试task-manager.js的功能，分别测试flow和code任务类型

// 设置环境变量以确保配置正确加载
process.env.NODE_ENV = 'development';

const TaskManager = require('../utils/task-manager.js');
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

// 项目ID
const projectId = '13131313';

// 生成任务ID的辅助函数
function generateFlowTaskId(projectId) {
  return `generate-flow-${projectId}`;
}

function generateCodeTaskId(projectId, pageId) {
  return `generate-code-${projectId}-${pageId}`;
}

async function runTests() {
  console.log('开始测试 TaskManager 功能...\n');

  // 清理之前的测试数据
  const testDataDir = path.join(config.PROJECT_DIR, projectId, '1', 'data');
  if (fs.existsSync(testDataDir)) {
    fs.removeSync(testDataDir);
    console.log('清理了之前的测试数据');
  }

  console.log('1. 测试 Flow 任务\n');

  // 创建flow任务
  const flowTaskId = generateFlowTaskId(projectId);
  console.log(`创建flow任务: ${flowTaskId}`);
  const flowTask = TaskManager.createTask(flowTaskId);
  console.log('Flow任务创建结果:', JSON.stringify(flowTask, null, 2));

  // 检查内存中的任务
  console.log('\n从内存获取flow任务:');
  const flowTaskFromMemory = TaskManager.getTask(flowTaskId);
  console.log('内存中的flow任务:', JSON.stringify(flowTaskFromMemory, null, 2));

  // 更新flow任务状态为处理中
  console.log('\n更新flow任务状态为处理中...');
  TaskManager.startTask(flowTaskId);
  const updatedFlowTask = TaskManager.getTask(flowTaskId);
  console.log('更新后的flow任务:', JSON.stringify(updatedFlowTask, null, 2));

  // 模拟处理完成
  console.log('\n模拟flow任务完成...');
  TaskManager.completeTask(flowTaskId, { message: 'Flow生成成功', data: { pages: [] } });
  const completedFlowTask = TaskManager.getTask(flowTaskId);
  console.log('完成后的flow任务:', JSON.stringify(completedFlowTask, null, 2));

  console.log('\n2. 测试 Code 任务\n');

  // 创建多个code任务
  const pageIds = ['homePage', 'dashboard', 'login', 'orderCart', 'productDetail'];
  const codeTasks = [];

  for (const pageId of pageIds) {
    const codeTaskId = generateCodeTaskId(projectId, pageId);
    console.log(`创建code任务: ${codeTaskId}`);
    const codeTask = TaskManager.createTask(codeTaskId);
    codeTasks.push({ taskId: codeTaskId, pageId });
    console.log(`Code任务创建结果:`, JSON.stringify(codeTask, null, 2));
  }

  // 检查内存中的code任务
  console.log('\n从内存获取所有code任务:');
  for (const { taskId } of codeTasks) {
    const taskFromMemory = TaskManager.getTask(taskId);
    console.log(`内存中的code任务(${taskId}):`, JSON.stringify(taskFromMemory, null, 2));
  }

  // 更新code任务状态为处理中
  console.log('\n更新code任务状态为处理中...');
  for (const { taskId } of codeTasks) {
    TaskManager.startTask(taskId);
  }

  // 检查更新后的状态
  console.log('\n更新后的code任务状态:');
  for (const { taskId } of codeTasks) {
    const updatedTask = TaskManager.getTask(taskId);
    console.log(`${taskId} 状态: ${updatedTask.status}`);
  }

  // 模拟部分任务完成，部分任务失败
  console.log('\n模拟code任务完成和失败...');

  // 第一个任务完成
  TaskManager.completeTask(codeTasks[0].taskId, {
    message: '页面代码生成成功',
    code: '<template>...</template>'
  });

  // 第二个任务失败
  TaskManager.failTask(codeTasks[1].taskId, new Error('模型生成失败'));

  // 第三个任务超时
  TaskManager.timeoutTask(codeTasks[2].taskId);

  console.log('\n最终code任务状态:');
  for (const { taskId } of codeTasks) {
    const finalTask = TaskManager.getTask(taskId);
    console.log(`${taskId}: 状态=${finalTask.status}, 错误=${finalTask.error || '无'}`);
  }

  // 测试获取项目下所有code任务
  console.log('\n获取项目下所有code任务:');
  const allCodeTasks = TaskManager.getCodeTasks(projectId);
  console.log('项目下所有code任务:', JSON.stringify(allCodeTasks, null, 2));

  // 测试从文件重新加载
  console.log('\n3. 测试从文件重新加载\n');

  // 创建一个新的TaskManager实例来模拟重新启动
  const NewTaskManager = require('../utils/task-manager.js'); // 由于是单例，这实际上是同一个实例

  // 从文件加载flow任务
  console.log('从文件加载flow任务:');
  const flowTaskFromFile = NewTaskManager.getTask(flowTaskId);
  console.log('从文件加载的flow任务:', JSON.stringify(flowTaskFromFile, null, 2));

  // 从文件加载code任务
  console.log('\n从文件加载code任务:');
  for (const { taskId } of codeTasks) {
    const codeTaskFromFile = NewTaskManager.getTask(taskId);
    console.log(`${taskId} (从文件): 状态=${codeTaskFromFile.status}`);
  }

  console.log('\n4. 测试不同任务类型的区别\n');

  // 比较flow和code任务的存储方式
  const flowTaskPath = path.join(testDataDir, 'task-flow.json');
  const codeTaskPath = path.join(testDataDir, 'task-code.json');

  console.log('\nFlow任务存储在单个JSON文件中:');
  if (fs.existsSync(flowTaskPath)) {
    const flowTaskContent = fs.readJsonSync(flowTaskPath);
    console.log('task-flow.json内容:', JSON.stringify(flowTaskContent, null, 2));
  }

  console.log('\nCode任务存储在数组JSON文件中:');
  if (fs.existsSync(codeTaskPath)) {
    const codeTasksContent = fs.readJsonSync(codeTaskPath);
    console.log('task-code.json内容:', JSON.stringify(codeTasksContent, null, 2));
  }

  console.log('\n测试完成！');
}

// 运行测试
runTests().catch(err => {
  console.error('测试过程中出现错误:', err);
  process.exit(1);
});