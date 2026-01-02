import { defineCustomElement } from 'vue'

// 视图设计工具栏组件资源引入
import EditToolbar from "./EditToolbar/index.vue"
import EditToolbarStyle from "./EditToolbar/style"

const AiEditToolbar = defineCustomElement({
  ...EditToolbar,
  // 隔离样式注入
  styles: [
    EditToolbarStyle,
    `@import url('./element-plus@2.9.5.host.css');`
  ],
})

const autoInstall = () => {
  const customElementsArr = [
    {
      tagName: "ai-edit-toolbar",
      component: AiEditToolbar
    }
  ]
  customElementsArr.forEach(customElement => {
    // 注册检测 避免重复注册
    if (!customElements.get(customElement.tagName)) {
      // 添加自定义元素
      customElements.define(customElement.tagName, customElement.component);
    }
  })
}

autoInstall()
