/**
 * 并发控制工具
 * 控制任务的最大并发数，避免同时发起过多请求
 */
class ConcurrencyController {
  constructor(maxConcurrency = 3) {
    this.maxConcurrency = maxConcurrency;
    this.running = 0;
    this.queue = [];
  }

  /**
   * 执行任务（带并发控制）
   * @param {Function} task - 返回 Promise 的任务函数
   * @returns {Promise} 任务执行结果
   */
  async run(task) {
    // 如果当前并发数已满，等待
    while (this.running >= this.maxConcurrency) {
      await new Promise(resolve => this.queue.push(resolve));
    }

    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      // 唤醒队列中的下一个任务
      const resolve = this.queue.shift();
      if (resolve) resolve();
    }
  }

  /**
   * 批量执行任务
   * @param {Array<Function>} tasks - 任务函数数组
   * @returns {Promise<Array>} 所有任务的结果
   */
  async runAll(tasks) {
    return Promise.all(tasks.map(task => this.run(task)));
  }
}

module.exports = ConcurrencyController;
