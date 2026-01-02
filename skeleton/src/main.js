import {
  createApp
} from 'vue'
import App from './App.vue'
import router from './router'
import store from './stores'
import Icons from 'components/Icons'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import './assets/styles/reset.css'
import "@icon-park/vue-next/styles/index.css"
import CustomCollapse from './common/components/CustomCollapse.vue'
import CustomCollapseItem from './common/components/CustomCollapseItem.vue'

const app = createApp(App)

// 注册所有Element Plus图标组件
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 注册自定义折叠面板组件
app.component('CustomCollapse', CustomCollapse)
app.component('CustomCollapseItem', CustomCollapseItem)

app.use(ElementPlus, {
  locale: zhCn,
})
app.use(store)
app.use(router)
app.use(Icons)

app.mount('#app')
