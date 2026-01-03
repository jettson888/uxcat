# TaskManager 测试结果报告

## 测试概述

本次测试针对 `server/utils/task-manager.js` 模块，测试了 flow 和 code 两种任务类型的功能表现，项目 ID 为 `test-1234`。

## 测试内容

### 1. Flow 任务测试

- **任务 ID 格式**: `generate-flow-{projectId}`
- **存储方式**: 单个 JSON 文件（`task-flow.json`）
- **测试结果**:
  - ✅ 任务创建、状态更新、完成等基本功能正常
  - ✅ 任务状态流转正常（pending → processing → completed）
  - ✅ 任务持久化到文件系统正常
  - ✅ 从文件系统重新加载正常

### 2. Code 任务测试

- **任务 ID 格式**: `generate-code-{projectId}-{pageId}`
- **存储方式**: 数组 JSON 文件（`task-code.json`）
- **测试结果**:
  - ✅ 任务创建、状态更新等基本功能正常
  - ✅ 支持多种状态（completed、failed、timeout）
  - ✅ 任务持久化到文件系统正常
  - ❌ **发现 ID 解析问题**（见下文）

### 3. 两种任务类型的区别

| 特性         | Flow 任务                   | Code 任务                            |
| ------------ | --------------------------- | ------------------------------------ |
| 存储方式     | 单个 JSON 文件              | 数组 JSON 文件                       |
| 每项目数量   | 1 个                        | 多个（每个页面一个）                 |
| 任务 ID 格式 | `generate-flow-{projectId}` | `generate-code-{projectId}-{pageId}` |

## 发现的问题

### ID 解析逻辑缺陷

**问题描述**: 当 `pageId` 包含连字符时，task-manager 的 `_parseTaskId` 方法会错误地解析任务 ID。

**具体示例**:

- 任务 ID: `generate-code-test-1234-page-001`
- **错误解析结果**: `{ projectId: 'test-1234-page', taskType: 'code', pageId: '001' }`
- **期望解析结果**: `{ projectId: 'test-1234', taskType: 'code', pageId: 'page-001' }`

**根本原因**: `_parseTaskId` 方法使用 `lastIndexOf('-')` 来分隔 projectId 和 pageId，当 pageId 中包含连字符时，会错误地将分界点设置在最后一个连字符处。

**影响**:

- 任务数据存储在错误的项目目录中
- 任务状态管理混乱
- 无法正确获取项目相关的所有任务

## 建议的修复方案

修改 `_parseTaskId` 方法，使用第一个匹配的连字符模式来分隔 projectId 和 pageId，例如：

```javascript
// 对于 code 类型任务，查找第一个可能匹配的模式
// 假设 projectId 不会包含连字符，或者使用更明确的分隔符
const dashIndex = restPart.indexOf("-"); // 使用第一个连字符而不是最后一个
```

或者使用更明确的格式约定，例如使用下划线或其他字符作为 projectId 和 pageId 之间的分隔符。

## 测试总结

TaskManager 的核心功能（任务创建、状态管理、持久化）运行正常，但存在 ID 解析的严重缺陷，这会影响在 pageId 包含连字符时的正常使用。这个缺陷已在测试中被验证和记录。
