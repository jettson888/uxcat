// server/utils/task-manager.js
const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

class TaskManager {
  constructor() {
    this.tasks = new Map(); // 内存中的任务状态缓存
  }

  // 创建任务
  createTask(projectId, taskType = 'flow') {
    const task = {
      projectId,
      taskType,
      status: 'pending', // pending | processing | completed | failed | timeout
      createdAt: Date.now(),
      updatedAt: Date.now(),
      error: null,
      result: null
    };

    this.tasks.set(projectId, task);
    this._saveTaskToFile(projectId, task);
    return task;
  }

  // 更新任务状态
  updateTask(projectId, updates) {
    const task = this.tasks.get(projectId);
    if (!task) {
      throw new Error(`任务不存在: ${projectId}`);
    }

    Object.assign(task, updates, { updatedAt: Date.now() });
    this.tasks.set(projectId, task);
    this._saveTaskToFile(projectId, task);
    return task;
  }

  // 获取任务状态
  getTask(projectId) {
    // 优先从内存读取
    if (this.tasks.has(projectId)) {
      return this.tasks.get(projectId);
    }

    // 从文件读取
    return this._loadTaskFromFile(projectId);
  }

  // 标记任务为处理中
  startTask(projectId) {
    return this.updateTask(projectId, { status: 'processing' });
  }

  // 标记任务完成
  completeTask(projectId, result) {
    return this.updateTask(projectId, {
      status: 'completed',
      result
    });
  }

  // 标记任务失败
  failTask(projectId, error) {
    return this.updateTask(projectId, {
      status: 'failed',
      error: error.message || String(error)
    });
  }

  // 标记任务超时
  timeoutTask(projectId) {
    return this.updateTask(projectId, {
      status: 'timeout',
      error: '任务执行超时'
    });
  }

  // 保存任务到文件
  _saveTaskToFile(projectId, task) {
    try {
      const taskFile = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'task.json');
      fs.ensureDirSync(path.dirname(taskFile));
      fs.writeJsonSync(taskFile, task, { spaces: 2 });
    } catch (error) {
      console.error('保存任务文件失败:', error);
    }
  }

  // 从文件加载任务
  _loadTaskFromFile(projectId) {
    try {
      const taskFile = path.join(config.PROJECT_DIR, projectId, '1', 'data', 'task.json');
      if (fs.existsSync(taskFile)) {
        const task = fs.readJsonSync(taskFile);
        this.tasks.set(projectId, task); // 加载到内存
        return task;
      }
    } catch (error) {
      console.error('加载任务文件失败:', error);
    }
    return null;
  }

  // 清理过期任务（可选）
  cleanExpiredTasks(expireTime = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    for (const [projectId, task] of this.tasks.entries()) {
      if (now - task.updatedAt > expireTime) {
        this.tasks.delete(projectId);
      }
    }
  }
}

// 导出单例
const taskManager = new TaskManager();
module.exports = taskManager;