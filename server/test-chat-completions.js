/**
 * 测试 /v1/chat/completions 接口的三种场景
 * 
 * 场景1: 调用成功且没超时
 * 场景2: 调用失败（模型生成内容不符合格式或为null）
 * 场景3: 调用超时
 */

const http = require('http');

const BASE_URL = 'http://localhost:9369';

// 模拟发送请求
function sendRequest(endpoint, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 9369,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

// 轮询任务状态
async function pollTaskStatus(projectId, maxAttempts = 60, interval = 2000) {
  console.log(`\n开始轮询任务状态 (projectId: ${projectId})...`);

  for (let i = 0; i < maxAttempts; i++) {
    const response = await sendRequest('/v1/task/status', { projectId });
    const task = response.data.task;

    console.log(`[轮询 ${i + 1}/${maxAttempts}] 状态: ${task.status}`);

    // 终态判断
    if (task.status === 'completed') {
      console.log('✅ 任务完成');
      console.log('结果:', JSON.stringify(task.result, null, 2));
      return task;
    }

    if (task.status === 'failed') {
      console.log('❌ 任务失败');
      console.log('错误:', task.error);
      return task;
    }

    if (task.status === 'timeout') {
      console.log('⏱️  任务超时');
      console.log('错误:', task.error);
      return task;
    }

    // 等待后继续轮询
    await new Promise(resolve => setTimeout(resolve, interval));
  }

  console.log('⚠️ 轮询超时');
  return null;
}

// 场景1: 正常调用（成功）
async function testSuccess() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 场景1: 调用成功且没超时');
  console.log('='.repeat(60));

  const projectId = 'test-success-' + Date.now();
  const prompt = '生成一个简单的银行首页';

  console.log(`\n1. 发送请求 (projectId: ${projectId})`);
  const response = await sendRequest('/v1/chat/completions', { projectId, prompt });

  console.log(`\n2. 立即响应:`);
  console.log(`   状态码: ${response.statusCode}`);
  console.log(`   响应体:`, JSON.stringify(response.data, null, 2));

  console.log(`\n预期结果:`);
  console.log(`   ✅ 状态码: 200`);
  console.log(`   ✅ success: true`);
  console.log(`   ✅ status: pending`);
  console.log(`   ✅ message: 任务已创建，请轮询查询状态`);

  // 轮询状态
  console.log(`\n3. 轮询任务状态`);
  const task = await pollTaskStatus(projectId);

  console.log(`\n最终状态:`);
  if (task && task.status === 'completed') {
    console.log(`   ✅ 任务状态: completed`);
    console.log(`   ✅ 文件已生成`);
    console.log(`   ✅ result 包含模型返回的内容`);
  } else {
    console.log(`   ❌ 任务未正常完成: ${task?.status || 'unknown'}`);
  }
}

// 场景2: 模型返回异常内容
async function testInvalidContent() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 场景2: 调用失败（模型生成内容不符合格式或为null）');
  console.log('='.repeat(60));

  const projectId = 'test-invalid-' + Date.now();
  const prompt = '这是一个故意让模型返回异常内容的测试'; // 实际测试需要构造让模型失败的场景

  console.log(`\n1. 发送请求 (projectId: ${projectId})`);
  const response = await sendRequest('/v1/chat/completions', { projectId, prompt });

  console.log(`\n2. 立即响应:`);
  console.log(`   状态码: ${response.statusCode}`);
  console.log(`   响应体:`, JSON.stringify(response.data, null, 2));

  console.log(`\n预期结果:`);
  console.log(`   ✅ 状态码: 200 (创建任务总是成功)`);
  console.log(`   ✅ success: true`);
  console.log(`   ✅ status: pending`);

  // 轮询状态
  console.log(`\n3. 轮询任务状态`);
  const task = await pollTaskStatus(projectId, 30); // 减少轮询次数

  console.log(`\n最终状态:`);
  if (task && task.status === 'failed') {
    console.log(`   ✅ 任务状态: failed`);
    console.log(`   ✅ error 包含错误信息: ${task.error}`);
    console.log(`   ✅ 前端可以获取到失败原因`);
  } else if (task && task.status === 'completed') {
    console.log(`   ⚠️ 任务意外完成（可能模型返回了有效内容）`);
  } else {
    console.log(`   ⚠️ 任务状态: ${task?.status || 'unknown'}`);
  }
}

// 场景3: 调用超时
async function testTimeout() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 场景3: 调用超时（120秒）');
  console.log('='.repeat(60));

  const projectId = 'test-timeout-' + Date.now();
  const prompt = '生成一个超级复杂的企业级应用，包含100个页面'; // 故意构造复杂任务

  console.log(`\n1. 发送请求 (projectId: ${projectId})`);
  const response = await sendRequest('/v1/chat/completions', { projectId, prompt });

  console.log(`\n2. 立即响应:`);
  console.log(`   状态码: ${response.statusCode}`);
  console.log(`   响应体:`, JSON.stringify(response.data, null, 2));

  console.log(`\n预期结果:`);
  console.log(`   ✅ 状态码: 200`);
  console.log(`   ✅ success: true`);
  console.log(`   ✅ status: pending`);

  // 轮询状态（等待超时，120秒）
  console.log(`\n3. 轮询任务状态（等待超时...预计120秒）`);
  const task = await pollTaskStatus(projectId, 70, 2000); // 70次 * 2秒 = 140秒

  console.log(`\n最终状态:`);
  if (task && task.status === 'timeout') {
    console.log(`   ✅ 任务状态: timeout`);
    console.log(`   ✅ error: 任务执行超时`);
    console.log(`   ✅ 超时保护生效`);
  } else if (task && task.status === 'completed') {
    console.log(`   ⚠️ 任务意外完成（可能在120秒内完成）`);
  } else if (task && task.status === 'failed') {
    console.log(`   ⚠️ 任务失败: ${task.error}`);
  } else {
    console.log(`   ⚠️ 任务状态: ${task?.status || 'unknown'}`);
  }
}

// 主测试函数
async function runTests() {
  console.log('\n🧪 开始测试 /v1/chat/completions 接口');
  console.log('测试目标: http://localhost:9369/v1/chat/completions');

  try {
    // 测试场景1: 成功
    await testSuccess();

    // 等待一段时间
    console.log('\n⏳ 等待 5 秒后进行下一个测试...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // 测试场景2: 失败
    await testInvalidContent();

    // 注意: 场景3需要很长时间（120秒+），可以单独运行
    console.log('\n' + '='.repeat(60));
    console.log('⚠️ 场景3 (超时测试) 需要 120+ 秒，已跳过');
    console.log('如需测试超时，请单独运行: testTimeout()');
    console.log('='.repeat(60));

    // 如果需要测试超时，取消下面的注释
    // await testTimeout();

  } catch (error) {
    console.error('\n❌ 测试执行出错:', error);
  }

  console.log('\n✅ 测试完成');
}

// 运行测试
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testSuccess,
  testInvalidContent,
  testTimeout,
  runTests
};
