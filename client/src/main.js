import Vue from 'vue'
import App from './App.vue'
import router from './router'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import errorHandler, { vueErrorHandler } from '@/common/errorHandler.js';
import MessageUtils from '@/common/utils.js';
import './assets/styles/reset.css'
import './assets/iconfont/iconfont.css';

import HzbUI from '@hzbank/pc-vue2-ui';
import '@hzbank/pc-vue2-ui/dist/@hzbank-pc-vue2-ui.css';

// 安装Vue错误处理
Vue.use(vueErrorHandler)
Vue.use(HzbUI);

// 添加错误监听器
errorHandler.addErrorListener((errorInfo) => {
  try {
    console.log('捕获到错误:', errorInfo);
    
    // 使用公共方法将错误信息传给父页面
    MessageUtils.sendMessage('PAGE_ERROR', errorInfo);
  } catch (e) {
    console.error('保存错误日志失败:', e);
  }
});

Vue.use(ElementUI)

new Vue({
  el: '#app',
  router,
  render: h => h(App)
})
