/**
 * 组件渲染器 包含以下功能
 * 1. 组件渲染
 * 2. 状态更新
 * 3. 路由检测 -- 暂分离在Bussiness
 * 4. 虚拟dom回溯 -- 暂分离在Utils
 * 5. ui库加载
 */

/**
 * 渲染器基类
 */
class BaseRender {
  /**
   * 常规渲染组件
   * @param {Array} componentList 组件列表
   * @param {Element} mountDom 组件挂载节点
   * @param {Object}  properties 组件属性集
   * @param {Object}  template 生成模版
   */
  renderComponent (componentList, mountDom, properties, template) {

  }
  /**
   * 资源加载器
   * @param {String} domain 资源根地址
   */
  loadResource (domain) {

  }
  /**
   * Vue原型链拓展方法
   * 1.unmount方法(组件卸载)  保证vue2、Vue3、React能对齐
   * 2.setDataValue 状态更新
   * 3.getDataVlaue 状态获取
   * 4.getDataProps 获取状态集
   */
  extendPrototype (app) {

  }
  /**
   * 插槽交互组件创建
   * @param {String} componentName 组件
   * @param {Object} store 状态
   * @param {Element} eventElement 绑定事件节点
   */
  createVNode (componentName, store, eventElement) {

  }
}

/**
 * vue2 渲染器
 */
class Vue2Render extends BaseRender {
  isProd = "yes"
  constructor(domain, isProd) {
    super()
    this.isProd = isProd
    this.loadResource(domain)
  }
  async loadResource(domain) {
    // 加载vue2及对应ui库资源
    // await loadLib(`${domain}vendors/vue@2.7.14.min.js`, 'script')
    // await loadLib(`${domain}vendors/element-ui@2.15.13.min.js`, 'script')
    // await loadLib(`${domain}vendors/element-ui@2.15.13.min.css`, 'style')
    // await loadLib(`${domain}vendors/vant@2.13.9.js`, 'script')
    // await loadLib(`${domain}vendors/vant@2.13.9.css`, 'style')
    // await loadLib(`${domain}vendors/@hzbank-pc-vue2-ui.umd.js`, 'script')
    // await loadLib(`${domain}vendors/@hzbank-pc-vue2-ui.css`, 'style')
    this.extendPrototype()
  }
  extendPrototype () {
    Vue.prototype.unmount = function() {
      // 1. 触发组件销毁生命周期
      this.$destroy();
      
      // 2. 移除DOM节点
      if (this.$el && this.$el.parentNode) {
        this.$el.parentNode.removeChild(this.$el);
      }
      
      // 3. 清理引用
      this.$off(); // 移除所有事件监听
      this._watchers && this._watchers.forEach(watcher => watcher.teardown());
      this._data.__ob__ && this._data.__ob__.vmCount--;
    };

    Vue.prototype.setDataValue = function (key, value) {
      const keyArr = key.split(".")
      if(keyArr.length > 1) {
        const [k1, k2] = keyArr
        this.$set(this[k1], k2, value)
      } else {
        this[key] = value
      }
    }
    Vue.prototype.getDataValue = function (key) {
      const keyArr = key.split(".")
      if(keyArr.length > 1) {
        const [k1, k2] = keyArr
        return this[k1][k2]
      } else {
        return this[key]
      }
    }
    Vue.prototype.getDataProps = function () {
      let props = Utils.safeJsonParse(Utils.safeJsonStringify(this.$data))
      // 过滤无效key 避免外部零散处理
      delete props.domRef
      if(props.visible && props.visible.hasOwnProperty('sync')) {
        props["visible.sync"] = props.visible.sync
        delete props.visible
      }
      return props
    }
  }
  renderComponent (componentList, mountDom, properties, template, insertPos, insertPosition, componentId = null) {
    // 解析属性
    let dataObj = {}
    for (var i of properties) {
      // 兼容类似visible.sync处理
      const arr = i.attr.split(".")
      if(arr.length > 1) {
        const [k1, k2] = arr
        dataObj[k1] = {
          [k2]: i.value
        }
      } else {
        dataObj[i.attr] = i.value;
      }
    }
    // 源码容器组件特殊处理
    if(componentList[0] === "CodeBox") {
      const timestamp = new Date().getTime()
      const url = this.isProd === "yes" ? "/resources/canvas/sandbox/vue2/index.html" : "http://localhost:3000/index.html"
      window._Global.iframes.push("iframe" + timestamp)
      template = `<iframe component-mark-id="box" data-component-id="${componentId}" id="iframe${timestamp}" :width="width" :height="height" style="position: relative;z-index:10000;" :style="{backgroundColor:color}" src="${url}?id=iframe${timestamp}&isProd=${this.isProd}&pos=${insertPos}&insertPos=${insertPosition}" frameborder="0"></iframe>`
    }
    const App = Vue.extend({
      data: function () {
        return {
          domRef: null,
          ...dataObj
        }       
      },
      template
    })

    // tips: 同步挂载组件会直接清空挂载节点 故加一个挂载容器
    const replaceDom = document.createElement('div');
    mountDom.appendChild(replaceDom);

    // 挂载
    let vm = new App().$mount(replaceDom)
    if(!vm.$refs.domRef) {
      vm.dataDom = vm.$el
    } else {
      if(!vm.$refs.domRef.$el) {
        vm.dataDom = vm.$refs.domRef
      } else {
        vm.dataDom = vm.$refs.domRef.$el
      }
    }
    // 解析对应的lib
    if(componentList.length > 0) {
      vm.lib = componentList[0].startsWith('El') ? ELEMENT : vant
    }
    return vm
  }
  createVNode(componentName, store, eventElement) {
    const storeObj = new Vue({
      data() {
        return { ...store }
      }
    })
    const componentInstance = componentName.startsWith('El') ? ELEMENT[componentName] : vant[componentName]
    const ComponentConstructor = Vue.extend(componentInstance)

    const vnode = new ComponentConstructor({
      propsData: { ...storeObj }
    }).$createElement('div', [
      this.$createElement(
        'button',
        {
          style: {
            opacity: 0,
            width: '1px',
            height: '1px',
            position: 'absolute'
          },
          class: 'referenceBtnEvent',
          on: {
            click: () => {}
          }
        },
        '看不到我'
      )
    ]);
    new ComponentConstructor({
      propsData: { ...storeObj },
      render: h => h(vnode)
    }).$mount(eventElement);
    eventElement.addEventListener("click", function () {
      eventElement.querySelector(".referenceBtnEvent").click();
    });
  }
}

/**
 * vue3 渲染器  
 */
class Vue3Render extends BaseRender {
  isProd = "yes"
  constructor(domain, isProd) {
    super()
    this.isProd = isProd
    // this.loadResource(domain)
  }
  async loadResource(domain) {
    // 加载vue3及对应ui库资源
    await loadLib(`${domain}vendors/vue@v3.5.13.js`, 'script')
    await loadLib(`${domain}vendors/element-plus@2.9.5.js`, 'script')
    await loadLib(`${domain}vendors/element-plus@2.9.5.css`, 'style')
    await loadLib(`${domain}vendors/vant@4.9.19.js`, 'script')
    await loadLib(`${domain}vendors/vant@4.9.19.css`, 'style') 
    // element-plus需额外加载图标库
    await loadResource(`${domain}vendors/@element-plus-icons-vue@2.3.1.js`, 'script');
  }
  extendPrototype (app) {
    // 暂未找到更合适的api实现--目前基于_instance
    app.setDataValue = function (key, value) {
      const keyArr = key.split(".")
      if(keyArr.length > 1) {
        const [k1, k2] = keyArr
        app._instance.proxy[k1][k2] = value
      } else {
        app._instance.proxy[key] = value
      }
    }

    app.getDataValue = function (key) {
      const keyArr = key.split(".")
      if(keyArr.length > 1) {
        const [k1, k2] = keyArr
        return app._instance.proxy[k1][k2]
      } else {
        return app._instance.proxy[key]
      }
    }

    app.getDataProps = function () {
      const { toRaw } = Vue
      let props = {}
      for(let i in app._instance.proxy) {
        props[i] = toRaw(app._instance.proxy[i])
      }
      // 过滤无效key 避免外部零散处理
      delete props.domRef
      if(props.visible && props.visible.hasOwnProperty('sync')) {
        props["visible.sync"] = props.visible.sync
        delete props.visible
      }
      return props
    }
  }
  renderComponent (componentList, mountDom, properties, template) {
    const { createApp, ref } = Vue
    // 解析对应的lib
    const lib = componentList.length > 0 ? componentList[0].startsWith('El') ? ElementPlus : vant : null
    // 1.创建app
    const app = createApp({
      setup() {
        const domRef = ref(null)
        let props = {}
        for (let i of properties) {
          // 兼容类似visible.sync处理
          const arr = i.attr.split(".")
          if(arr.length > 1) {
            const [k1, k2] = arr
            props[k1] = ref({
              [k2]: i.value
            })
          } else {
            props[i.attr] = ref(i.value)
          }
        }
        return {
          domRef,
          ...props,
        }
      },
      template 
    })
    // 2.拓展原型链
    this.extendPrototype(app)
    // 3.注册要挂载的组件
    componentList.forEach(component => {
      app.use(lib[component])
    })
    /**
     * 判断是否存在icon组件
     * 若存在 则注册
     * 因每个渲染的组件为隔离的个体
     * 图标无法全局注册
     */
    const hasIcon = properties.some(
      (item) => item.attr.indexOf("IconSlotFor") > -1
    )
    const hasIconList = properties.some(
      (item) => item.attr.indexOf("icon") > -1
    )
    if(hasIcon || hasIconList) {
      for (const [iconKey, iconComponent] of Object.entries(
        ElementPlusIconsVue
      )) {
        app.component(iconKey, iconComponent);
      }
    }
    // 挂载
    app.mount(mountDom) 
    if (!app._instance.proxy.$refs.domRef.$el) {
      app.dataDom = app._instance.proxy.$refs.domRef
    } else {
      if(app._instance.proxy.$refs.domRef.$el.nodeType === 3) {
        app.dataDom = app._instance.proxy.$el.nextElementSibling
      } else {
        app.dataDom = app._instance.proxy.$refs.domRef.$el
      }
    }
    if(lib) {
      app.lib = lib
    }
    return app
  }
  createVNode(componentName, store, eventElement) {
    const { createVNode, ref, render } = Vue
    const data = ref(store).value
    const componentInstance = componentName.startsWith('El') ? ElementPlus[componentName] : vant[componentName]
    const VNode = createVNode(
      componentInstance,
      { ...data },
      {
        reference: () =>
          createVNode(
            "button",
            {
              style: {
                opacity: 0,
                width: "1px",
                height: "1px",
                position: "absolute",
              },
              class: "referenceBtnEvent",
              onClick: () => {},
            },
            "看不到我"
          ),
      }
    )
    render(VNode, eventElement)
    eventElement.addEventListener("click", function () {
      eventElement.querySelector(".referenceBtnEvent").click()
    })
  }
}

/**
 * 渲染器
 */
class Render {
  render = null
  constructor({
    domain,
    type,
    isProd
  }) {
    let RenderClass = null
    switch(type) {
      case "vue2":
        RenderClass = Vue2Render
        break
      case "vue3":
        RenderClass = Vue3Render
        break
      default: 
        break
    }
    this.render = new RenderClass(domain, isProd)
  }
  setRender(renderInstance) {
    this.render = renderInstance
  }
  getRender() {
    return this.render
  }
}

// 导出
window.Render = Render
window.UseRender = {
  render: null,
  instance: null
}

/**
 * 加载网络资源方法
 * @param {String} url 资源地址
 * @param {String} type 资源类型 script、style
 */
function loadLib(url, type) {
  return new Promise((resolve, reject) => {
    const element = type === 'script' 
      ? document.createElement('script') 
      : document.createElement('link');
    
    if (type === 'script') {
      element.src = url;
      element.onload = resolve;
    } else {
      element.rel = 'stylesheet';
      element.href = url;
      resolve(); // CSS无onload事件
    }
    
    element.onerror = reject;
    document.head.appendChild(element);
  });
}
