/**
 * 全局错误处理服务
 */
class ErrorHandler {
  constructor() {
    this.errorListeners = [];
    this.componentErrorTracker = new Map(); // 用于跟踪每个组件的错误状态
    this.init();
  }

  /**
   * 初始化错误处理
   */
  init() {
    // 监听全局JavaScript错误
    window.addEventListener('error', (event) => {
      console.log('error', event)
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        // stack: event.error?.stack
      });
    });

    // 监听未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      console.log('unhandledrejection', event)
      this.handleError({
        type: 'promise',
        message: event.reason?.message || event.reason,
        reason: event.reason,
        // stack: event.reason?.stack
      });
    });
  }

  /**
   * 检查组件是否已经发生过错误
   * @param {string} pageId 组件/页面ID
   * @returns {boolean} 是否已经发生过错误
   */
  hasComponentError(pageId) {
    if (!pageId) return false;
    return this.componentErrorTracker.has(pageId);
  }

  /**
   * 标记组件已发生错误
   * @param {string} pageId 组件/页面ID
   */
  markComponentError(pageId) {
    if (pageId) {
      this.componentErrorTracker.set(pageId, true);
    }
  }

  /**
   * 处理错误
   * @param {Object} errorInfo 错误信息
   */
  handleError(errorInfo) {
    // 检查是否需要去重处理（基于pageId）
    const pageId = errorInfo.pageId;
    
    // 如果有pageId且该组件已经发生过错误，则跳过
    if (pageId && this.hasComponentError(pageId)) {
      console.log(`组件 ${pageId} 已经发生过错误，跳过重复错误处理:`, errorInfo.message);
      return;
    }
    
    // 标记该组件已发生错误
    if (pageId) {
      this.markComponentError(pageId);
    }
    
    // console.error('页面渲染异常:', errorInfo);
    
    // 通知所有监听器
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (e) {
        console.error('错误监听器执行失败:', e);
      }
    });
  }

  /**
   * 添加错误监听器
   * @param {Function} listener 监听器函数
   */
  addErrorListener(listener) {
    if (typeof listener === 'function') {
      this.errorListeners.push(listener);
    }
  }

  /**
   * 清除组件错误跟踪（用于测试或重置）
   * @param {string} pageId 组件/页面ID，如果不提供则清除所有
   */
  clearComponentError(pageId) {
    if (pageId) {
      this.componentErrorTracker.delete(pageId);
    } else {
      this.componentErrorTracker.clear();
    }
  }
}

// 创建单例实例
const errorHandler = new ErrorHandler();

// 导出错误处理服务
export default errorHandler;

// 导出Vue错误处理配置
export const vueErrorHandler = {
  /**
   * Vue错误处理钩子
   */
  install(Vue) {
    // 全局Vue错误处理
    Vue.config.errorHandler = (err, vm, info) => {
      const componentName = vm?.$options.name || vm?.constructor?.name || '';
      const pageId = componentName.replace(/^./, match => match.toLowerCase());
      errorHandler.handleError({
        pageId: pageId,
        type: 'vue',
        message: err.message,
        error: err,
        // stack: err.stack,
        info: info,
        // vm: vm
      });
    };

    // 全局Vue警告处理
    Vue.config.warnHandler = (msg, vm, trace) => {
      const componentName = vm?.$options.name || vm?.constructor?.name;
      const pageId = componentName.replace(/^./, match => match.toLowerCase());
      errorHandler.handleError({
        pageId: pageId,
        type: 'vue-warning',
        message: msg,
        // trace: trace,
        // vm: vm
      });
    };
  }
};
