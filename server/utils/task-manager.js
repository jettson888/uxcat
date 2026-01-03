// server/utils/task-manager.js
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

/**
 * 任务管理器
 * 支持两种任务类型：
 * 1. flow 任务：每个项目一个任务，存储在 task-flow.json
 *    taskId 格式: generate-flow-{projectId}
 * 2. code 任务：每个页面一个任务，所有页面任务存储在 task-code.json（列表结构）
 *    taskId 格式: generate-code-{projectId}-{pageId}
 */
class TaskManager {
  constructor() {
    this.tasks = new Map(); // 内存中的任务状态缓存 taskId -> task
  }

  /**
   * 解析 taskId，提取项目ID、任务类型、页面ID
   * @param {string} taskId - 格式: "generate-flow-{projectId}" 或 "generate-code-{projectId}-{pageId}"
   * @returns {object} { projectId, taskType, pageId }
   */
  _parseTaskId(taskId) {
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

  /**
   * 获取任务文件路径
   * @param {string} projectId - 项目ID
   * @param {string} taskType - 任务类型 'flow' 或 'code'
   * @returns {string} 文件路径
   */
  _getTaskFilePath(projectId, taskType) {
    const dataDir = path.join(config.PROJECT_DIR, projectId, '1', 'data');

    if (taskType === 'flow') {
      return path.join(dataDir, 'task-flow.json');
    } else if (taskType === 'code') {
      return path.join(dataDir, 'task-code.json');
    } else {
      throw new Error(`未知的任务类型: ${taskType}`);
    }
  }

  /**
   * 创建任务
   * @param {string} taskId - 任务ID
   *   - flow 任务: generate-flow-{projectId}
   *   - code 任务: generate-code-{projectId}-{pageId}
   * @param {number} taskType - 任务类型常量（已弃用，自动从 taskId 解析）
   * @param {string} projectId - 项目ID（可选，会自动从 taskId 解析）
   */
  createTask(taskId, taskType = '', projectId = null) {
    const parsed = this._parseTaskId(taskId);
    const actualProjectId = projectId || parsed.projectId;
    const actualTaskType = taskType || parsed.taskType;

    if (!actualProjectId) {
      throw new Error(`创建任务失败：无法确定 projectId (taskId: ${taskId})`);
    }
    if (!actualTaskType) {
      throw new Error(`创建任务失败：无法确定 taskType (taskId: ${taskId})`)
    }

    const task = {
      taskId,
      taskType: actualTaskType,
      projectId: actualProjectId,
      pageId: parsed.pageId,
      status: 'pending', // pending | processing | completed | failed | timeout
      createdAt: Date.now(),
      updatedAt: Date.now(),
      error: null,
      result: null
    };

    this.tasks.set(taskId, task);
    this._saveTaskToFile(actualProjectId, task);
    return task;
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId, updates) {
    const task = this.tasks.get(taskId);
    if (!task) {
      // 尝试从文件加载
      const loadedTask = this._loadTaskFromFile(taskId);
      if (!loadedTask) {
        throw new Error(`任务不存在: ${taskId}`);
      }
    }

    const currentTask = this.tasks.get(taskId);
    Object.assign(currentTask, updates, { updatedAt: Date.now() });
    this.tasks.set(taskId, currentTask);
    this._saveTaskToFile(currentTask.projectId, currentTask);
    return currentTask;
  }

  /**
   * 获取任务状态
   */
  getTask(taskId) {
    // 优先从内存读取
    if (this.tasks.has(taskId)) {
      return this.tasks.get(taskId);
    }

    // 从文件读取
    return this._loadTaskFromFile(taskId);
  }

  /**
   * 获取项目下所有 code 任务
   * @param {string} projectId - 项目ID
   * @returns {Array} code 任务列表
   */
  getCodeTasks(projectId) {
    const taskFilePath = this._getTaskFilePath(projectId, 'code');

    try {
      if (fs.existsSync(taskFilePath)) {
        const tasks = fs.readJsonSync(taskFilePath);
        // 加载到内存
        tasks.forEach(task => {
          this.tasks.set(task.taskId, task);
        });
        return tasks;
      }
    } catch (error) {
      console.error('加载 code 任务列表失败:', error);
    }

    return [];
  }

  // 标记任务为处理中
  startTask(taskId) {
    return this.updateTask(taskId, { status: 'processing' });
  }

  // 标记任务完成
  completeTask(taskId, result) {
    return this.updateTask(taskId, {
      status: 'completed',
      result
    });
  }

  // 标记任务失败
  failTask(taskId, error) {
    return this.updateTask(taskId, {
      status: 'failed',
      error: error.message || String(error)
    });
  }

  // 标记任务超时
  timeoutTask(taskId) {
    return this.updateTask(taskId, {
      status: 'timeout',
      error: '任务执行超时'
    });
  }

  /**
   * 保存任务到文件
   * @param {string} projectId - 项目ID
   * @param {object} task - 任务对象
   */
  _saveTaskToFile(projectId, task) {
    try {
      const taskFilePath = this._getTaskFilePath(projectId, task.taskType);
      fs.ensureDirSync(path.dirname(taskFilePath));

      if (task.taskType === 'flow') {
        // flow 任务：直接覆盖写入
        fs.writeJsonSync(taskFilePath, task, { spaces: 2 });
      } else if (task.taskType === 'code') {
        // code 任务：读取现有列表，更新或添加当前任务
        let tasks = [];
        if (fs.existsSync(taskFilePath)) {
          tasks = fs.readJsonSync(taskFilePath);
        }

        // 查找并更新，或添加新任务
        const index = tasks.findIndex(t => t.taskId === task.taskId);
        if (index >= 0) {
          tasks[index] = task;
        } else {
          tasks.push(task);
        }

        fs.writeJsonSync(taskFilePath, tasks, { spaces: 2 });
      }
    } catch (error) {
      console.error('保存任务文件失败:', error);
    }
  }

  /**
   * 从文件加载任务
   * @param {string} taskId - 任务ID
   * @returns {object|null} 任务对象
   */
  _loadTaskFromFile(taskId) {
    try {
      const parsed = this._parseTaskId(taskId);

      if (parsed.taskType === 'flow') {
        // flow 任务：从 task-flow.json 读取
        const taskFilePath = this._getTaskFilePath(parsed.projectId, 'flow');
        if (fs.existsSync(taskFilePath)) {
          const task = fs.readJsonSync(taskFilePath);
          this.tasks.set(taskId, task);
          return task;
        }
      } else if (parsed.taskType === 'code') {
        const taskFilePath = this._getTaskFilePath(parsed.projectId, 'code');
        if (fs.existsSync(taskFilePath)) {
          const tasks = fs.readJsonSync(taskFilePath);
          const task = tasks.find(t => t.taskId === taskId);
          if (task) {
            this.tasks.set(taskId, task);
            return task;
          }
        }
      }
    } catch (error) {
      console.error('加载任务文件失败:', error);
    }
    return null;
  }

  /**
   * 清理过期任务（可选）
   */
  cleanExpiredTasks(expireTime = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [taskId, task] of this.tasks.entries()) {
      if (now - task.updatedAt > expireTime) {
        this.tasks.delete(taskId);
      }
    }
  }
}

// 导出单例
const taskManager = new TaskManager();
module.exports = taskManager;