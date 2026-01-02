/**
 * 通用消息发送工具类
 * 用于向父页面发送消息
 */

class MessageUtils {
  /**
   * 检查是否在iframe环境中
   * @returns {boolean} 是否在iframe中
   */
  static isInIframe() {
    try {
      return window.parent && window.parent !== window;
    } catch (e) {
      return false;
    }
  }

  /**
   * 向父页面发送消息
   * @param {string} type 消息类型
   * @param {any} data 消息数据
   * @param {Object} options 可选配置
   * @param {string} options.targetOrigin 目标源，默认为'*'
   */
  static sendMessage(type, data, options = {}) {
    // 检查是否在iframe环境中
    if (!this.isInIframe()) {
      return;
    }

    const { targetOrigin = '*' } = options;

    try {
      const message = {
        type,
        data
      };

      // 向父页面发送消息
      window.parent.postMessage(message, targetOrigin);
    } catch (error) {
      console.error('发送消息到父页面失败:', error);
    }
  }

}

// 导出工具类
export default MessageUtils;

// 导出常用方法的快捷方式
export const sendMessage = MessageUtils.sendMessage.bind(MessageUtils);
