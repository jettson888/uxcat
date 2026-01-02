# /v1/chat/completions 接口测试结果预期

## 三种场景详细分析

---

## 📊 场景 1: 调用成功且没超时

### 请求

```javascript
POST /v1/chat/completions
{
  "projectId": "test-success-123",
  "prompt": "生成一个银行首页"
}
```

### 立即响应（同步返回）

```json
HTTP 200 OK
{
  "success": true,
  "projectId": "test-success-123",
  "taskId": "test-success-123",
  "status": "pending",
  "message": "任务已创建，请轮询查询状态"
}
```

**响应时间**: < 100ms（立即返回，不等待 LLM）

### 后台执行流程

1. **创建任务** → `status: pending`
2. **开始处理** → `status: processing`
3. **调用 LLM** → Function Calling 循环
4. **执行工具** → write_file 写入 workflow.json
5. **任务完成** → `status: completed`

### 轮询查询（第一次）

```javascript
POST /v1/task/status
{ "projectId": "test-success-123" }
```

**响应**:

```json
HTTP 200 OK
{
  "success": true,
  "task": {
    "projectId": "test-success-123",
    "taskType": 1,
    "status": "processing",
    "createdAt": 1704067200000,
    "updatedAt": 1704067210000,
    "error": null,
    "result": null
  }
}
```

### 轮询查询（最终）

```json
HTTP 200 OK
{
  "success": true,
  "task": {
    "projectId": "test-success-123",
    "taskType": 1,
    "status": "completed",  ← 完成状态
    "createdAt": 1704067200000,
    "updatedAt": 1704067260000,
    "error": null,
    "result": {  ← 包含结果
      "message": {
        "role": "assistant",
        "content": "已生成workflow文件"
      },
      "workflowPath": "D:/frontend-code/hzux/test-success-123/1/data/workflow.json"
    }
  }
}
```

### 文件系统变化

```
D:/frontend-code/hzux/test-success-123/
└── 1/
    └── data/
        ├── task.json       ← 任务状态文件
        └── workflow.json   ← 生成的流程文件
```

### ✅ 预期结果

- [x] HTTP 200，立即返回任务创建成功
- [x] 前端立即跳转到 flow 页面开始轮询
- [x] 后台异步执行，不阻塞其他请求
- [x] 任务状态从 `pending` → `processing` → `completed`
- [x] 生成 workflow.json 文件
- [x] 任务文件持久化到磁盘
- [x] result 字段包含模型返回的内容

---

## 📊 场景 2: 调用失败（模型生成内容不符合格式或为 null）

### 请求

```javascript
POST /v1/chat/completions
{
  "projectId": "test-invalid-456",
  "prompt": "..."
}
```

### 立即响应（同步返回）

```json
HTTP 200 OK
{
  "success": true,
  "projectId": "test-invalid-456",
  "taskId": "test-invalid-456",
  "status": "pending",
  "message": "任务已创建，请轮询查询状态"
}
```

**注意**: 即使后续会失败，创建任务阶段仍然返回成功！

### 后台执行流程

1. **创建任务** → `status: pending`
2. **开始处理** → `status: processing`
3. **调用 LLM** → 可能出现的错误：
   - 模型返回 null
   - 模型返回格式错误的 JSON
   - 工具调用参数解析失败
   - 文件写入失败
4. **捕获异常** → `catch (error)`
5. **标记失败** → `taskManager.failTask(projectId, error)`

### 轮询查询（最终）

```json
HTTP 200 OK
{
  "success": true,
  "task": {
    "projectId": "test-invalid-456",
    "taskType": 1,
    "status": "failed",  ← 失败状态
    "createdAt": 1704067200000,
    "updatedAt": 1704067230000,
    "error": "工具参数解析失败: {...}",  ← 错误信息
    "result": null
  }
}
```

### 可能的错误信息示例

```javascript
// 1. 模型返回 null
"error": "Cannot read property 'tool_calls' of null"

// 2. JSON 解析失败
"error": "工具参数解析失败: Unexpected token < in JSON at position 0"

// 3. 文件写入失败
"error": "文件写入失败: EACCES: permission denied"

// 4. 工具未找到
"error": "未找到工具: write_file_wrong_name"
```

### 文件系统变化

```
D:/frontend-code/hzux/test-invalid-456/
└── 1/
    └── data/
        └── task.json  ← 只有任务状态，没有 workflow.json
```

### ✅ 预期结果

- [x] HTTP 200，立即返回任务创建成功（创建阶段不会失败）
- [x] 前端正常跳转并开始轮询
- [x] 后台执行过程中捕获异常
- [x] 任务状态从 `pending` → `processing` → `failed`
- [x] error 字段记录详细错误信息
- [x] 前端可以获取错误并提示用户
- [x] workflow.json 文件可能不存在或不完整

---

## 📊 场景 3: 调用超时（120 秒）

### 请求

```javascript
POST /v1/chat/completions
{
  "projectId": "test-timeout-789",
  "prompt": "生成一个超级复杂的系统，包含100个页面"
}
```

### 立即响应（同步返回）

```json
HTTP 200 OK
{
  "success": true,
  "projectId": "test-timeout-789",
  "taskId": "test-timeout-789",
  "status": "pending",
  "message": "任务已创建，请轮询查询状态"
}
```

### 后台执行流程

1. **创建任务** → `status: pending`
2. **开始处理** → `status: processing`
3. **调用 LLM** → Function Calling 循环
4. **超时控制触发** (120 秒后)
   ```javascript
   // wrapper.js 中的超时控制
   setTimeout(() => {
     abortController.abort(); // 中断请求
     reject(new Error(`操作超时 (120000ms)`));
   }, 120000);
   ```
5. **重试机制** → 尝试 3 次，每次都超时
6. **最终失败** → 抛出超时异常
7. **判断超时** → `error.message.includes('超时')`
8. **标记超时** → `taskManager.timeoutTask(projectId)`

### 轮询查询（进行中）

```json
// 第 1-60 次轮询
{
  "success": true,
  "task": {
    "status": "processing",  ← 一直处理中
    "error": null
  }
}
```

### 轮询查询（超时后）

```json
HTTP 200 OK
{
  "success": true,
  "task": {
    "projectId": "test-timeout-789",
    "taskType": 1,
    "status": "timeout",  ← 超时状态
    "createdAt": 1704067200000,
    "updatedAt": 1704067320000,  ← 120秒后
    "error": "任务执行超时",  ← 超时提示
    "result": null
  }
}
```

### 时间线

```
00:00  → 请求创建，立即返回
00:02  → 轮询第1次: processing
00:04  → 轮询第2次: processing
...
02:00  → 第一次重试超时
02:01  → 等待1秒，第二次重试
04:00  → 第二次重试超时
04:03  → 等待2秒，第三次重试
06:00  → 第三次重试超时，放弃
06:00  → 标记为 timeout
06:02  → 轮询: timeout ✅
```

### 超时控制机制

```javascript
// 外层超时（120秒）
callWithTimeoutAndRetry(task, 3, 120000)
  ├─ 第1次尝试 → 120秒超时
  ├─ 等待1秒
  ├─ 第2次尝试 → 120秒超时
  ├─ 等待2秒
  └─ 第3次尝试 → 120秒超时 → 抛出异常

// 内层超时（60秒）
callChatCompletion({ timeout: 60000 })
  └─ 单次LLM调用 60秒超时

// 级联中断
外层超时 → abortController.abort() → signal 传递 → axios 中断
```

### 文件系统变化

```
D:/frontend-code/hzux/test-timeout-789/
└── 1/
    └── data/
        ├── task.json       ← 任务状态（timeout）
        └── workflow.json?  ← 可能部分生成（不完整）
```

### ✅ 预期结果

- [x] HTTP 200，立即返回任务创建成功
- [x] 前端正常跳转并开始轮询
- [x] 后台执行，120 秒后触发超时
- [x] 重试机制生效（3 次，每次 120 秒）
- [x] 任务状态从 `pending` → `processing` → `timeout`
- [x] error 字段: "任务执行超时"
- [x] 前端可以提示用户超时，建议简化需求
- [x] HTTP 连接正常关闭，不会泄漏

---

## 🔍 关键代码路径

### 成功路径

```
handleChatCompletions (controller.js:38)
  → createTask (task-manager.js:12)
  → res.end() 立即返回 ✅
  → setImmediate() 异步执行
  → executeFlowGeneration (controller.js:72)
  → startTask (task-manager.js:53)
  → handleToolCalls (tools.js:99)
  → callChatCompletion (api.js:6)
  → completeTask (task-manager.js:58) ✅
```

### 失败路径

```
handleChatCompletions
  → createTask
  → res.end() 立即返回 ✅
  → executeFlowGeneration
  → startTask
  → handleToolCalls
  → 异常抛出 ❌
  → catch (error)
  → failTask (task-manager.js:66) ❌
```

### 超时路径

```
handleChatCompletions
  → createTask
  → res.end() 立即返回 ✅
  → executeFlowGeneration
  → startTask
  → callWithTimeoutAndRetry (wrapper.js:3)
    → Promise.race([task(), timeout])
    → timeout 胜出 ⏱️
    → abortController.abort()
    → 重试 3 次
    → 全部超时 ❌
  → catch (error)
  → error.message.includes('超时') → true
  → timeoutTask (task-manager.js:74) ⏱️
```

---

## 📋 测试检查清单

### 场景 1: 成功

- [ ] 立即返回 200 状态码
- [ ] 返回 `status: pending`
- [ ] 后台异步执行不阻塞
- [ ] 最终状态为 `completed`
- [ ] workflow.json 文件生成
- [ ] task.json 持久化
- [ ] result 字段有值

### 场景 2: 失败

- [ ] 立即返回 200 状态码
- [ ] 返回 `status: pending`
- [ ] 最终状态为 `failed`
- [ ] error 字段包含错误信息
- [ ] task.json 记录失败状态
- [ ] 前端能获取错误提示

### 场景 3: 超时

- [ ] 立即返回 200 状态码
- [ ] 返回 `status: pending`
- [ ] 120 秒后状态变为 `timeout`
- [ ] 重试机制生效（3 次）
- [ ] error: "任务执行超时"
- [ ] HTTP 连接正常关闭
- [ ] 内存不泄漏

---

## 🚀 运行测试

```bash
# 启动服务
cd d:/code/workcode/hzbank/core/ai-ux/server
node index.js

# 运行测试（新终端）
node test-chat-completions.js
```

## ⚠️ 注意事项

1. **超时测试很耗时**：场景 3 需要 360+ 秒（3 次重试 × 120 秒），建议单独测试
2. **需要真实 LLM**：测试依赖真实的 LLM API，确保配置正确
3. **文件系统权限**：确保有写入 `PROJECT_DIR` 的权限
4. **并发测试**：测试之间需要间隔，避免相互影响
