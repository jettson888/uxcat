// server/utils/page-queue-manager.js
const { default: PQueue } = require('p-queue');

/**
 * 页面生成队列管理器
 * 功能：
 * 1. 管理并发执行的页面生成任务（最大并发数3）
 * 2. 支持取消正在运行的任务
 * 3. 同一个页面的新任务会取消旧任务
 */
class PageQueueManager {
  constructor(concurrency = 3) {
    this.queue = new PQueue({ concurrency });
    this.runningTasks = new Map(); // pageId -> { abortController, promise }
  }

  /**
   * 添加页面生成任务
   * @param {string} pageId - 页面ID
   * @param {Function} taskFn - 任务函数，接收 signal 参数
   * @returns {Promise} 任务执行结果
   */
  async addTask(pageId, taskFn) {
    // 如果该页面已有正在运行的任务，取消它
    if (this.runningTasks.has(pageId)) {
      console.log(`⚠️  页面 ${pageId} 已有任务在运行，取消旧任务`);
      this.cancelTask(pageId);
    }

    // 创建新的 AbortController
    const abortController = new AbortController();
    const signal = abortController.signal;

    // 创建任务
    const taskPromise = this.queue.add(async () => {
      try {
        console.log(`🚀 开始执行页面任务: ${pageId}`);
        const result = await taskFn(signal);
        console.log(`✅ 页面任务完成: ${pageId}`);
        return result;
      } catch (error) {
        if (error.name === 'AbortError' || signal.aborted) {
          console.log(`🛑 页面任务被取消: ${pageId}`);
          throw new Error(`任务被取消: ${pageId}`);
        }
        throw error;
      } finally {
        // 任务完成或失败后，从运行列表中移除
        this.runningTasks.delete(pageId);
      }
    });

    // 记录正在运行的任务
    this.runningTasks.set(pageId, { abortController, promise: taskPromise });

    return taskPromise;
  }

  /**
   * 取消指定页面的任务
   * @param {string} pageId - 页面ID
   */
  cancelTask(pageId) {
    const task = this.runningTasks.get(pageId);
    if (task) {
      console.log(`🛑 取消页面任务: ${pageId}`);
      task.abortController.abort();
      this.runningTasks.delete(pageId);
    }
  }

  /**
   * 批量添加任务
   * @param {Array<{pageId: string, taskFn: Function}>} tasks
   * @returns {Promise<Array>} 所有任务的结果
   */
  async addBatchTasks(tasks) {
    const promises = tasks.map(({ pageId, taskFn }) =>
      this.addTask(pageId, taskFn)
    );
    return Promise.allSettled(promises);
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      running: this.runningTasks.size,
      runningPageIds: Array.from(this.runningTasks.keys())
    };
  }

  /**
   * 清空队列（取消所有任务）
   */
  clear() {
    // 取消所有正在运行的任务
    for (const [pageId] of this.runningTasks) {
      this.cancelTask(pageId);
    }
    // 清空队列
    this.queue.clear();
  }
}

// 导出单例
const pageQueueManager = new PageQueueManager(3);
module.exports = pageQueueManager;
