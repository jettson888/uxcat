/**
 * 业务模块
 */
window.Business = {
  addCommonStyles: function () {
    var style = document.createElement("style");
    style.textContent = `
      #webpack-dev-server-client-overlay {
        display: none !important;
      }
      /* 基础标样式 */
      .has-canvas-comment {
        position: relative;
        outline: 2px dashed #FFA500;
      }

      /* 标记元素的hover效果 */
      .has-canvas-comment:hover {
        cursor: help;
      }

      /* 标记元素的小角标指示器 */
      .has-canvas-comment::after {
        content: "!";
        position: absolute;
        top: -8px;
        right: -8px;
        width: 16px;
        height: 16px;
        background-color: #FF5722;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        text-align: center;
        line-height: 16px;
        font-weight: bold;
      }
      .canvas-scroll-wrap-append-position, .canvas-hover-wrap-position, .canvas-select-wrap-position {
        position: relative;
      }
    `
    document.head.appendChild(style);
  },
  // 统一注册web component
  initConfig: function () {
    // 实例化视图设计输入框组件
    const editInputComponent = document.createElement("ai-edit-input");
    document.body.append(editInputComponent);
    _Global.editInput = editInputComponent

    // 实例化逻辑设计输入框组件
    const designInputComponent = document.createElement("ai-design-input");
    designInputComponent.setAttribute("visibility", "hidden")
    document.body.append(designInputComponent);
    _Global.designInput = designInputComponent
  },
  // 基于选中节点进行提问
  domDescToAi: function (msg = "", pathImages = []) {
    if(!msg) return;
    // 1.获取当前节点
    const dom = _Global.currSelectedDom
    // 2.判断是否有其他变更
    var domArr = _Global.configDomList;
    let prompt = ""
    let baseConfigPrompt = ""
    // 存在多选 单独适配提示词
    if(_Global.multiNodes.length > 0) {
      const hasIn = _Global.multiNodes.findIndex(item => item === dom)
      if(hasIn < 0) {
        _Global.multiNodes.unshift(dom)
      }
      _Global.multiNodes.forEach(item => {
        pathDesc = item.closest("[data-insp-path]")?.getAttribute("data-insp-path")
        const routerUrl = window.location?.href?.replace(window.location?.origin, "")
        const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
        prompt += `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}`
      })
      prompt += `\n基于以下描述进行修改,描述的详细内容为:\n${msg}`
    } else {
      if( domArr.length < 1 ) { // 不存在 直接生成
        const changePrompt = Business.renderInputPrompt(msg)
        prompt = changePrompt
      } 
      // 基础配置相关变更直接进行源码修改
      else { 
        baseConfigPrompt = Business.adapterSubmit("submit")
        prompt += Business.renderInputPrompt(msg)
      }
    }
    // 3.基于2中判断生成对应的提示词进行发问
    const questionMsg = {
      type: "report-prompt",
      data: {
        prompt,
        pathImages,
        baseConfigPrompt
      }
    };
    Message.sendMessage(questionMsg);
    // 隐藏工具栏输入框
    this.editInputCtrl("show", false)
  },
  // 保存链接、api配置
  saveLinkConfig: function (info = {}, actionType = "link") {
    const keyMap = {
      link: "data-link-config",
      api: "data-api-config",
    };
    const { type, path, method, url, contentType, data, responseData, comment } = info;
    const valueMap = {
      link: `${type}|${path}`,
      api: `${method}|${url}|${contentType}|${data}|${responseData}|${comment}`,
    };
    var element = _Global.currSelectedDom;
    var domArr = _Global.configDomList;
    var index = domArr.findIndex((item) => item.element === element);
    // 1.已存在的dom节点进行配置
    if (index > -1) {
      element.setAttribute(keyMap[actionType], valueMap[actionType]);
    } else {
      try{
      // 2.对添加的组件进行配置
      if (
        element.parentElement.getAttribute("data-parent") === "component-wrap"
      ) {
        index = domArr.findIndex(
          (item) => item.element === element.parentElement.children[0]
        );
        element = element.parentElement.children[0];
        element.setAttribute(keyMap[actionType], valueMap[actionType]);
      }
      // 3.对dom进行首次配置
      else {
        element.setAttribute(keyMap[actionType], valueMap[actionType]);
        domArr.push({
          type: "addAttr",
          element,
          styles: {},
        });
      }
      } catch(err) {
        console.log(err)
      }
    }
    if(window._Global.currentDesignDom && window._Global.currentMode === "design") {
      // 生成修改标记
      window._Global.currentDesignDom.classList.add("has-canvas-comment");
      // 工具栏隐藏
      window._Global.currentDesignDom?.classList?.remove("dragging");
      // 暂保留 后续需清理
      this.editInputCtrl("show", false)
    }
  },
  // AI辅助
  aiHelp: function (type = "default", action = "default", optionValue = "", silentType = "default") {
    var element = _Global.currSelectedDom
    var prompt = "以新任务执行"
    if ( element ) {
      try{
      // 1.先判断点击的是组件还是dom节点
      if (
        element.parentElement.getAttribute("data-parent") === "component-wrap"
      ) {
        // 组件需取出组件配置信息
        const index = _Global.configDomList.findIndex((item) => item.element === element.parentElement.children[0])
        if(index < 0) return
        prompt += Business.renderAddPrompt([_Global.configDomList[index]])
        if(action !== "silent") {
          // 排除自身
          _Global.configDomList.splice(index, 1);
        }
      } else {
        const index = _Global.configDomList.findIndex((item) => item.element === element)
        if ( index > -1 ) {
          prompt += Business.renderChangePrompt([_Global.configDomList[index]])
          if(action !== "silent") {
            // 排除自身
            _Global.configDomList.splice(index, 1);
          }  
        } else {
          prompt += Business.renderChangePrompt([{
            type: "addAttr",
            element,
            styles: {}
          }])
        } 
      }
      } catch(err) {
        console.log(err)
      }
      if( type === "createPage" ) {
        prompt += "围绕以上内容为主题,请从一名资深产品经理的角度完善一个新增页面的设计,并以资深前端开发工程师角色将对应设计转化为符合项目工程的页面,将此页面添加到路由配置中,用户点击主题内容元素时需跳转的新增页面上,跳转方式采用路由跳转."
      } 
      // ai推断
      else if(type === "aiOption") {
        prompt += `用户希望对以上内容做出以下变更:${optionValue}`
      }
      // 获取绑定数据及可用事件
      else if (silentType === "getDataEvent") {
         prompt += `针对以上涉及的组件或元素做以下处理:
         1、获取该组件或元素可以绑定的事件;
         2、获取该组件或元素已经绑定的变量名;
         3、执行结果需严格按照"执行findDataEvent的返回结果为:?data=value1&value2||event=点击事件|click&聚焦事件|focus"的形式返回,其中data后面为数据变量集合,event后面为事件集合,不得包含总结性、备注或说明.`
      }
      else {
        prompt += `用户点击了以上内容,请从一名资深产品经理的角度分析用户进行此操作的意图有哪些,
推测行为参考【可能的推测行为】,并以渐进式询问引导的方式帮助用户完善其接下来需要进行的操作.
# 可能的推测行为：
echarts/图 => 画echarts图
<a> => 生成相关页面绑定页面跳转/页面跳转
<button type="submit"> => 提交表单
<button> => 打开模态框/抽屉
展开 => 展开显示折叠内容
提交/查询/下载/导出/删除 => 调用接口
查看更多  => 跳转页面获取额外信息
新增/新建/详情/汇报/编辑 => 打开模态框`
      }
      // const endPrompt = Business.renderPrompt("render")
      // prompt += endPrompt
    }
    const msg = {
      type: "report-prompt",
      data: {
        prompt,
        action
      },
    };
    Message.sendMessage(msg);
  },
  hijackRouterAdapter: function (mode) {
    if(mode === "preview") {
      if(_Global.globalRouter) {
        _Global.globalRouter()
        _Global.globalRouter = null
      }
    } else {
      this.hijackRouter()
    }
  },
  // 获取原始router实例（需在Vue挂载后执行
  hijackRouter: function () {
    try {
      if(_Global?.vueMajor === "vue2") {
        // vue2实例获取
        const app = document.querySelector("#app").__vue__;
        if (!app || !app.$router) {
          // this.renderRouteList([], "");
          // console.warn('未找到Vue Router实例');
          return;
        }
        const router = app.$router;
        // const routes = router.options.routes;
        // const currentRouteValue = router.currentRoute.path;
        // this.renderRouteList(routes, currentRouteValue);
        // 2. 注入新守卫
        _Global.globalRouter = router.beforeEach((to, from) => {
          return false;
        });
      } else {
        // 1. 获取Vue3实例（通过全局变量或DOM属性）
        const app = document.querySelector("#app")?._vnode?.component.proxy;
        if (!app?.$router) {
          // this.renderRouteList([], "");
          // console.warn('未找到Vue Router实例')
          return;
        }
        const router = app.$router;
        // const routes = router.getRoutes();
        // const currentRouteValue = router.currentRoute.value.path;
        // this.renderRouteList(routes, currentRouteValue);
        // 2. 注入新守卫
        _Global.globalRouter = router.beforeEach((to, from) => {
          return false;
        });
      }
    } catch {
    }
  },
  // 注入选中高亮样式
  addDragStyles: function (mode = "preview") {
    var style = document.createElement("style");
    const id = "append-styles"
    style.id = id
    // var bodyStyle =
    //   _Global.platform === "pc"
    //     ? `body {
    //   min-width: 1024px !important;
    // }`
    //     : `body {
    //   min-width: 824px !important;
    // }`;
    style.textContent = `
        .ai-action-group {
          position: static !important
        }
        .center-v{
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .center-h{
          display: flex;
          flex-direction: row;
          justify-content: center;
        }
        .center-vh{
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
    `;
    if(mode === "preview") {
      document.getElementById(id)?.remove();
    } else {
      document.head.appendChild(style);
    }
  },
  // 初始化删除按钮
  // initDeleteBtn:function(){
  //   const deleteButton = document.createElement('div');
  //   deleteButton.id = 'delete-button';
  //   deleteButton.addEventListener('click', function() {
  //       Business.deleteAdapter();
  //       deleteButton.style.display="none";
  //   });
  //   document.body.appendChild(deleteButton);
  // },
  // 获取dom节点的交互组件列表
  getDomActionComponentsList: function (ele = null) {
    var list = [];
    _Global.configDomList.forEach((item) => {
      if (item.eventElement && item.eventElement === ele) {
        list.push({ ...item.component });
      }
    });
    return list;
  },
  // 点击dom节点获取属性
  // getAttrsWithClick: function () {
  //   // debugger
  //   document.body.addEventListener("click", getAttrs);
  //   // 针对阻止事件冒泡做处理 ep抽屉组件
  //   const observer = new MutationObserver((mutations) => {
  //     const drawers = document.querySelectorAll('.el-drawer') || []
  //      console.log("drawers: ",drawers)
  //     const messageBoxes = document.querySelectorAll('.el-message-box') || []
  //     const allDom = [...Array.from(drawers),...Array.from(messageBoxes)]
  //     console.log("allDom: ",allDom)
  //     if (allDom && allDom.length > 0) {
  //       allDom.forEach(itemDom => {
  //         console.log("=====",itemDom)
  //         itemDom.addEventListener("click", getAttrs);
  //         //observer.disconnect(); // 找到目标后停止观察
  //       })
  //     }
  //   });
  //   observer.observe(document.body, {
  //     childList: true,
  //     subtree: true,
  //   });
  //   function getAttrs(e) {
  //     if (e.target.nodeName === "AI-ACTION-GROUP" || e.target.nodeType !==1) return;
  //     var element = e.target;
  //     // icon特殊处理  默认为选中dragging类的元素
  //     if(e.target.tagName === "svg" || e.target.tagName === "path") {
  //       element = e.target.closest(".dragging")
  //     }
  //     // 无效点击屏蔽
  //     if (!element?.classList?.contains("dragging")) return;
  //     if (element?.classList?.contains("van-overlay")) return;
  //     if (element?.classList?.contains("el-overlay")) return;
  //     if (element?.classList?.contains("ep-overlay")) return;
  //     var isReplaceComponent = false;
  //     if (
  //       element.parentElement &&
  //       element.parentElement.getAttribute("data-parent") &&
  //       element.parentElement.getAttribute("data-parent") === "component-wrap"
  //     ) {
  //       element = e.target.parentElement.children[0];
  //     }
  //     e.stopPropagation();
  //     e.preventDefault();
  //     // 提取所有属性
  //     var attributes = element.attributes;
  //     var attributesObj = {};
  //     for (var i = 0; i < attributes.length; i++) {
  //       var attr = attributes[i];
  //       attributesObj[attr.name] = attr.value;
  //     }
  //     // 获取该元素的计算样式
  //     var computedStyles = window.getComputedStyle(element);
  //     // 创建一个对象来存储样式属性
  //     var stylesObj = {};
  //     // 遍历计算样式，获取所有的属性
  //     for (var i = 0; i < computedStyles.length; i++) {
  //       var styleName = computedStyles[i];
  //       stylesObj[styleName] = computedStyles.getPropertyValue(styleName);
  //     }
  //     var currCptIdx = -1;
  //     var desc = null;
  //     var props = null;
  //     // 判断当前选中是否新增组件 是 => 取出属性值
  //     if (_Global.configDomList.length > 0) {
  //       var index = _Global.configDomList.findIndex(
  //         (item) => item.element === element
  //       );
  //       var store =
  //         _Global.configDomList[index] && _Global.configDomList[index].store;
  //       if (index > -1 && store) {
  //         // 响应式组件
  //         if (store.getDataProps) {
  //           props = store.getDataProps()
  //         }
  //         currCptIdx = _Global.configDomList[index].componentId;
  //       }
  //       if (index > -1) {
  //         desc = _Global.configDomList[index].desc;
  //       }
  //     }
  //     // 如不为新增组件 继续判断
  //     if (currCptIdx < 0 && _Global.replaceDomList.length > 0) {
  //       var index = _Global.replaceDomList.findIndex((item) => {
  //         const itemEle = item.store.dataDom
  //         return itemEle === element;
  //       });
  //       if (index > -1) {
  //         isReplaceComponent = true;
  //         currCptIdx = _Global.replaceDomList[index].component.componentId;
  //       }
  //     }
  //     var msg = {
  //       data: {
  //         styles: stylesObj,
  //         attrs: attributesObj,
  //         innerText: Utils.isOnlyTextNode(element)
  //           ? element.innerText.trim()
  //           : "",
  //         isOnlyTextNode: Utils.isOnlyTextNode(element),
  //         currCptIdx: currCptIdx,
  //         props: props,
  //         desc: desc,
  //         actionComponentsList: Business.getDomActionComponentsList(e.target),
  //         isReplaceComponent: isReplaceComponent,
  //         tagName: element ? element.tagName : ""
  //       },
  //       type: "report-attrs", // 回显属性
  //     };
  //     Message.sendMessage(msg);
  //   }
  // },
  getAttrs: function (e) {
    if (e.target.nodeName === "AI-ACTION-GROUP" || e.target.nodeType !==1) return;
    _Global.backupConfigDomList = []
    _Global.backupDom = null
    var element = e.target;
    // icon特殊处理  默认为选中dragging类的元素
    if(e.target.tagName === "svg" || e.target.tagName === "path") {
      element = e.target.closest(".dragging")
    }
    // 无效点击屏蔽
    if (!element?.classList?.contains("dragging")) return;
    if (element?.classList?.contains("van-overlay")) return;
    if (element?.classList?.contains("el-overlay")) return;
    if (element?.classList?.contains("ep-overlay")) return;
    var isReplaceComponent = false;
    if (
      element.parentElement &&
      element.parentElement.getAttribute("data-parent") &&
      element.parentElement.getAttribute("data-parent") === "component-wrap"
    ) {
      element = e.target.parentElement.children[0];
    }
    e.stopPropagation();
    e.preventDefault();
    // 提取所有属性
    var attributes = element.attributes;
    var attributesObj = {};
    for (var i = 0; i < attributes.length; i++) {
      var attr = attributes[i];
      attributesObj[attr.name] = attr.value;
    }
    // 获取该元素的计算样式
    var computedStyles = window.getComputedStyle(element);
    // 创建一个对象来存储样式属性
    var stylesObj = {};
    // 遍历计算样式，获取所有的属性
    for (var i = 0; i < computedStyles.length; i++) {
      var styleName = computedStyles[i];
      stylesObj[styleName] = computedStyles.getPropertyValue(styleName);
    }
    var currCptIdx = -1;
    var desc = null;
    var props = null;
    // 判断当前选中是否新增组件 是 => 取出属性值
    if (_Global.configDomList.length > 0) {
      var index = _Global.configDomList.findIndex(
        (item) => item.element === element
      );
      var store =
        _Global.configDomList[index] && _Global.configDomList[index].store;
      if (index > -1 && store) {
        // 响应式组件
        if (store.getDataProps) {
          props = store.getDataProps()
        }
        currCptIdx = _Global.configDomList[index].componentId;
      }
      if (index > -1) {
        desc = _Global.configDomList[index].desc;
      }
    }
    // 如不为新增组件 继续判断
    if (currCptIdx < 0 && _Global.replaceDomList.length > 0) {
      var index = _Global.replaceDomList.findIndex((item) => {
        const itemEle = item.store.dataDom
        return itemEle === element;
      });
      if (index > -1) {
        isReplaceComponent = true;
        currCptIdx = _Global.replaceDomList[index].component.componentId;
      }
    }
    var msg = {
      data: {
        styles: stylesObj,
        attrs: attributesObj,
        innerText: Utils.isOnlyTextNode(element)
          ? element.innerText.trim()
          : "",
        isOnlyTextNode: Utils.isOnlyTextNode(element),
        currCptIdx: currCptIdx,
        props: props,
        desc: desc,
        actionComponentsList: Business.getDomActionComponentsList(e.target),
        isReplaceComponent: isReplaceComponent,
        tagName: element ? element.tagName : ""
      },
      type: "report-attrs", // 回显属性
    };
    // 选中dom元素时进行备份
    if(Number(currCptIdx) < 100000) {
      _Global.configDomList.forEach(item => {
        // 解除关联关系
        let newItem = {
          ...item
        }
        newItem.styles = Utils.safeJsonParse(Utils.safeJsonStringify(item.styles))
        _Global.backupConfigDomList.push(newItem)
      })
      _Global.backupDom = element.cloneNode(true)
      _Global.backupMsg = msg
    }
    Message.sendMessage(msg);
  },
  // dom节点备份还原
  resetDom: function () {
    const currSelectedDom = _Global.currSelectedDom
    const backupDom = _Global.backupDom
    const index =  _Global.backupConfigDomList.findIndex(
      (item) => item.element === currSelectedDom
    );
    if(backupDom && currSelectedDom) {
      currSelectedDom.parentNode.replaceChild(backupDom, currSelectedDom)
      if(index > -1) {
        _Global.backupConfigDomList[index].element = backupDom
      }
      // 此处不能使用直接赋值 需遍历赋值
      _Global.configDomList = []
      _Global.backupConfigDomList.forEach(item => {
        _Global.configDomList.push(item)
      })
      backupDom.dispatchEvent(new MouseEvent('mousedown', {detail: 1000}))
      backupDom.dispatchEvent(new MouseEvent('mouseup'))
      backupDom.dispatchEvent(new MouseEvent('click'))
      const msg = {
        type: "action-right",
        data: {
          action: "open"
        }
      };
      Message && Message.sendMessage(msg);
    }
  },
  // 开启拖拽
  enableUniversalDrag: function () {
    // 记录拖拽初始状态
    let isDragging = false;
    let dragElement = null;
    let initialX = 0;
    let initialY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    const that = this;
    // 判断元素是否可拖拽（可自定义排除条件）
    function isElementDraggable(element) {
      // 默认所有元素可拖拽，除了以下情况：
      // 1. 元素是body
      // 2. 元素或其祖先设置了data-no-drag属性
      if (element === document.body) return false;
      if (element.closest("[data-no-drag]")) return false;

      return true;
    }
    const throttledAiHelp = Utils.throttle(Business.aiHelp, 500);
    // 鼠标按下事件处理
    function handleMouseDown(e) {
      if (Utils.isDisabledElement(e.target)) return;
      // 如果存在缓存组件 进行确认操作
      if (_Global.componentSaveTemp && _Global.componentSaveTemp.component) {
        Message.sendMessage({
          type: "confirm-component",
        });
      }
      // 删除按钮
      const deleteBtn = document.getElementById("delete-button");
      let target = e.target;
      if (target === deleteBtn) return;
      // clone节点
      _Global.whenClickDOM = e.target.cloneNode(true);
      // // 鼠标点击时，清空移动的框
      // let highlightOverlayDoms =
      //   document.getElementsByClassName("highlight-overlay");
      // for (let i = 0; i < highlightOverlayDoms.length; i++) {
      //   highlightOverlayDoms[i].classList.remove("highlight-overlay");
      // }
      // 如果用户没有按住了shfit按钮，则清楚掉目前的粉红色框
      // if (!_Global.shiftOn) {
      //   for (let i = 0; i < _Global.whenShfitOnDom.length; i++) {
      //     _Global.whenShfitOnDom[i].classList.remove("dragging");
      //   }
      //   // 置空多选
      //   _Global.whenShfitOnDom = [];
      // } else {
      //   _Global.whenShfitOnDom.push(e.target);
      // }
      // 只响应左键点击
      if (e.button !== 0 || target === deleteBtn) return;
      // 适配对应模式下的输入框
      that.adapterModeInput(target)
      while (target && target !== document.body) {
        // if (_Global.currSelectedDom && !window._Global.shiftOn) {
        //   _Global.currSelectedDom.classList.remove("dragging");
        // }
        _Global.currSelectedDom = target;
        if (Utils.isPathElement(target)) {
          _Global.currSelectedDom = target.parentNode.parentNode;
          target = target.parentNode.parentNode;
        } else if (Utils.isSVGElement(target)) {
          _Global.currSelectedDom = target.parentNode;
          target = target.parentNode;
        }
        // 关闭右侧属性基础配置
        Message.sendMessage({
          type: "action-right",
          data: {
            action: "close"
          }
        });
        // 设计模式下调用绑定事件、数据定义推断 且只在显示设计输入框时
        if(e.detail !== 1000 && _Global.currentMode === "design" && _Global.designInput.getAttribute("visibility") === "visible") {
          // 调用ai推断
          throttledAiHelp("default", "silent", "", "getDataEvent")
        }
        _Global.elementIsMove = false;
        Business.markSelectLine(target)
        // target.classList.add("dragging");
        Business.getAttrs(e)
        // target.style.border = '1px dashed #f56c6c';
        // target.style.outlineOffset = "2px"
        // outline-offset: 2px;
        if (isElementDraggable(target)) {
          // 设置拖拽初始状态
          isDragging = true;
          dragElement = target;
          if (
            target.parentElement &&
            target.parentElement.getAttribute("data-parent") ===
              "component-wrap"
          ) {
            dragElement = target.parentElement;
            target = target.parentElement;
          }
          initialX = e.clientX;
          initialY = e.clientY;
          initialLeft = parseInt(target.style.left || "0", 10);
          initialTop = parseInt(target.style.top || "0", 10);
          // 阻止事件冒泡，避免多个元素同时被拖拽
          e.stopPropagation();
          e.preventDefault();
          // 记录元素位置信息
          if(dragElement) {
            if(!dragElement?.getAttribute("data-native-pos")) {
              const [nativePos] = Utils.styleToJson(dragElement.getAttribute("style"))
              dragElement.setAttribute("data-native-pos", nativePos)
            }
          }
          break;
        }
        target = target.parentElement;
      }
    }

    // 鼠标移动事件处理
    function handleMouseMove(e) {
      if (Utils.isDisabledElement(e.target) || !dragElement || !isDragging) {
        isDragging = false
        dragElement = null
        return;
      }
      if (!_Global.elementIsMove) {
        _Global.elementIsMove = true;
      }
      // 计算移动距离
      const deltaX = e.clientX - initialX;
      const deltaY = e.clientY - initialY;
      // 如果偏移量小于3px 则不进行拖拽
      if(Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return
      // 只有视图设计模式支持拖拽
      if(window._Global.currentMode === "edit") {
        // 只有有偏移量且原本是 static 时才设置 relative
        let computedPosition = window.getComputedStyle(dragElement).position;
        if (
          computedPosition === "static" &&
          (deltaX !== 0 || deltaY !== 0)
        ) {
          // 更新元素位置
          dragElement.style.position = "relative";
        }
        if((deltaX !== 0 || deltaY !== 0)) {
          dragElement.style.left = `${initialLeft + deltaX}px`;
          dragElement.style.top = `${initialTop + deltaY}px`;
        }
      }
      // 清除工具栏
      Business.clearSelectLine()
      e.preventDefault();
    }
    // 鼠标释放事件处理
    function handleMouseUp(e) {
      if(Utils.isDisabledElement(e.target)) return 
      // e.target.style.border = '';
      if (isDragging && dragElement) {
        // 移除拖拽样式类
        // 节点名称
        let nodeName = dragElement.nodeName.toLowerCase();
        // 节点文案
        let innerText = dragElement.innerText;
        // 节点样式
        let className = dragElement.className;
        // 节点style
        let dragStyle = dragElement.getAttribute("style");
        // 是否有拖拽标识
        // var isDraged = dragStyle.split(";")333
        let dragText = "";
        let leftValue = 0;
        let topValue = 0;
        if (_Global.elementIsMove && dragStyle && dragStyle.length > 0) {
          _Global.elementIsMove = false;
          let dragStyleArr = [];
          dragStyleArr = dragStyle.split(";");
          for (let i = 0; i < dragStyleArr.length; i++) {
            if (dragStyleArr[i].indexOf("left") > 0) {
              leftValue = dragStyleArr[i].split(":")[1].replace("px", "");
              if (leftValue > 0) {
                dragText += `left属性值:${leftValue}px;`;
              } else if (leftValue < 0) {
                dragText += `left属性值:${leftValue}px;`;
              }
            }
            if (dragStyleArr[i].indexOf("top") > 0) {
              topValue = dragStyleArr[i].split(":")[1].replace("px", "");
              if (topValue < 0) {
                dragText += `top属性值:${topValue}px;`;
              } else if (topValue > 0) {
                dragText += `top属性值:${topValue}px;`;
              }
            }
          }
          // 判断当前数组中是否存在
          var index = _Global.configDomList.findIndex(
            (item) => item.element === dragElement
          );
          // 若为组件容器 则指向组件
          if (dragElement.getAttribute("data-parent") === "component-wrap") {
            index = _Global.configDomList.findIndex(
              (item) => item.element === dragElement.children[0]
            );
          }
          // 存在  则进行修改
          if (index !== -1) {
            _Global.configDomList[index].styles.top = topValue + "px";
            _Global.configDomList[index].styles.left = leftValue + "px";
            _Global.configDomList[index].styles.position = "relative";
          } else {
            // 大于2px的偏移才计算 否则一律归为误操作
            if(Math.abs(topValue) > 2 && Math.abs(leftValue) > 2) {
              _Global.configDomList.push({
                type: "drag",
                element: dragElement,
                styles: {
                  top: topValue + "px",
                  left: leftValue + "px",
                  position: "relative",
                },
              });
            }
          }
          const saveElement = dragElement
          // 适当延时 避免拖拽偏移
          setTimeout(() => {
            that.markSelectLine(saveElement)
          }, 200)
        }
      }

      // 重置拖拽状态
      isDragging = false;
      dragElement = null;
    }
    function handleMouseMout(e) {
      if (Utils.isDisabledElement(e.target)) return;
      Business.clearHighlight()
      // e.target.classList.remove("highlight-overlay");
      // const elements = document.querySelectorAll('[class^="canvas-tag-tooltip-"]');
      // if(elements.length > 0) {
      //   elements.forEach(item => {
      //     item?.remove()
      //   })
      // }
    }

    function handleMouseOver(e) {
      if (Utils.isDisabledElement(e.target)) return;
      // 拖拽过程中不需高亮
      if(isDragging) return
      Business.hoverWithHighlight(e.target)
      // let highlightOverlayDoms =
      //   document.getElementsByClassName("highlight-overlay");
      // for (let i = 0; i < highlightOverlayDoms.length; i++) {
      //   highlightOverlayDoms[i].classList.remove("highlight-overlay");
      // }
      // if (e.target.classList && !e.target.classList.contains("dragging")) {
      //   if(!e.target.querySelector("ai-action-group")) {
      //     e.target.classList.add("highlight-overlay");
      //     Business.addTooltip(e.target)
      //   }
      // }
    }

    function quickOpenCode (e) {
      // 只有视图设计下才允许双击打开代码
      if(_Global.currentMode !== "edit") return
      // 找出最近的标记节点
      const nearlyEle = e.target.closest("[data-insp-path]");
      // 获取代码路径
      const info = nearlyEle?.getAttribute("data-insp-path");
      if(!info) return
      // 打开编辑器
      const [path, line, column] = info.split(":");
      Message && Message.sendMessage({
        type: "open-code",
        data: {
          path: `${path}:${line}:${column}`
        }
      })
      // const file = encodeURIComponent(path);
      // const xhr = new XMLHttpRequest();
      // xhr.open(
      //   "GET",
      //   `http://localhost:5678/?file=${file}&line=${line}&column=${column}`,
      //   true
      // );
      // xhr.send();
      // xhr.addEventListener("error", () => {
      //   const url = `http://localhost:5678/?file=${file}&line=${line}&column=${column}`;
      //   const img = document.createElement("img");
      //   img.src = url;
      // });
    } 
    // const throttledMouseEnter = Utils.throttle(handleMouseEnter, 100);
    // 添加事件监听器（使用捕获阶段确保能捕获到所有事件）
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseMout, true);
    document.addEventListener("dblclick", quickOpenCode, true);
    // 返回一个禁用拖拽的函数
    return function disableUniversalDrag() {
      document.removeEventListener("mousedown", handleMouseDown, true);
      document.removeEventListener("mousemove", handleMouseMove, true);
      document.removeEventListener("mouseup", handleMouseUp, true);
      document.removeEventListener("mouseout", handleMouseMout, true);
      document.removeEventListener("mouseover", handleMouseOver, true);
      document.removeEventListener("dblclick", quickOpenCode, true);
    };
  },
  // 添加选中标识
  markSelectLine: function (target) {
    document.querySelector(".dragging")?.classList.remove("dragging")
    target?.classList.add("dragging")
    // 清除定位类及标记节点
    Business.clearSelectLine()
    // 清除高亮标记
    Business.clearHighlight()
    const { offsetWidth, offsetHeight } = target
    // 针对table的表头特殊处理
    const scrollableParent = target.closest(".el-table__header") && target.closest(".el-table__header-wrapper") ? target.closest(".el-table__header-wrapper") : Utils.findNearestScrollContainerIncludingSelf(target) || document.body
    const {top, left} = Utils.getOffsetInParent(target, scrollableParent)
    const selectLineDom = document.createElement("ai-edit-toolbar")
    _Global.editToolbar = selectLineDom
    const timestamp = Date.now()
    if(!selectLineDom?.getAttribute("data-mark-id")) {
      selectLineDom.setAttribute("data-mark-id", `canvas-select-mark-id-${timestamp}`)
    }
    target.setAttribute("data-mark", timestamp)
    const isTopHidden = top < 20
    const isBottomHidden = (top + offsetHeight + 20) > scrollableParent.offsetHeight
    const isLeftHidden = left < 114
    const isRightHidden = (left + offsetWidth + 114) > scrollableParent.offsetWidth
    let tooltipDirection = "top"
    // 使用降级策略 上、下、左、右、内
    if(isTopHidden) {
      if(isBottomHidden) {
        if(isLeftHidden) {
          if(isRightHidden) {
            tooltipDirection = "inside"
          } else {
            tooltipDirection = "right"
          }
        } else {
          tooltipDirection = "left"
        }
      } else {
        tooltipDirection = "bottom"
      }
    }
    const styleObj = {
      lineWidth: `${offsetWidth}px`,
      lineHeight: `${offsetHeight}px`,
      top: `${top}px`,
      left: `${left}px`,
      toolMode: _Global.currentMode,
      tooltipDirection
    }
    const isMultiSelect = _Global?.multiNodes?.length > 0 ? "enable" : "disable"
    selectLineDom.setAttribute("tool-config", Utils.safeJsonStringify(styleObj))
    selectLineDom.setAttribute("is-multi-select", isMultiSelect)
    scrollableParent.prepend(selectLineDom)
    const scrollableParentPosition = window.getComputedStyle(scrollableParent).position
    // 未设置定位时使用relative 
    if (scrollableParentPosition === "static") {
      scrollableParent.classList.add("canvas-select-wrap-position")
    }
  },
  clearSelectLine: function () {
    const allNodes = document.querySelectorAll('[data-mark-id^="canvas-select-mark-id-"]')
    if(allNodes.length > 0) {
      Array.from(allNodes).forEach(itemNode => {
        itemNode?.parentElement?.classList?.remove("canvas-select-wrap-position")
        itemNode?.remove()
      })
    }
    _Global.editToolbar = null
    // console.log("匹配的所有节点", allNodes)
    // // const preSelectLineDom = document.getElementById("canvas-select-mark-id")
    // if(preSelectLineDom) {
    //   preSelectLineDom?.parentElement?.classList?.remove("canvas-select-wrap-position")
    //   preSelectLineDom?.remove()
    // }
  },
  cancelMultiSelect: function (index) {
    // 更新多选记录数组
    _Global.multiNodes?.splice(index, 1)
    // 更新工具栏组件显示标签
    const newArr = _Global.multiNodes.map(ele => {
      return {
        tagName: ele.tagName,
        className: ele.className.replace("dragging", "")
      }
    }) || []
    if( _Global.multiNodes?.length < 1) {
      Message.sendMessage({
        type: "toggle-multi-select",
        data: {
          value: false
        }
      });
      _Global?.editToolbar?.setAttribute("is-multi-select", "disable")
    }
    this.editInputCtrl("selectNodes", newArr)
  },
  hoverWithHighlight (target) {
    // 清除定位类及标记节点
    const preHighlightDom = document.getElementById("canvas-hover-mark-id")
    if(preHighlightDom) {
      preHighlightDom.parentElement.classList.remove("canvas-hover-wrap-position")
      preHighlightDom.remove()
    }
    const { offsetWidth, offsetHeight } = target
    const scrollableParent = document.body
    const rect = target.getBoundingClientRect();
    const scrollXDistance = window.scrollX || 
                    window.pageXOffset ||
                    document.documentElement.scrollLeft || 
                    document.body.scrollLeft;
    const scrollYDistance = window.scrollY || 
                    document.documentElement.scrollTop || 
                    document.body.scrollTop;
    const left = `${rect.left + scrollXDistance}`;
    const top = `${rect.top + scrollYDistance}`;
    const highlightDom = document.createElement("span")
    highlightDom.id = "canvas-hover-mark-id"
    highlightDom.style.width = `${offsetWidth}px`
    highlightDom.style.height = `${offsetHeight}px`
    highlightDom.style.border = `2px solid #078bfa`
    highlightDom.style.position = "absolute"
    highlightDom.style.top = `${top}px`
    highlightDom.style.left = `${left}px`
    highlightDom.style.backgroundColor = "rgba(7, 139, 250, 0.3)"
    highlightDom.style.zIndex = 99999999
    // 屏蔽事件
    highlightDom.style.pointerEvents = "none"
    // 添加tag显示
    const tagDom = document.createElement("span")
    tagDom.style.height = "20px"
    tagDom.style.lineHeight = "20px"
    tagDom.style.padding = "0px 4px"
    tagDom.style.color = "white"
    tagDom.style.fontSize = "12px"
    tagDom.style.backgroundColor = "#078bfa"
    tagDom.style.position = "absolute"
    tagDom.style.zIndex = 9999999999
    tagDom.style.top = "-24px"
    tagDom.style.left = "-2px"
    tagDom.textContent = target.tagName.toLowerCase()
    // 屏蔽事件
    tagDom.style.pointerEvents = "none"
    highlightDom.appendChild(tagDom)
   
    scrollableParent.prepend(highlightDom)
    const scrollableParentPosition = window.getComputedStyle(scrollableParent).position
    // 未设置定位时使用relative 
    if (scrollableParentPosition === "static") {
      scrollableParent.classList.add("canvas-hover-wrap-position")
    }
  },
  clearHighlight () {
    const highlightDom = document.getElementById("canvas-hover-mark-id")
    if(highlightDom) {
      highlightDom?.parentElement?.classList?.remove("canvas-hover-wrap-position")
      highlightDom?.remove()
    }
  },
  addTooltip(target) {
    // 统一清除其他显示标签
    const elements = document.querySelectorAll('[class^="canvas-tag-tooltip-"]');
    if(elements.length > 0) {
      elements.forEach(item => {
        item?.remove()
      })
    }
    // 动态创建tooltip
    const tooltip = document.createElement('div');
    
    tooltip.textContent = target.tagName.toLowerCase();
    
    // 定位tooltip防止溢出视口
    const rect = target.getBoundingClientRect();
    const scrollXDistance = window.scrollX || 
                    window.pageXOffset ||
                    document.documentElement.scrollLeft || 
                    document.body.scrollLeft;
    const scrollYDistance = window.scrollY || 
                    document.documentElement.scrollTop || 
                    document.body.scrollTop;
    tooltip.style.left = `${rect.left + rect.width/2 + scrollXDistance}px`;
    let top = `${rect.top - 29 + scrollYDistance}px`;
    if((rect.top - 29) < 0) {
      top = target.height + 10 + scrollYDistance + "px"
      tooltip.className = 'canvas-tag-tooltip-top';
    } else {
      tooltip.className = 'canvas-tag-tooltip-bottom';
    }
    tooltip.style.top = top
    document.body.appendChild(tooltip);
  },
  // 执行复制
  acceptCopy: function () {
    // 组件clone
    if (
      _Global.currSelectedDom.parentElement.getAttribute("data-parent") ===
      "component-wrap"
    ) {
      const clonedNode = _Global.currSelectedDom.parentElement.cloneNode(true);
      clonedNode.children[1].classList.remove("dragging");
      _Global.currSelectedDom.parentElement.parentNode.appendChild(clonedNode);
      _Global.copyDomList.push({
        sourceElemnet: _Global.currSelectedDom.parentElement,
        parentElement: _Global.currSelectedDom.parentElement.parentNode,
      });
    }
    // 普通复制
    else {
      const clonedNode = _Global.currSelectedDom.cloneNode(true);
      clonedNode.classList.remove("dragging");
      _Global.currSelectedDom.parentNode.appendChild(clonedNode);
      _Global.copyDomList.push({
        sourceElemnet: _Global.currSelectedDom,
        parentElement: _Global.currSelectedDom.parentNode,
      });
    }
    // 生成prompt
    this.renderPrompt();
  },
  // 创建组件
  createComponent: function (pos, component, type, action, parentId = null) {
    // 取消拖入组件
    if (!pos && !component) {
      Business.clearHighlight()
      // // 多选一个以上 不允许复制
      // if (_Global.whenShfitOnDom.length > 1) {
      //   Message.sendMessage({
      //     type: 'alert-msg',
      //     text: '不允许同时复制多个元素',
      //     msgType: 'warning'
      //   });
      //   return;
      // }
      // // 执行复制操作后唤起ai编码
      // Message.sendMessage({
      //   type: "do-copy",
      //   data: null,
      // });
    } else {
      // 交互组件创建
      if (type === "action") {
        // reference插槽组件特殊处理方式 如ElPopconfirm
        if (component.type === "reference") {
          this.renderReferenceComponent(component);
        } else {
          this.renderActionComponent(component);
        }
      }
      // 通用组件创建
      else {
        this.renderComponent(component, pos, null, null, null, null, action, parentId);
      }
    }
  },
  // 获取修改数据
  getDomList: function() {
    var domArr = _Global.configDomList;
    Message.sendMessage({
      type: "get-dom-list",
      data: domArr
    })
  },
  adapterSubmit: function (type = "default") {
    if(_Global.currentMode === "design") return this.renderDesignPrompt()
    // 视图设计 修改源码
    // 移除所有canvas-scroll-wrap-append-position类名
    var elements = document.querySelectorAll('.canvas-scroll-wrap-append-position') || [];
    if(elements.length > 0) {
      // 遍历所有匹配的元素并移除指定类名
      elements.forEach(function(element) {
        element.classList.remove('canvas-scroll-wrap-append-position');
      });
    }
    var configDomList = _Global?.configDomList || []
    if(configDomList.length < 1) return Message.sendMessage({
      type: 'alert-msg',
      text: '当前视图无变更,不需进行修改!',
      msgType: 'warning'
    })
    const msg = configDomList.map(item => {
      const itemIdx = item?.element?.closest("[data-insp-path]")?.getAttribute("data-insp-path") || ""
      let itemStyle = item?.styles || {}
      // 组合属性特殊处理
      if(itemStyle.centerType) {
        const centerTypeMap = {
          "center-v": {
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          },
          "center-h": {
            display: "flex",
            flexDirection: "row",
            justifyContent: "center"
          },
          "center-vh": {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center"
          }
        }
        const realStyle = centerTypeMap[itemStyle.centerType]
        itemStyle = {
          ...itemStyle,
          ...realStyle
        }
        delete itemStyle.centerType
      }
      const inlineStyles = Object.entries(itemStyle)
        .map(([key, value]) => `${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}:${value}`)
        .join('; ')
      return {
        index: itemIdx,
        styles: inlineStyles
      }
    })
    if(type === "default") {
      Message.sendMessage({
        type: "to-update-code",
        data: {
          msg
        }
      })
    } 
    // 数据消费完进行释放（改为提交成功后通过clear-dom-list方法释放）
    // _Global.configDomList = []
    return msg
  },
  // 生成prompt并上报
  renderPrompt: function (type = "report") {
    if(_Global.currentMode === "design") {
      return this.renderDesignPrompt()
    }
    // 移除所有canvas-scroll-wrap-append-position类名
    var elements = document.querySelectorAll('.canvas-scroll-wrap-append-position') || [];
    if(elements.length > 0) {
      // 遍历所有匹配的元素并移除指定类名
      elements.forEach(function(element) {
        element.classList.remove('canvas-scroll-wrap-append-position');
      });
    }
    var configDomList = _Global.configDomList;
    var delDomList = _Global.delDomList || [];
    // 判断有无变更
    // if (delDomList.length === 0 && configDomList.length === 0) return
    /**
     * 生成添加动作prompt
     */
    var configDomList = _Global.configDomList;
    var addList =
      configDomList.filter((item) => item.type === "addComponent") || [];
    var addPrompt = this.renderAddPrompt(addList);
    /**
     * 生成删除prompt
     */
    var delPrompt = this.renderDelPrompt(delDomList);
    var replacePrompt = this.renderReplacePrompt(_Global.replaceDomList || []);
    /**
     * 生成变更prompt
     */
    var changeList =
      configDomList.filter(
        (item) =>
          item.type !== "addComponent" && item.type !== "actionComponent"
      ) || [];
    var actionList =
      configDomList.filter((item) => item.type === "actionComponent") || [];
    var changePrompt = this.renderChangePrompt(changeList);
    var actionPrompt = this.renderActionPrompt(actionList, addList);
    var copyPrompt = this.renderCopyPrompt(_Global.copyDomList);
    // 6.5变更 不需起始prompt
    // var newStart = _Global.platform === "mobile" ? _Global.promptStart() : _Global.promptStartPc()
    var tipsPrompt = _Global.promptTips;
    if(_Global.uiLib === "element-ui") {
      if(_Global.isHzWrapper) {
        tipsPrompt = _Global.promptTipsForHz
      } else {
        tipsPrompt = _Global.promptTipsForUi
      }
    }
    if(_Global.uiLib === "hzb-ui") {
      tipsPrompt = _Global.promptTipsForHzbUi
    }
    if (
      addList.length < 1 &&
      actionList.length < 1 &&
      _Global.replaceDomList.length < 1
    ) {
      tipsPrompt = _Global.promptTipsOnly;
    }
    var allPrompt =
      addPrompt +
      delPrompt +
      changePrompt +
      actionPrompt +
      copyPrompt +
      replacePrompt +
      tipsPrompt;
    if (type === "report") {
      var msg = {
        type: "report-prompt",
        data: {
          prompt:
            allPrompt === tipsPrompt ? "" : _Global.promptStart + allPrompt,
        },
      };
      window._Global.storageMsg = msg
      // Message.sendMessage(msg);
      // 获取源码组件源码
      if(window._Global.iframes.length > 0) {
        window._Global.iframes.forEach(itemId => {
          document.getElementById(itemId)?.contentWindow.postMessage(Utils.safeJsonStringify({
            type: "render-code"
          }), "*")
        })
      }
      // 若未拖入源码组件 则直接上报 
      else {
        Message.sendMessage(msg);
      }
    } else {
      return allPrompt === tipsPrompt ? "" : _Global.promptStart + allPrompt;
    }
  },
  // 多环境适配提示词
  paddingPrompt: function () {
    let paddingPrompt = ""
    if(_Global.uiLib === "element-ui") {
      // Hz包裹器适配
      if(_Global.isHzWrapper) {
        paddingPrompt = _Global.useageOfHzWrapper
      } 
      // 大前端vue2 + element-ui源码模版适配
      else {
        paddingPrompt =  _Global.paddingAddPrompt
      }
    } else if(_Global.uiLib === "hzb-ui") {
      paddingPrompt =  _Global.paddingHzbUiPrompt
    }
    return paddingPrompt
  },
  // 生成添加或替换prompt
  renderAddPrompt: function (list = [], type = "add") {
    var addPrompt = "";
    const that = this
    list = list.filter(item => item.component.className !== "CodeBox")
    if (list.length === 0) return addPrompt;
    list.forEach((item, index) => {
      var componentName = "";
      if (item.component.className === "CodeBox") return
      if (Array.isArray(item.component.componentName)) {
        componentName = item.component.componentName.join(",");
      } else {
        componentName = item.component.componentName;
      }
      var libName = Business.getUiLib();
      // 当存在多个组件库时，区分组件是否是Vant组件
      if (item.component.className.slice(0,3) === "Van") {
        libName = "Vant4"
      }
      var itemStyles = item.styles;
      var insertElement = Utils.describeDOMNode(item.insertElement);
      var insertPosition = "的后面";
      if (item.insertPosition === "before") {
        insertPosition = "的前面";
      } else if (item.insertPosition === "after") {
        insertPosition = "的后面";
      } else if (item.insertPosition === "in-before") {
        insertPosition = "的内部起始位置";
      } else if (item.insertPosition === "in-after") {
        insertPosition = "的内部结束位置";
      }
      if( type === "add" ) {
        let pathDesc = item.insertElement.getAttribute("data-insp-path");
        if(!pathDesc) {
          pathDesc = item.insertElement.closest("[data-insp-path]")?.getAttribute("data-insp-path")
        }
        const routerUrl = window.location?.href?.replace(window.location?.origin, "")
        const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
        const insertPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
        addPrompt += insertPrompt;
      }
      var desc = "";
      if (item.component.name === "中后台表单页") {
        desc = "该组件需要水平居中显示";
      }
      if(type === "add") {
        addPrompt += "编号组件" + (index + 1) + "描述如下:"
      }
      if (
        !(item.component.className instanceof Array) &&
        item.component.className.startsWith("Ai")
      ) {
        if(item.component.name === "布局容器") {
          // 三种情况  el替换hz变种 hzb-ui element-ui
          const sourceCode = _Global.isHzWrapper ? Utils.elToHz(item.component.sourceCode) : item.component?.hzbV2SourceCode ? item.component?.hzbV2SourceCode : item.component.sourceCode
          addPrompt +=
            "这是一个源码组件,源码内容如下:" +
            sourceCode + '移除组件内所有因条件不满足(v-if值为false)而不会渲染的DOM节点,包括:静态false条件,计算属性返回false的分支,异步数据未加载时的占位元素;并移除script部分对应的未使用数据属性;' + 
            desc +
            `,需将此组件单独存放在一个vue文件中.
          【组件备注】若组件源码中引入了第三方依赖包(如:axios${_Global.isHzWrapper ? '' : '、element-plus、element-ui、vant'}等)在项目工程中未进行配置及安装需进行配置与安装,组件引入时必须使用相对路径.若该组件在项目工程中已进行定义,此步骤可跳过,不得进行重复定义.`;
        } else {
        const sourceCode = _Global.isHzWrapper ? Utils.elToHz(item.component.sourceCode) : item.component?.hzbV2SourceCode ? item.component?.hzbV2SourceCode : item.component.sourceCode
        addPrompt +=
          "这是一个源码组件,源码内容如下:" +
          sourceCode +
          desc +
          `,需将此组件单独存放在一个vue文件中.
        【组件备注】若组件源码中引入了第三方依赖包(如:axios${_Global.isHzWrapper ? '' : '、element-plus、element-ui、vant'}等)在项目工程中未进行配置及安装需进行配置与安装,组件引入时必须使用相对路径.若该组件在项目工程中已进行定义,此步骤可跳过,不得进行重复定义.`;
        }
      } else if (
        item.component.name === "页头" ||
        item.component.name === "时间选择"
      ) {
        addPrompt +=
          "这是一个" +
          (libName === "Hzb-Ui" ? "@hzbank/pc-vue2-ui" : libName) +
          "下的" +
          (Business.getComponentName(item.component.componentName)) +
          item.component.name +
          "组件,";
      } 
      // Echarts图表组件解析
      else if (item.component.className === "Echarts" ) {
        addPrompt +=
        "这是一个Echarts图表组件, " +
        "需在vue文件中通过echarts.init进行初始化, 并设置options为" +
        Utils.safeJsonStringify(item.store.data.options) + "," +
        "组件宽度为" + item.store.data.width + ", 高度为" + item.store.data.height + "。" +
        "如需自定义数据或交互, 请在options中进行配置。" +
        "【组件备注】需确保项目已安装echarts依赖, 并在使用Echarts图表组件的vue文件中正确引入。";
      }
      // 源码容器组件
      // else if (item.component.className === "CodeBox") {
      //   addPrompt += `这是一个源码组件,源码内容如下:{{iframe-CodeBox-${item?.element.id}}}`
      // }
      else {
        addPrompt +=
          "这是一个" +
          (libName === "Hzb-Ui" ? "@hzbank/pc-vue2-ui" : libName) +
          "下的" +
          item.component.name + (Business.getComponentName(item.component.componentName)) +
          "组件,";
      }
      // console.log(item.component)
      // var styles = Object.entries(itemStyles);
      // // 行内样式解析
      // if (styles.length > 0) {
      //   addPrompt += "该组件style属性信息如下:";
      //   styles.forEach(([key, value]) => {
      //     if(key === "centerType") {
      //       if (value !== "default") {
      //         var centerTypeMap = {
      //           "center-h": "水平居中",
      //           "center-v": "垂直居中",
      //           "center-vh": "水平垂直居中",
      //         };
      //         addPrompt += "布局居中方式设置为" + centerTypeMap[value] + ",";
      //       }
      //     } else {
      //       addPrompt += "属性" + key + "设置为" + value + ",";
      //     }
      //   });
      //
      // 组件属性解析
      var properties = (item.store && item.store.getDataProps) ? Object.entries(item.store.getDataProps()) : null;
      if (properties && properties.length > 0) {
        addPrompt += "该组件属性信息如下: 如果有v-model绑定值,请注意声明并设置初始值;";
        properties.forEach(([key, value]) => {
          if (key.indexOf("EventFor") < 0) {
            if (value !== undefined) {
              // 处理icon插槽
              if (key === "IconSlotFordefault") {
                if(libName === "Hzb-Ui") {
                  addPrompt += "使用的图标为" + value + ",";
                } else {
                  addPrompt += "使用的图标为" + value + ",";
                }
              } else if (key === "IconSlotForicon") {
                if(libName === "Hzb-Ui") {
                  addPrompt += "属性icon设置为" + value + ",";
                } else {
                  addPrompt += "属性icon设置为" + value + ",";
                }
              }
              // 处理文本内容
              else if (key === "textContent") {
                addPrompt += "文本内容为" + value + ",";
              } else if (
                key === "tabs" ||
                key === "options" ||
                key === "PropForParentdata" ||
                key === "style" ||
                key === "PropForParentstyle" ||
                key === "breadcrumb" ||
                key === "timelines" ||
                key === "data" ||
                key === "collapseData" ||
                key === "carouselData" ||
                key === "items" ||
                key === "list" || 
                key === "columns" ||
                key === "columnsFieldNames"
              ) {
                addPrompt +=
                  "属性" +
                  key +
                  "设置为" +
                  Utils.safeJsonStringify(value) +
                  ",";
              } else if (key === "elstep") {
                addPrompt += `拥有el-step的子组件,数据是${Utils.safeJsonStringify(value)},`;
              } else if (key === "descriptionsData") {
                addPrompt += `拥有el-descriptions-item的子组件,数据是${Utils.safeJsonStringify(value)},`;
              } else if (key === "PropForParenttextLabel") {
                addPrompt += `在组件前添加一个内容为'${value}:'的文本标题与组件在同一行,`;
              } else if (key === "labelContent") {
                addPrompt += `在组件前添加一个内容为'${value}:'的文本标题与组件在同一行,`;
              } else if (key === "defaultSlot") {
                if(libName === "Element-Ui" || libName === "Hzb-Ui") {
                  addPrompt += `组件的default插槽里是一个<span>${value}<i class="el-icon-arrow-down"></i></span>的结构,`;
                } else if(libName === "Element-Plus") { 
                  addPrompt += `组件的default插槽里是一个<span>${value}<el-icon><arrow-down /></el-icon></span>的结构,`;
                }
              } else if (key === "dropdownOptions") {
                addPrompt += `将el-dropdown-menu子组件放在dropdown的插槽里,数据为${Utils.safeJsonStringify(value)}`;
              } else if (key === "PropForParentmenu") {
                addPrompt += `拥有el-sub-menu和el-menu-item子组件,菜单数据为${Utils.safeJsonStringify(value)}`;
              } else if (key === "tabbarData") {
                addPrompt += `拥有van-tabbar-item子组件,数据为${Utils.safeJsonStringify(value)},具有文字内容{{item.title}},使用span标签包裹文本内容`;
              } else if (key === "tabData") {
                addPrompt += `拥有van-tab的子组件,数据是${Utils.safeJsonStringify(value)},具有文字内容"内容{{index + 1}}",使用span标签包裹文本内容`;
              } else if (key === "gridData") {
                addPrompt += `拥有van-grid-item的子组件,数据是${Utils.safeJsonStringify(value)}`;
              } else if (key === "swipeData") {
                addPrompt += `拥有van-swipe-item的子组件,数据是${Utils.safeJsonStringify(value)}`;
              } else if (key === "colData") {
                addPrompt += `拥有el-col的子组件,数据是${Utils.safeJsonStringify(value)},每个el-col的样式属性是style="border-radius: 4px;min-height: 36px;border: 1px solid #dcdfe6;",`;
              } else if (key === "sidebarData") {
                addPrompt += `拥有van-sidebar-item的子组件,数据是${Utils.safeJsonStringify(value)}`;
              } else if (key === "stepsData") {
                addPrompt += `拥有van-step的子组件,数据是${Utils.safeJsonStringify(value)}`;
              }  else if (key === "vancolData") {
                addPrompt += `拥有van-col的子组件,数据是${Utils.safeJsonStringify(value)},每个van-col的样式属性是style="border-radius: 4px;min-height: 36px;border: 1px solid #66c6f2;display: flex;align-items: center;justify-content: center;",其中文本内容使用span标签包裹,内容为{{index + 1}}`;
              } else if (key === "valueFormat" || key === "format") {
                if(libName === 'Element-Ui') {
                  addPrompt +=
                  "属性" +
                  key +
                  "设置为" +
                  that.convertDateFormat(value, 'plus2ui') +
                  ",";
                }else{
                  addPrompt +=
                  "属性" +
                  key +
                  "设置为" +
                  value +
                  ",";
                }
              } else {
                if (key !== "domRef") {
                  var name =
                    item.component.className instanceof Array
                      ? item.component.className.join(",")
                      : item.component.className;
                  const transValue = name.startsWith("Ai")
                    ? JSON.stringify(value)
                    : value;
                  const transKey = name.startsWith("Ai") ? Utils.camelToKebab(key) : key
                  addPrompt += "属性" + transKey + "设置为" + transValue + ",";
                }
              }
            }
          } else {
            if (value) {
              addPrompt +=
                "绑定了" +
                key.split("EventFor")[1] +
                "事件,该事件触发后执行" +
                value +
                ",";
            }
          }
        });
      }
      // 替换时会立刻调用llm 故只需解析添加动作
      if(type === "add") {
        // 链接信息解析
        const linkConfig = item.element?.getAttribute("data-link-config");
        if (linkConfig) {
          const [type, path] = linkConfig.split("|");
          if (type === "router") {
            addPrompt += `该组件添加data-link-config属性,值为${linkConfig},且点击时通过路由切换的方式切换至path为${path}的页面.`;
          } else {
            addPrompt += `该组件添加data-link-config属性,值为${linkConfig},且点击时将当前页面切换至地址为${path}的页面.`;
          }
        }
        // api调用解析
        const apiConfig = item.element.getAttribute("data-api-config");
        if (apiConfig) {
          const [method, url, contentType, data] = apiConfig.split("|");
          addPrompt += `该组件点击时会调用api方法,该api方法具体定义如下:采用${method}请求方法,请求地址为${url},请求体contentType为${contentType},请求数据为${data}.
          【重要点】需将此api方法单独定义在一个function中.`;
        }
      }
      // 解析补充描述
      var desc = item.desc;
      if (desc) {
        addPrompt += "***对该组件补充描述为" + desc + ",补充描述优先级更高***";
      }
      // 替换提示词 直接返回
      if(type === "replace") return addPrompt
      addPrompt += "该组件插入至节点信息为" + insertElement + "DOM节点" + insertPosition + ".\n";
    });
    const paddingPrompt = Business.paddingPrompt()
    return addPrompt + paddingPrompt;
  },
  // 生成删除prompt
  renderDelPrompt: function (list = []) {
    var delPrompt = "";
    if (list.length === 0) return delPrompt;
    delPrompt += "删除以下dom节点:\n";
    list.forEach((item) => {
      let pathDesc = item.element.getAttribute("data-insp-path");
      if(!pathDesc) {
        pathDesc = item.element.closest("[data-insp-path]")?.getAttribute("data-insp-path")
      }
      const routerUrl = window.location?.href?.replace(window.location?.origin, "")
      const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
      const posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
      delPrompt += posPrompt;
      delPrompt +=
        "删除节点信息为" + Utils.describeDOMNode(item.element) + "的元素.\n";
    });
    return delPrompt;
  },
  // 生成变更prompt
  renderChangePrompt: function (list = []) {
    var changePrompt = "";
    if (list.length === 0) return changePrompt;
    changePrompt += "变更以下dom节点:\n";
    list.forEach((item) => {
      var elementDesc = Utils.describeDOMNode(item.element);
      var styles = Object.entries(item.styles);
      let pathDesc = item.element.getAttribute("data-insp-path");
      if(!pathDesc) {
        pathDesc = item.element.closest("[data-insp-path]")?.getAttribute("data-insp-path")
      }
      const routerUrl = window.location?.href?.replace(window.location?.origin, "")
      const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
      const posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
      changePrompt += posPrompt;
      if(Array.isArray(styles) && styles.length > 0) {
        changePrompt += "节点信息为" + elementDesc + "的style样式变更如下,";
      } else {
        changePrompt += "节点信息为" + elementDesc
      }
      Object.entries(styles).forEach(([index, [key, value]]) => {
        if (key === "centerType") {
          if (value !== "default") {
            var centerTypeMap = {
              "center-h": "水平居中",
              "center-v": "垂直居中",
              "center-vh": "水平垂直居中",
            };
            changePrompt += "布局居中方式设置为" + centerTypeMap[value] + ",";
          }
        } else {
          const realKey = key === "innerText" ? key : Utils.camelToKebab(key);
          changePrompt += "属性" + realKey + "设置为" + value + ",";
        }
      });
      // 链接信息解析
      const linkConfig = item.element.getAttribute("data-link-config");
      if (linkConfig) {
        const [type, path] = linkConfig.split("|");
        if (type === "router") {
          changePrompt += `该节点添加data-link-config属性,值为${linkConfig},且点击时通过路由切换的方式切换至path为${path}的页面.`;
        } else {
          changePrompt += `该节点添加data-link-config属性,值为${linkConfig},且点击时调用自定义方法的方式打开页面, 自定义方法代码参考const openUrl = ()=>{window.open('${path}','_blank')}.`
        }
      }
      // api调用解析
      const apiConfig = item.element.getAttribute("data-api-config");
      if (apiConfig) {
        const [method, url, contentType, data] = apiConfig.split("|");
        changePrompt += `该节点点击时会调用api方法,该api方法具体定义如下:采用${method}请求方法,请求地址为${url},请求体contentType为${contentType},请求数据为${data}.
        【重要点】需将此api方法单独定义在一个function中`;
      }
      // 生成补充描述
      var desc = item.desc;
      if (desc) {
        changePrompt +=
          "***对该节点补充描述为" + desc + ",补充描述优先级更高***";
      }
      changePrompt += ".\n";
    });
    return changePrompt;
  },
  // 生成交互组件prompt
  renderActionPrompt: function (actionList = [], addList = []) {
    if (actionList.length === 0) return "";
    var prompt = "";
    actionList.forEach((item) => {
      var libName = Business.getUiLib()
      // 当存在多个组件库时，区分组件是否是Vant组件
      if (item.component.className.slice(0,3) === "Van") {
        libName = "Vant4"
      }
      libName = libName === "Hzb-Ui" ? "@hzbank/pc-vue2-ui" : libName
      prompt += `这是一个${libName}下的${item.component.name}(${Business.getComponentName(item.component.componentName)})组件,组件属性描述如下:`;
      // 组件属性解析
      var properties = Object.entries(item.store.getDataProps());
      var eventName = item.component.triggerEvent.label;
      properties.forEach(([key, value]) => {
        if (properties && properties.length > 0) {
          if (key.indexOf("VModelshow") < 0) {
            if (value !== undefined && key !== "domRef") {
              // 插槽处理
              if (key.indexOf("CommonSlotFor") > -1) {
                prompt +=
                  "插槽" +
                  key.split("CommonSlotFor")[1] +
                  "内容设置为'" +
                  value +
                  "',";
              } else if(key === "VModel") {
                // element-ui适配
                if(_Global.uiLib === "element-ui" && (item.component.className === "ElDrawer" || item.component.className === "ElDialog")) {
                  prompt += "属性visible" + "设置为" + value + ",";
                } else {
                  prompt += "属性v-model" + "设置为" + value + ",";
                }
              } else if(key === "actions" || key === "options") {
                prompt += "属性" + key + "设置为" + Utils.safeJsonStringify(value) + ",";
              } else {
                prompt += "属性" + key + "设置为" + value + ",";
              }
            }
          }
        }
      });
      prompt += "\n";
      // 判断绑定交互是组件还是普通dom节点
      var eventElementPrompt = "";
      var posPrompt = "";
      addList.length > 0 &&
        addList.forEach((listItem, index) => {
          // 交互行为绑定在组件上
          if (
            listItem.parentElement &&
            listItem.parentElement.lastElementChild === item.eventElement
          ) {
            eventElementPrompt = `编号组件${index + 1},若编号组件${index + 1}中的${eventName}与此处存在冲突,以此处描述为准`;
            let pathDesc =
              listItem.insertElement.getAttribute("data-insp-path");
            if(!pathDesc) {
              pathDesc = listItem.insertElement.closest("[data-insp-path]")?.getAttribute("data-insp-path")
            }
            const routerUrl = window.location?.href?.replace(window.location?.origin, "")
            const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
            posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
          }
        });
      if (!eventElementPrompt) {
        eventElementPrompt = Utils.describeDOMNode(item.eventElement);
        let pathDesc = item.eventElement.getAttribute("data-insp-path");
        if(!pathDesc) {
          pathDesc = item.eventElement.closest("[data-insp-path]")?.getAttribute("data-insp-path")
        }
        const routerUrl = window.location?.href?.replace(window.location?.origin, "")
        const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
        posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
      }
      prompt += `该组件通过${eventName}事件控制其交互行为,${eventName}事件被绑定在${eventElementPrompt}.该事件绑定需用vue的语法进行绑定,配置的属性需符合组件属性的数据类型.`;
      prompt = posPrompt + prompt;
    });
    return prompt + (_Global.uiLib === "element-ui" ? _Global.paddingAddPrompt : "");
  },
  // 生成复制prompt
  renderCopyPrompt: function (list = []) {
    if (list.length < 1) return "";
    var copyPrompt = "";
    list.forEach((item) => {
      let pathDesc = item.sourceElemnet.getAttribute("data-insp-path");
      if(!pathDesc) {
        pathDesc = item.sourceElement.closest("[data-insp-path]")?.getAttribute("data-insp-path")
      }
      const routerUrl = window.location?.href?.replace(window.location?.origin, "")
      const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
      const posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
      copyPrompt += posPrompt;
      copyPrompt += `基于${Utils.describeDOMNode(item.sourceElemnet)}进行复制,并插入到被复制节点的的父元素中.\n`;
    });
    return copyPrompt;
  },
  // 生成替换组件prompt
  renderReplacePrompt: function (list = []) {
    var replacePrompt = "";
    if (list.length === 0) return replacePrompt;
    list.forEach((item) => {
      const storeDom = item;
      if (!storeDom) return;
      var componentName = "";
      if (Array.isArray(storeDom.component.componentName)) {
        componentName = storeDom.component.componentName.join(",");
      } else {
        componentName = storeDom.component.componentName;
      }
      var oldDomDesc = Utils.describeDOMNode(item.dom);
      let pathDesc = item.dom.getAttribute("data-insp-path");
      if(!pathDesc) {
        pathDesc = item.dom.closest("[data-insp-path]")?.getAttribute("data-insp-path")
      }
      const routerUrl = window.location?.href?.replace(window.location?.origin, "")
      const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
      const insertPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
      replacePrompt += `${insertPrompt + oldDomDesc}的节点替换为如下描述的组件：`;
      const componentPrompt = Business.renderAddPrompt(list, "replace")
      replacePrompt += componentPrompt
    });
    return replacePrompt;
  },
  // 生成用户输入内容prompt
  renderInputPrompt: function (msg = "", type = "default") {
    let prompt = ""
    if(type === "append") {
      prompt += "\n【重点】若上述同节点的变更与以下描述的变更存在冲突,以下描述的优先级更高.\n"
    }
    let dom = _Global.currSelectedDom
    if(dom.getAttribute("data-layout")) {
      dom = dom.previousSibling
    }
    const domDesc = Utils.describeDOMNode(dom)
    let pathDesc = dom.getAttribute("data-insp-path")
    if(!pathDesc) {
      pathDesc = dom.closest("[data-insp-path]")?.getAttribute("data-insp-path")
    }
    const routerUrl = window.location?.href?.replace(window.location?.origin, "")
    const appendPrompt = `当前页面路由地址为${routerUrl},若变更涉及组件,尽量避免修改组件的属性和结构;`
    const posPrompt = pathDesc ? `索引到${pathDesc},{{codeSlot=${pathDesc}}},${appendPrompt}` : "";
    prompt += posPrompt
    prompt += `\n${domDesc}的元素`
    prompt += `\n基于以下描述进行修改,描述的详细内容为:\n${msg}`
    return prompt
  },
  // 更新dom适配器
  updateAttrsAdapter: function (key, value) {
    // 单选直接更新
    if (_Global.whenShfitOnDom.length === 0)
      return this.updateAttrs(key, value);
    // 多选批量更新
    _Global.whenShfitOnDom.forEach((item) => {
      this.updateAttrs(key, value, item);
    });
  },
  // 更新dom
  updateAttrs: function (key, value, currentDom) {
    var element = currentDom || _Global.currSelectedDom;
    var domArr = _Global.configDomList;
    var index = domArr.findIndex((item) => item.element === element);
    try{
    // 组件处理
    if (
      element.parentElement.getAttribute("data-parent") === "component-wrap"
    ) {
      index = domArr.findIndex(
        (item) => item.element === element.parentElement.children[0]
      );
      element = element.parentElement.children[0];
    }
    } catch(err) {
      console.log(err)
    }
    if (element) {
      if (key === "innerText") {
        const dftText = element.getAttribute("data-default-innerText");
        if (!dftText) {
          element.setAttribute(
            "data-default-innerText",
            element.textContent.trim().replace(/\s+/g, " ")
          );
        }
        element.innerText = value;
      }
      // 居中方式设置
      else if (key === "centerType") {
        // 统一清除居中方式
        element.classList.remove("center-v", "center-h", "center-vh");
        // 配置当前居中方式
        if (value !== "default") {
          element.classList.add(value);
        }
      }
      // 组件插入位置变更
      else if (key === "appendPosition") {
        this.changeAppendPosition(value);
      } else if (key === "fontWeight") {
        element.style[key] = value;
      } else {
        element.style[key] =
          !isNaN(value) && value !== "" ? value + "px" : value;
      }
    }
    // 存在  则进行修改
    if (index !== -1) {
      if (key === "desc") {
        domArr[index].desc = value;
      } else {
        domArr[index].styles[key] = value;
      }
    }
    // 进行去重判断 不存在 则添加至变更数组中
    else {
      if (key === "desc") {
        domArr.push({
          type: "addAttr",
          element,
          styles: {},
          desc: value,
        });
      } else {
        domArr.push({
          type: "addAttr",
          element,
          styles: {
            [key]: value,
          },
        });
      }
    }
    // 更新删除按钮位置
    this.markSelectLine(element)
  },
  // 删除适配器
  deleteAdapter: function (data) {
    // 删除交互组件
    if (data)
      return this.deleteDom({
        type: "action",
        data: data,
      });
    // 无效操作
    if (!_Global.currSelectedDom && _Global.multiNodes.length === 0) return;
    // 生成删除列表
    var delList =
      _Global.multiNodes.length > 0
        ? [..._Global.multiNodes]
        : [_Global.currSelectedDom];
    var componentList = [];
    var addDomList = _Global.configDomList.filter(
      (item) => item.type === "addComponent"
    );
    var actionDomList = _Global.configDomList.filter(
      (item) => item.type === "actionComponent"
    );
    // 找寻子节点中是否包含组件
    if (addDomList.length > 0) {
      delList.forEach((item) => {
        var result = Utils.findComponentWithAttr(item, "data-parent");
        componentList = [...new Set([...componentList, ...result])];
      });
      delList = [...new Set([...delList, ...componentList])];
      componentList = [];
    }
    // 找出节点列表中绑定的交互组件
    if (actionDomList.length > 0) {
      delList.forEach((item) => {
        var result = Utils.findComponentWithAttr(item, "data-event");
        componentList = [...new Set([...componentList, ...result])];
      });
      delList = [...new Set([...delList, ...componentList])];
    }
    const actionDomDelList = delList.filter((item) =>
      item.getAttribute("data-event")
    );
    const addDomDelList = delList.filter((item) => item.getAttribute("data-parent"));
    var filterNodes = Utils.filterContainedNodes(delList);
    // 删除交互组件
    actionDomDelList.forEach((item) => {
      actionDomList.forEach((cItem) => {
        if (cItem.eventElement === item) {
          Business.deleteDom({
            type: "action",
            data: {
              value: cItem.componentId,
            },
          });
        }
      });
    });
    // 删除组件(被包含类)
    addDomDelList.forEach((item) => {
      Business.deleteDom({
        type: "common",
        data: {
          element: item.lastElementChild,
        },
      });
    });
    filterNodes.forEach((item) => {
      Business.deleteDom({
        type: "common",
        data: {
          element: item,
        },
      });
    });
    // 置空多选
    _Global.multiNodes = [];
  },
  // 删除dom
  deleteDom: function (msg) {
    var data = msg.data;
    // 交互组件删除
    if (msg.type === "action") {
      // 判断当前节点是否已配置交互组件(含事件)
      var index = _Global.configDomList.findIndex(
        (item) => item.component.componentId === data.value
      );
      // 存在 则销毁后绑定新组件
      if (index > -1) {
        var eventElement = _Global.configDomList[index].eventElement;
        _Global.configDomList[index].store.unmount();
        // 销毁绑定事件
        eventElement.removeEventListener(
          _Global.configDomList[index].triggerEvent,
          _Global.configDomList[index].eventHandler
        );
        // 列表中移除
        _Global.configDomList.splice(index, 1);
        eventElement.dispatchEvent(new MouseEvent('mousedown'))
        eventElement.dispatchEvent(new MouseEvent('mouseup'))
        eventElement.dispatchEvent(new MouseEvent('click'))
      }
      return;
    }
    var index = _Global.configDomList.findIndex(
      (item) => item.element === data.element
    );
    try{
      // 若为组件 则取出真实dom进行查找
      if (
        data.element.parentElement.getAttribute("data-parent") ===
        "component-wrap"
      ) {
        index = _Global.configDomList.findIndex(
          (item) => item.element === data.element.parentElement.children[0]
        );
      }
    } catch(err) {
      console.log(err)
    }
    // 存在  则从变更列表移除  添加至删除列表
    if (index !== -1) {
      // 非组件
      if (_Global.configDomList[index].type !== "addComponent") {
        _Global.delDomList.push(_Global.configDomList[index]);
      }
      _Global.configDomList.splice(index, 1);
    } else {
      _Global.delDomList.push({
        element: data.element,
      });
    }
    try{
      // 执行codeBox删除
      if (
        data.element.parentElement.getAttribute("data-parent") ===
        "component-wrap"
      ) {
        // 同步删除消息至sandbox
        const componentId = data?.element?.getAttribute("data-component-id")
        Message.sendMessage({
          type: "delete-code-box",
          data: {
            componentId
          }
        })
        // 清空记录数组
        _Global.iframes = []
        data.element.parentElement.remove();
      } else {
        data.element.remove();
      }
    } catch(err) {
      console.log(err)
    }
    this.clearSelectLine()
    data.element = null;
  },
  // reference插槽交互组件生成
  renderReferenceComponent: async function (component = {}) {
    // 获取当前绑定节点
    var bindElement = _Global.currHoverDom;
    bindElement.classList.remove("on-hover");
    var componentName = component.componentName;
    var refObj = {};
    component.properties.forEach((item) => {
      refObj[item.attr] = item.value;
    });
    const createComponent = UseRender.render.createVNode(
      componentName,
      refObj,
      eventElement
    )
    _Global.configDomList.push({
      component,
      componentId: component.componentId,
      element: componentParent,
      type: "actionComponent",
      styles: {
        // top: pos.y + "px",
        // left: pos.x + "px"
      },
      parentElement: componentParent,
      store: createComponent,
      eventElement: eventElement,
      triggerEvent: component.triggerEvent.name,
      eventHandler: eventHandler // 记录绑定事件句柄
    });
  },
  // 生成交互组件并插入
  renderActionComponent: function (component = {}, bindElement = null) {
    _Global.currHoverDom.classList.remove("on-hover");
    // 判断当前节点是否已配置交互组件(含事件)
    if (!bindElement) {
      var index = _Global.configDomList.findIndex(
        (item) =>
          item.eventElement === _Global.currHoverDom &&
          item.triggerEvent === component.triggerEvent.name
      );
      // 存在 则销毁后绑定新组件
      if (index > -1) {
        _Global.configDomList[index].store.unmount();
        // 销毁绑定事件
        _Global.currHoverDom.removeEventListener(
          component.triggerEvent.name,
          _Global.configDomList[index].eventHandler
        );
        // 列表中移除
        _Global.configDomList.splice(index, 1);
      }
    }
    // 创建组件挂载元素
    var componentParent = document.createElement("span");
    document.body.appendChild(componentParent);
    var className = Utils.pascalToKebab(component.className);
    var properties = component.properties;
    var propertiesObj = Utils.safeJsonParse(Utils.safeJsonStringify(component.properties));
    var componentName = component.componentName;  
    for (var i of propertiesObj) {
      if(i.attr === "actions" || i.attr === "options") {
        i.value = Utils.safeJsonParse(i.value);
      }
    }
    const createComponent = UseRender.render.renderComponent(
      [componentName],
      componentParent,
      propertiesObj,
      this.renderTemplate(
        component.type === "function" ? "input" : className,
        properties,
        component?.forIndex || ""
      )
    )
    const instanceComponent = createComponent.lib[componentName] ? createComponent.lib[componentName] : createComponent.lib[componentName.replace('El', '')]
    var controllerKey = "VModelshow";
    for (var i of properties) {
      if (i.isController) {
        controllerKey = i.attr;
      }
    }
    var eventHandler = function (e) {
      // 阻止子节点事件冒泡行为
      var index = _Global.configDomList.findIndex(
        (item) => item.store && item.store._uid === createComponent._uid
      );
      var eventDom = _Global.configDomList[index].eventElement;
      if (e.target !== eventDom) return;
      // 方法组件直接调用
      if (component.type === "function") {
        // 生成msg
        var msg = { ...createComponent.getDataProps()};
        // 消息弹窗特殊处理
        if (componentName === "ElMessageBox") {
          instanceComponent(msg)
            .then(() => {})
            .catch(() => {});
        } else {
          instanceComponent(msg);
        }
        return;
      }
      createComponent.setDataValue(controllerKey, true)
    };
    var eventElement = bindElement ? bindElement : _Global.currHoverDom;
    if (!eventElement.getAttribute("data-event")) {
      eventElement.dataset.event = `event${Date.now()}`;
    }
    // 添加事件交互
    eventElement.addEventListener(component.triggerEvent.name, eventHandler);
    _Global.actionComponentApp = createComponent;
    // 加入变更列表
    _Global.configDomList.push({
      component,
      componentId: component.componentId,
      element: componentParent,
      type: "actionComponent",
      styles: {
        // top: pos.y + "px",
        // left: pos.x + "px"
      },
      parentElement: componentParent,
      store: createComponent,
      eventElement: eventElement,
      triggerEvent: component.triggerEvent.name,
      eventHandler: eventHandler, // 记录绑定事件句柄
    });
  },
  // 画布元素聚焦
  clickFoucus: function (dom = null) {
    const clickDom = dom ? dom : _Global.currHoverDom;
    // 完整模拟用户点击
    const mockMouseDownEvent = new MouseEvent("mousedown", { bubbles: true });
    const mockMouseUpEvent = new MouseEvent("mouseup", { bubbles: true });
    const mockClickEvent = new MouseEvent("click", { bubbles: true });
    clickDom.dispatchEvent(mockMouseDownEvent);
    clickDom.dispatchEvent(mockMouseUpEvent);
    clickDom.dispatchEvent(mockClickEvent);
  },
  // 生成组件并插入
  renderComponent: function (
    component = {},
    pos = {},
    refDom = null,
    refPos = null,
    refId = null,
    layoutElementId = null,
    action = null,
    parentId = null
  ) {
    // 单次只允许生成一个CodeBox
    if(component.componentName === "CodeBox" && window._Global.iframes?.length > 0) {
      return Message.sendMessage({
        type: 'alert-msg',
        text: '单次只允许生成一个源码容器,请提交后再拖入!',
        msgType: 'warning'
      });
    } 
    // 拖拽辅助线移除
    if (!refDom && pos && pos.x) {
      _Global.currHoverDom.classList.remove("on-hover");
    }
    var insertElement = refDom ? refDom : _Global.currHoverDom;
    // 碰撞是否为源码容器组件检测
    if((insertElement?.nodeName === "IFRAME" && insertElement?.getAttribute("component-mark-id")) || action === "group") {
      // 源码容器插入源码容器中给出提示
      if(component.componentName === "CodeBox") return Message.sendMessage({
        type: 'alert-msg',
        text: '源码容器组件不支持嵌入到源码容器组件中!',
        msgType: 'warning'
      });
      // 事件代理至源码沙箱
      const iframePos = insertElement?.getBoundingClientRect()
      const winPos = action === "group" ? {
        x: 80,
        y: 80
      } : {
        x: pos.x - 12 - iframePos.left,
        y: pos.y - 60 - iframePos.top
      }
      const iframeBox = action === "group" ? document.querySelector('[component-mark-id="box"]') : insertElement;
      iframeBox.contentWindow.postMessage(Utils.safeJsonStringify({
        component,
        pos: winPos,
        parentId,
        type: "add-component"
      }), "*")
      return
    } else {
      if(component.componentName !== "CodeBox") return Message.sendMessage({
        type: 'alert-msg',
        text: '请先拖入源码容器组件,然后再将组件拖入源码容器!',
        msgType: 'warning'
      });
    }
    var insertPosition = refPos ? refPos : "after";
    /**
     * 分析插入位置
     */
    // 存在子节点 进行精确查找
    if (!refPos) {
      if (pos && pos.x) {
        // if (_Global.currHoverDom.children.length > 0) {
        //   var closestChild = Utils.getClosestChildWithPosition(
        //     _Global.currHoverDom,
        //     pos.x,
        //     pos.y
        //   );
        //   insertElement = closestChild.element;
        //   insertPosition = closestChild.position;
        // } else {
        insertPosition = Utils.getPosition(_Global.currHoverDom, pos.x);
        // }
      }
      // 无坐标时为替换组件
      else {
        insertElement = _Global.currSelectedDom;
      }
      // 碰撞结果为组件时
      // 则直接取碰撞组件的插入方式
      try {
      if (
        insertElement.getAttribute("data-parent") &&
        insertElement.getAttribute("data-parent") === "component-wrap"
      ) {
        var index = _Global.configDomList.findIndex(
          (item) => item.element === insertElement.children[0]
        );
        var matchResult = _Global.configDomList[index];
        insertPosition = matchResult.insertPosition;
        insertElement = matchResult.insertElement;
      } else if (
        insertElement.parentElement.getAttribute("data-parent") &&
        insertElement.parentElement.getAttribute("data-parent") ===
          "component-wrap"
      ) {
        var index = _Global.configDomList.findIndex(
          (item) => item.element === insertElement.parentElement.children[0]
        );
        var matchResult = _Global.configDomList[index];
        insertPosition = matchResult.insertPosition;
        insertElement = matchResult.insertElement;
      }
      } catch (error) {
        Message.sendMessage({
          type: 'alert-msg',
          text: '请拖入真实DOM内！',
          msgType: 'error'
        });
        return
      }
    }
    var componentParent = document.createElement("span");
    componentParent.style.zIndex = "1000";
    componentParent.style.height = "fit-content";
    componentParent.style.position = "relative";
    componentParent.style.display = component.componentName === "CodeBox" ? "block" : "inline-block";
    if(component.componentName === "CodeBox") {
      componentParent.style.width = "100%"
    }
    var layoutElement = document.createElement("span");
    layoutElement.style.position = "absolute";
    layoutElement.style.width = "100%";
    layoutElement.style.height = "100%";
    layoutElement.style.top = "0";
    layoutElement.style.left = "0";
    layoutElement.style.index = "1000000";
    layoutElement.dataset.layout = `layout${Date.now()}`;
    if (layoutElementId) {
      layoutElement.dataset.event = layoutElementId;
    }
    // 添加组件标识
    componentParent.dataset.parent = "component-wrap";
    // 虚拟画布方式生成组件
    if (insertPosition === "before") {
      insertElement.parentNode.insertBefore(componentParent, insertElement);
    } else if (insertPosition === "after") {
      insertElement.parentNode.insertBefore(
        componentParent,
        insertElement.nextSibling
      );
    } else if (insertPosition === "in-before") {
      insertElement.prepend(componentParent);
    } else if (insertPosition === "in-after") {
      insertElement.appendChild(componentParent);
    }
    // Echarts渲染处理
    if (component.className === "Echarts") {
      let options = {};
      let width = 0;
      let height = 0;
      component.properties.forEach((item) => {
        if (item.attr === "options") {
          options = Utils.safeJsonParse(item.value);
        } else if (item.attr === "width") {
          width = Utils.paddingUnits(item.value);
        } else if (item.attr === "height") {
          height = Utils.paddingUnits(item.value);
        }
      });
      componentParent.style.width = width;
      componentParent.style.height = height;
      var initChart = echarts.init(componentParent);
      initChart.setOption(options);
      // if (_Global.currSelectedDom) {
      //   _Global.currSelectedDom.classList.remove("dragging");
      // }
      // layoutElement.classList.add("dragging");
      Business.markSelectLine(layoutElement)
      componentParent.appendChild(layoutElement);
      componentParent.children[0].style.zIndex = "-1";
      componentParent.children[0].style.position = "relative";
      this.markSelectLine(layoutElement)
      // 二次渲染需进行编号
      if (refId) {
        componentParent.children[0].dataset.mark = refId;
      }
      _Global.currSelectedDom = layoutElement;
      const store = {
        instance: initChart,
        data: {
          width,
          height,
          options,
        },
        box: componentParent,
      };
      // 加入变更列表
      _Global.configDomList.push({
        component,
        componentId: component.componentId,
        pos,
        element: componentParent.children[0],
        type: "addComponent",
        styles: {
          // top: pos.y + "px",
          // left: pos.x + "px"
        },
        parentElement: componentParent,
        store,
        targetElement: _Global.currSelectedDom,
        insertPosition: insertPosition,
        insertElement: insertElement,
      });
      if (!refDom && insertPosition !== "after") {
        // 更新插入位置
        Message.sendMessage({
          type: "update-insert-position",
          data: {
            msg: {
              insertPosition,
              componentId: component.componentId,
            },
          },
        });
      }
      if (!refId && pos && pos.x) {
        layoutElement.dispatchEvent(new MouseEvent('mousedown', {detail: 1000}))
        layoutElement.dispatchEvent(new MouseEvent('mouseup'))
        layoutElement.dispatchEvent(new MouseEvent('click'))
      }
      return;
    }
    var className = "";
    if (component.className instanceof Array) {
      className = component.className.map((item) => Utils.pascalToKebab(item));
    } else {
      className = Utils.pascalToKebab(component.className);
    }
    var properties = component.properties
    var copyProperties = Utils.safeJsonParse(Utils.safeJsonStringify(component.properties))
    var componentName = component.componentName;
    // properties转换
    var name = componentName instanceof Array ? componentName.join(",") : componentName
    // 自定义组件
    if (name.startsWith("Ai")) {
      copyProperties.forEach(item => {
        if(item.type === "json" || item.type === "style-json") {
          item.value = Utils.safeJsonParse(item.value);
        }
      })
    } else {
      copyProperties.forEach(i => {
        if (
          i.attr === "options" ||
          i.attr === "tabs" ||
          i.attr === "PropForParentdata" ||
          i.attr === "style" ||
          i.attr === "elstep" ||
          i.attr === "PropForParentstyle" ||
          i.attr === "dropdownOptions" ||
          i.attr === "breadcrumb" ||
          i.attr === "timelines" ||
          i.attr === "data" ||
          i.attr === "PropForParentmenu" ||
          i.attr === "collapseData" ||
          i.attr === "carouselData" ||
          i.attr === "descriptionsData" ||
          i.attr === "swipeData" ||
          i.attr === "gridData" || 
          i.attr === "sidebarData" ||
          i.attr === "tabbarData" || 
          i.attr === "items" ||
          i.attr === "tabData" ||
          i.attr === "colData" ||
          i.attr === "list" ||
          i.attr === "disabledList" ||
          i.attr === "PropForParentindexList" || 
          i.attr === "stepsData" ||
          i.attr === "list" || 
          i.attr === "contactInfo" ||
          i.attr === "columns" ||
          i.attr === "columnsFieldNames" || 
          i.attr === "vancolData"
        ) {
          i.value = Utils.safeJsonParse(i.value)
        }
      })
    }
    const componentList = component.componentName instanceof Array ? component.componentName : [component.componentName]
    // console.log("componentList====", 
    //   componentList, 
    //   componentParent, 
    //   copyProperties, 
    //   this.renderTemplate(
    //     className,
    //     properties,
    //     component?.forIndex || ""
    //   ),
    //   insertElement?.closest("[data-insp-path]")?.getAttribute("data-insp-path"),
    //   insertPosition
    // )
    var createComponent = UseRender.render.renderComponent(
      componentList, 
      componentParent, 
      copyProperties, 
      this.renderTemplate(
        className,
        properties,
        component?.forIndex || ""
      ),
      insertElement?.closest("[data-insp-path]")?.getAttribute("data-insp-path"),
      insertPosition,
      component?.componentId
    )
    // 选中节点
    Vue.nextTick(() => {
      // if (_Global.currSelectedDom) {
      //   _Global.currSelectedDom.classList.remove("dragging");
      // }
      if(component.componentName === "CodeBox") {
        Business.markSelectLine(createComponent.dataDom)
        // createComponent.dataDom.classList.add("dragging");
      } else {
        // layoutElement.classList.add("dragging");
        Business.markSelectLine(layoutElement)
        componentParent.appendChild(layoutElement);
      }
      if(component.componentName !== "CodeBox") {
        createComponent.dataDom.style.zIndex = "-1";
        createComponent.dataDom.style.position = "relative";
      }
      if (!refId && pos && pos.x) {
        if (component.componentName === "CodeBox") {
          createComponent.dataDom.dispatchEvent(new MouseEvent('mousedown', {detail: 1000}))
          createComponent.dataDom.dispatchEvent(new MouseEvent('mouseup'))
          createComponent.dataDom.dispatchEvent(new MouseEvent('click'))
        } else {
          layoutElement.dispatchEvent(new MouseEvent('mousedown', {detail: 1000}))
          layoutElement.dispatchEvent(new MouseEvent('mouseup'))
          layoutElement.dispatchEvent(new MouseEvent('click'))
        }
      }
      // 二次渲染需进行编号
      if (refId) {
        createComponent.dataDom.dataset.mark = refId;
      }
      if (component.componentName === "CodeBox") {
        _Global.currSelectedDom = createComponent.dataDom;
      } else {
        _Global.currSelectedDom = layoutElement;
      }
    });
    if (pos) {
      var elementNode = createComponent.dataDom;
      // 加入变更列表
      _Global.configDomList.push({
        component,
        componentId: component.componentId,
        pos,
        element: elementNode,
        type: "addComponent",
        styles: {
          // top: pos.y + "px",
          // left: pos.x + "px"
        },
        parentElement: componentParent,
        store: createComponent,
        targetElement: _Global.currSelectedDom,
        insertPosition: insertPosition,
        insertElement: insertElement,
      });
      if (!refDom && insertPosition !== "after") {
        // 更新插入位置
        Message.sendMessage({
          type: "update-insert-position",
          data: {
            msg: {
              insertPosition,
              componentId: component.componentId,
            },
          },
        });
      }
    }
    // 替换预览
    else {
      _Global.componentSaveTemp.store = createComponent;
      _Global.componentSaveTemp.component = component;
    }
  },
  // 根据属性生成template
  renderTemplate: function (tag, properties, forIndex) {
    const libName = this.getUiLib()
    const tempSourceCode = Business.renderTemplateSource(tag, properties, forIndex)
    /**
     * hzb-ui与element-ui共用一份配置文件
     * 故只改变渲染的标签名
     * 标签名变更后会适配对应的cdn资源进行渲染
     */
    if(libName === "Hzb-Ui") {
      return tempSourceCode.replace(/<el-/g, '<hzb-').replace(/<\/el-/g, '</hzb-')
    } else {
      return tempSourceCode
    }
  },
  renderTemplateSource: function (tag, properties, forIndex) {
    if (tag instanceof Array && tag.join(",").indexOf("el-menu") > -1) {
      var pProperties = properties.filter(
        (item) => item.attr.indexOf("PropForParent") > -1
      );
      var begin = `<div ref="domRef"><el-menu`;
      var end = `</el-menu></div>`;
      var parentContent = "";
      var content = "";
      var templateContent = "";
      // 拼接父组件属性
      pProperties.forEach((item) => {
        if (item.attr === "PropForParentmenu") {
          templateContent = item.value;
        }
        parentContent += ` :${item.attr.split("PropForParent")[1]}="${item.attr}" `;
      });
      parentContent += `>`;
      parentContent += this.generateMenuTemplate(JSON.parse(templateContent));
      return begin + content + parentContent + end;
    } else if (
      tag instanceof Array &&
      tag.join(",").indexOf("el-dropdown") > -1
    ) {
      // 父组件
      var pTag = tag[0];
      // 父组件属性
      var pProperties = properties.filter(
        (item) => item.attr.indexOf("PropForParent") > -1
      );
      // 子组件属性
      var cProperties = properties.filter(
        (item) => item.attr.indexOf("PropForParent") < 0
      );
      var defaultSlot = properties.filter(
        (item) => item.attr.indexOf("defaultSlot") > -1
      );
      var begin = `<div ref="domRef"><${pTag} `;
      var end = `</${pTag}></div>`;
      var content = "";
      // 拼接父组件属性
      pProperties.forEach((item) => {
        content += ` :${item.attr.split("PropForParent")[1]}="${item.attr}" `;
      });
      content += `><span>
            {{ defaultSlot }}
            <el-icon>
              <arrow-down />
            </el-icon>
          </span><template #dropdown>
          <el-dropdown-menu>
          <el-dropdown-item`;
        // 拼接子组件属性
        cProperties.forEach((item) => {
          if (item.attr.indexOf("EventFor") < 0) {
            if (item.attr === "dropdownOptions" && forIndex === 2) {
              content += ` v-for="item in dropdownOptions"`
            }
          }
        });
        content += `>{{item}}</el-dropdown-item></el-dropdown-menu></template>`
        return begin + content + end
    }
    else if(tag instanceof Array && tag.join(',').indexOf('el-table') > -1) {
      // 父组件
      var pTag = tag[0];
      // 子组件
      var cTag = tag[1];
      // 父组件属性
      var pProperties = properties.filter(
        (item) => item.attr.indexOf("PropForParent") > -1
      );
      // 子组件属性
      var cProperties = properties.filter(
        (item) => item.attr.indexOf("PropForParent") < 0
      );
      var begin = `<div ref="domRef"><${pTag} `;
      var end = `</${pTag}></div>`;
      var content = "";
      // 拼接父组件属性
      pProperties.forEach((item) => {
        if (item.attr === "PropForParentvModel") {
          content += ` v-model="PropForParentvModel"`;
        } else
          content += ` :${item.attr.split("PropForParent")[1]}="${item.attr}" `;
      });
      content += `>`;
      // 拼接子组件属性
      var tableProp = "";
      var tableLabel = "";
      cProperties.forEach((item) => {
        if (item.attr === "prop") {
          tableProp = item.value.split(",");
        }
        if (item.attr === "label") {
          tableLabel = item.value.split(",");
        }
      });
      if (tableProp.length === tableLabel.length) {
        tableProp.forEach((n, index) => {
          content += `<${cTag} prop="${tableProp[index]}" label="${tableLabel[index]}"`;
          cProperties.forEach((item) => {
            // if(item.attr === 'fixedFirst' && index === 0) {
            //   content += `  :fixed="${item.value ? true : false}"`
            // }
            // else if (item.attr === 'fixedLast' && index === tableProp.length - 1) {
            //   if (item.value) content += `  fixed="right"`
            //   else content += `  :fixed=false`
            // }
            // else
            if (item.attr !== "prop" && item.attr !== "label") {
              content += `  :${item.attr}="${item.attr}"`;
            }
          });
          content += `></${cTag}>`;
        });
      }
      return begin + content + end;
    } else {
      if (tag instanceof Array) {
        // 父组件
        var pTag = tag[0];
        // 子组件
        var cTag = tag[1];
        // 父组件属性
        var pProperties = properties.filter(
          (item) => item.attr.indexOf("PropForParent") > -1
        );
        // 子组件属性
        var cProperties = properties.filter(
          (item) => item.attr.indexOf("PropForParent") < 0
        );
        var begin = `<div ref="domRef"><${pTag} `;
        var end = `</${cTag}></${pTag}></div>`;
        var content = "";
        var textContent = ">";
        // 拼接父组件属性
        pProperties.forEach((item) => {
          if (item.attr === "PropForParentvModel") {
            content += ` v-model="PropForParentvModel"`;
          } else if (item.attr === "PropForParenttextLabel") {
            begin = `<div ref="domRef"><span style="padding: 0 10px;">{{PropForParenttextLabel}}:</span><${pTag} `;
          } else
            content += ` :${item.attr.split("PropForParent")[1]}="${item.attr}" `;
        });
        content += `><${cTag}`;
        // 拼接子组件属性
        if(tag.join(',').indexOf('el-') > -1) {
          cProperties.forEach((item) => {
            if (item.attr.indexOf("EventFor") < 0) {
              if (item.attr === "vModel") {
                content += ` v-model="vModel"`;
              } else if (item.attr === "textContent") {
                textContent += "{{textContent}}";
              } else if (item.attr === "options" && forIndex === 1) {
                content += ` v-for="item in options" :key="item.value" :value="item.value" :label="item.label"`;
              } else if (item.attr === "tabs" && forIndex === 1) {
                content += ` v-for="item in tabs" :key="item.name" :name="item.name" :label="item.title"`;
                textContent = `>{{item.content}}`;
              } else if (item.attr === "breadcrumb" && forIndex === 1) {
                content += ` v-for="item in breadcrumb" :to="item.to"`;
                textContent = `>{{item.content}}`;
              } else if (item.attr === "timelines" && forIndex === 1) {
                content += ` v-for="item in timelines" :key="item.timestamp" :timestamp="item.timestamp"`;
                textContent = `>{{item.content}}`;
              } else if (item.attr === "collapseData" && forIndex === 1) {
                content += ` v-for="item in collapseData" :title="item.title" :name="item.name"`;
                textContent = `>{{item.content}}`;
              } else if (item.attr === "carouselData" && forIndex === 1) {
                content += ` v-for="(item, index) in carouselData" :key="index"`;
                textContent = `><span v-html="item.content"></span>`;
              } else if (item.attr === "elstep" && forIndex === 1) {
                content += ` v-for="item in elstep" :title="item.title" :description="item.description"`;
              } else if (item.attr === "descriptionsData" && forIndex === 1) {
                content += ` v-for="item in descriptionsData" :label="item.label"`
                textContent =  `>{{item.content}}`
              } else if (item.attr === "colData" && forIndex === 1) {
                content += ` v-for="item in colData" :span="item.span" :offset="item.offset" :push="item.push" :pull="item.pull"`;
                textContent =  `><div style="border-radius: 4px;min-height: 36px;border: 1px solid #dcdfe6;"></div>`
              } else {
                content += ` :${item.attr}="${item.attr}" `;
              }
            }
          });
        } else {
          cProperties.forEach((item) => {
            if (item.attr.indexOf("EventFor") < 0) {
              if (item.attr === "vModel") {
                content += ` v-model="vModel"`;
              } else if (item.attr === "textContent") {
                textContent += "{{textContent}}";
              } else if (item.attr === "collapseData" && forIndex === 1) {
                content += ` v-for="item in collapseData" :title="item.title" :name="item.name"`;
                textContent = `>{{item.content}}`;
              } else if (item.attr === "swipeData" && forIndex === 1) {
                content += ` v-for="(item, index) in swipeData" :key="index"`;
                textContent = `><div>{{ item.content }}</div>`;
              } else if (item.attr === "gridData" && forIndex === 1) {
                content += ` v-for="(item, index) in gridData" :key="index" :text="item.text" :icon="item.icon" :dot="item.dot" :badge="item.badge" :to="item.to" :url="item.url"`;
              } else if (item.attr === "sidebarData" && forIndex === 1) {
                content += ` v-for="(item, index) in sidebarData" :key="index" :title="item.title" :disabled="item.disabled" :dot="item.dot" :badge="item.badge" :to="item.to" :url="item.url"`;
              } else if (item.attr === "tabbarData" && forIndex === 1) {
                content += ` v-for="(item, index) in tabbarData" :key="index" :name="item.name" :icon="item.icon" :dot="item.dot" :badge="item.badge" :to="item.to" :url="item.url"`;
                textContent = `><span>{{ item.title }}</span>`;
              } else if (item.attr === "tabData" && forIndex === 1) {
                content += ` v-for="(item, index) in tabData" :key="index" :name="item.name" :title="item.title" :dot="item.dot" :badge="item.badge" :to="item.to" :url="item.url"`;
                textContent = `><span>内容{{index + 1}}</span>`;
              } else if (item.attr === "stepsData" && forIndex === 1) {
                content += ` v-for="(item, index) in stepsData" :key="index"`;
                textContent = `><span>{{item.content}}</span>`;
              } else if (item.attr === "vancolData" && forIndex === 1) {
                content += ` v-for="(item,index) in vancolData" :span="item.span" :offset="item.offset"`;
                textContent =  `><div style="border-radius: 4px;min-height: 36px;border: 1px solid #66c6f2;display: flex;align-items: center;justify-content: center;"><span>{{ index + 1 }}</span></div>`
              } else {
                content += ` :${item.attr}="${item.attr}" `;
              }
            }
          });
        }
      } else {
        if (tag.indexOf("el-slider") > -1) {
          var begin = `<div ref="domRef"><${tag} `;
          var end = `</${tag}></div>`;
          var content = "";
          var textContent = ">";
          var iconContent = "";
          properties.forEach((item) => {
            if (item.attr.indexOf("EventFor") < 0) {
              if (item.attr === "vModel") {
                content += ` v-model="vModel"`;
              } else if (item.attr.indexOf("VModel") > -1) {
                var bindValue = item.attr.split("VModel")[1]
                  ? `:${item.attr.split("VModel")[1]}`
                  : "";
                content += `v-model${bindValue}="${item.attr}"`;
              } else if (item.attr === "textContent") {
                textContent += "{{textContent}}";
              } else if (item.attr === "labelContent") {
                begin = `<div ref="domRef" style="width: 300px;display: flex;align-items: center;"><span style="width: 50px;">{{ labelContent }}</span><${tag} `;
              } else {
                content += ` :${item.attr}="${item.attr}" `;
              }
            }
          });
        } else {
          // element-ui下icon单独渲染
          if(_Global.uiLib === "element-ui" && tag === "el-icon") return "<i ref='domRef' :class='IconSlotFordefault'></i>"
          if(_Global.uiLib === "hzb-ui" && tag === "hzb-icon") return `<i ref='domRef' :class='IconSlotFordefault'></i>`
          var begin =
            tag === "input"
              ? `<${tag} type="hidden" ref="domRef" `
              : `<${tag} ref="domRef" `;
          var end = `</${tag}>`;
          var content = "";
          var textContent = ">";
          var iconContent = "";
          properties.forEach((item) => {
            if (item.attr.indexOf("EventFor") < 0) {
              if (item.attr === "vModel") {
                content += ` v-model="vModel"`;
              } else if (item.attr.indexOf("VModel") > -1) {
                var bindValue = item.attr.split("VModel")[1]
                  ? `:${item.attr.split("VModel")[1]}`
                  : "";
                content += `v-model${bindValue}="${item.attr}"`;
              } else if (item.attr === "vModelMainActiveIndex") {
                content += ` v-model:main-active-index="vModelMainActiveIndex"`;
              } else if (item.attr === "vModelActiveId") {
                content += ` v-model:active-id="vModelActiveId"`;
              } else if (item.attr === "textContent") {
                textContent += "{{textContent}}";
              } else {
                content += ` :${item.attr}="${item.attr}" `;
              }
            }
            if (item.attr.indexOf("IconSlotFor") > -1) {
              if(_Global.uiLib === "hzb-ui" || _Global.uiLib === "element-ui") {
                content += `:class="${item.attr}"`
              } else {
                iconContent = `<template #${item.attr.split("IconSlotFor")[1]}>
                  <component :is="${item.attr}"></component>
                </template>`;
              }
            }
            if (item.attr.indexOf("CommonSlotFor") > -1) {
              iconContent = `<template #${item.attr.split("CommonSlotFor")[1]}>
              <div>{{${item.attr}}}</div>
            </template>`;
            }
          });
        }
      }
      return begin + content + textContent + (iconContent || '') + end
    }
  },
  // 更新组件属性
  updateProps: function (key, value, componentId, isJson, unitValue, needRender) {
    // 同步消息至源码容器
    window._Global.currentIframe?.contentWindow.postMessage(Utils.safeJsonStringify({
      msg: {
        key, 
        value, 
        componentId, 
        isJson,
        unitValue,
        needRender
      },
      type: "update-props"
    }), "*")
    /**
     * 适配element-ui下icon处理
     */
    // if(_Global.uiLib === "element-ui" && key.indexOf("IconSlotFor") > -1) {
    //   // 1.检测是否注册
    //   if(!Utils.isWebComponent(value)) {
    //     // 2.进行注册
    //     Utils.registerWebComponent(value)
    //   }
    // }
    // 暂存组件更新
    if (_Global.componentSaveTemp.store) {
      _Global.componentSaveTemp.store.setDataValue(Utils.kebabToCamel(key), value)
      return;
    }
    // 交互组件 直接更新
    if (_Global.actionComponentApp) {
      var cIndex = _Global.configDomList.findIndex(
        (item) => item.component && item.component.componentId === componentId
      );
      if (cIndex > -1 && _Global.configDomList[cIndex].triggerEvent) {
        _Global.actionComponentApp._instance.proxy[Utils.kebabToCamel(key)] =
          value;
        return;
      }
    }
    var element = _Global.currSelectedDom;
    if (
      _Global.currSelectedDom &&
      _Global.currSelectedDom.parentElement &&
      _Global.currSelectedDom.parentElement.getAttribute("data-parent") ===
        "component-wrap"
    ) {
      element = _Global.currSelectedDom.parentElement.children[0];
    }
    var index = _Global.configDomList.findIndex(
      (item) => {
        if(element.getAttribute("component-mark-id")) {
          return item.element === element && item.componentId === componentId
        } else {
          return item.element === element
        }
      }
    );
    if (index < 0) {
      index = _Global.replaceDomList.findIndex((item) => {
        const itemEle = item.store.dataDom;
        return itemEle === element;
      });
      // 替换组件更新
      if (index > -1) {
        _Global.replaceDomList[index].store.setDataValue(Utils.kebabToCamel(key), value)
      }
    } else {
      // 响应式组件更新
      if (_Global.configDomList[index].store.setDataValue) {
        _Global.configDomList[index].store.setDataValue(Utils.kebabToCamel(key), isJson ? Utils.safeJsonParse(value) : value)
      }
      // 非响应式组件更新 如: echarts图表
      else {
        if(key === "options") {
          _Global.configDomList[index].store.instance.setOption(Utils.safeJsonParse(value))
          // 同步更新存储
          _Global.configDomList[index].store.data[key] = value;
        } else if (key === "width" || key === "height") {
          const val = Utils.paddingUnits(value);
          // 只响应有效变更
          if (val) {
            _Global.configDomList[index].store.box.style[key] = val;
            _Global.configDomList[index].store.instance.resize({
              [key]: val,
            });
            // 同步更新存储
            _Global.configDomList[index].store.data[key] = value;
          }
        }
      }
    }
  },
  //保存DOM节点并保存内存数据
  saveDomAndMemory: function () {
    var saveConfigDomList = [];
    // 对变更节点进行编号
    window._Global.configDomList.forEach((item, index) => {
      // 判断是否存在对应属性 存在则取出 不存在则赋值
      if (!item.element.getAttribute("data-mark")) {
        item.element.dataset.mark = `element${Date.now()}${index}`;
      }
      if (item.type === "addComponent") {
        if (!item.insertElement.getAttribute("data-insert")) {
          item.insertElement.dataset.insert = `insertElement${Date.now()}${index}`;
        }
      }
      var newItem = {
        ...item,
        element: item.element.getAttribute("data-mark"),
      };
      if (item.type === "addComponent") {
        newItem.insertElement = item.insertElement.getAttribute("data-insert");
      }
      if (item.type === "actionComponent") {
        newItem.eventElement = item.eventElement.getAttribute("data-event");
      }
      saveConfigDomList.push(newItem);
    });
    var allHtml = document.getElementById("app").innerHTML;
    const now = new Date();
    const timeStr = now
      .toLocaleTimeString("zh-CN", {
        hour12: false, // 24小时制
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
      .replace(/:/g, "-");
    let saveDomObject = {
      time: timeStr,
      html: allHtml,
      version: `V${saveHistoryArr.length + 1}`,
    };
    // 记录版本数据  保存操作为版本号自增 故可直接push
    _Global.historyActionArr.push({
      delDomList: [...window._Global.delDomList],
      configDomList: [...saveConfigDomList],
    });
    saveHistoryArr.push(saveDomObject);
  },
  //清楚内存中的key
  clearSaveHistory: function () {
    saveHistoryArr = [];
  },
  renderDomAndMemory: function (data) {
    let tempVersion = null;
    for (let i = 0; i < saveHistoryArr.length; i++) {
      if (saveHistoryArr[i].version === data.version) {
        tempVersion = saveHistoryArr[i];
        break;
      }
    }
    // 存在记录版本号
    if (tempVersion) {
      var versionIdx = data.version.split("V")[1] - 1;
      var delDomList = [..._Global.historyActionArr[versionIdx].delDomList];
      var configDomList = [
        ..._Global.historyActionArr[versionIdx].configDomList,
      ];
      // 先还原dom节点 便于后续重新链接
      document.getElementById("app").innerHTML = tempVersion.html;
      // 清空状态数据
      window._Global.delDomList = delDomList.concat();
      window._Global.configDomList = [];
      // 建立链接关系
      configDomList.forEach((item, index) => {
        var newItem = {
          type: item.type,
          styles: item.styles,
        };
        const elementId = item.element;
        var findElement = document.querySelector(`[data-mark="${elementId}"]`);
        newItem.element = findElement;
        if (item.type === "addComponent") {
          var findInsertElement = document.querySelector(
            `[data-insert="${item.insertElement}"]`
          );
          newItem.insertElement = findInsertElement;
          // 重新渲染组件
          var initComponents = data.initComponents;
          var currComponent = initComponents[item.componentId];
          var layoutElementId =
            item.parentElement.lastElementChild.getAttribute("data-event");
          if (currComponent) {
            // 销毁失效组件
            findElement.parentNode.remove();
            // 配置列表中移除
            window._Global.configDomList.splice(index, 1);
            // 重新生成
            this.renderComponent(
              currComponent,
              item.pos,
              findInsertElement,
              item.insertPosition,
              elementId,
              layoutElementId
            );
          }
        } else if (item.type === "actionComponent") {
          var itemInterval = setInterval(function () {
            var findEventElement = document.querySelector(
              `[data-event="${item.eventElement}"]`
            );
            if (findEventElement) {
              Business.renderActionComponent(item.component, findEventElement);
              clearInterval(itemInterval);
              itemInterval = null;
            }
          }, 20);
        } else {
          window._Global.configDomList.push(newItem);
        }
      });
    }
  },
  // 组件位置变更
  changeAppendPosition: function (value = "end") {
    // 切换插入位置代理至源码容器
    if(window._Global.iframes.length > 0) {
      window._Global.iframes.forEach(itemId => {
        document.getElementById(itemId)?.contentWindow.postMessage(Utils.safeJsonStringify({
          type: "change-insert-position",
          value
        }), "*")
      })
    }
  },
  doChangeAppendPosition: function (value = "end", tree = []) {
    var element = _Global.currSelectedDom;
    var index = _Global.configDomList.findIndex(
      (item) =>
        item.parentElement && item.parentElement.lastElementChild === element
    );
    var parentElement = _Global.configDomList[index].parentElement;
    var insertElement = _Global.configDomList[index].insertElement;
    // 只变更dom节点位置  不需初始化组件
    _Global.configDomList[index].component.appendPosition = value;
    _Global.configDomList[index].insertPosition = value;
    if (value === "before") {
      insertElement.parentNode.insertBefore(parentElement, insertElement);
    } else if (value === "after") {
      insertElement.parentNode.insertBefore(
        parentElement,
        insertElement.nextSibling
      );
    } else if (value === "in-before") {
      insertElement.prepend(parentElement);
    } else if (value === "in-after") {
      insertElement.appendChild(parentElement);
    }
    window._Global.reRenderMsg = {
      value,
      tree
    }
  },
  doReRender () {
    if(window._Global.reRenderMsg && window._Global.iframes.length > 0) {
      window._Global.iframes.forEach(itemId => {
        document.getElementById(itemId)?.contentWindow.postMessage(Utils.safeJsonStringify({
          type: "restore",
          ...window._Global.reRenderMsg
        }), "*")
      })
    }
    // 消费后释放
    window._Global.reRenderMsg = null
  },
  // 高亮显示当前hover元素
  updateHoverDom: function (pos = {}) {
    var element = Utils.getElementAtPosition(pos.x, pos.y);
    if (!element) return;
    // if (_Global.currHoverDom) {
    //   _Global.currHoverDom.classList.remove("on-hover");
    // }
    // element.classList.add("on-hover");
    Business.hoverWithHighlight(element)
    _Global.currHoverDom = element;
  },
  // 初始版本记录添加控制
  initVersionController: function () {
    var versionInter = setInterval(() => {
      var app = document.body;
      if (app && app.innerHTML.length > 600) {
        clearInterval(versionInter);
        Business.saveDomAndMemory();
      }
    }, 10);
  },
  // 撤销同一个版本内的当前操作
  revoke: function () {
    const currentNode = document.querySelector(".dragging")
    if(currentNode) {
      const [ , , styles ] = Utils.styleToJson(currentNode?.getAttribute("style"))
      const nativeStyles = Utils.safeJsonParse(currentNode?.getAttribute("data-native-pos"))
      let newStyles = {...styles}
      delete newStyles.left
      delete newStyles.top
      delete newStyles.position
      const rebackStyles = {
        ...newStyles,
        ...nativeStyles
      }
      const endStyle = Utils.jsonToStyle(rebackStyles)
      if(endStyle) {
        currentNode.setAttribute("style", endStyle)
      } else {
        currentNode.removeAttribute("style")
      }
      this.markSelectLine(currentNode)
    }
    
    // console.log(currentNode)
    //     .querySelector(".dragging")
    // if (window._Global.whenClickDOM) {
    //   document
    //     .querySelector(".dragging")
    //     .replaceWith(window._Global.whenClickDOM);
    //   window._Global.whenClickDOM = null;
    //   _Global.configDomList.pop();
    //   //更新删除按钮位置
    // }
  },
  /**
   * 替换组件
   * @param {*} component
   */
  replaceComponent: function (component) {
    // 先判断是否已有预览 若有 先执行销毁
    Business.cancelReplace(false)
    Vue.nextTick(() => {
      this.renderComponent(component, null);
      // 隐藏替换元素
      if (_Global.currSelectedDom) {
        _Global.componentSaveTemp.dom = _Global.currSelectedDom;
        _Global.currSelectedDom.style.display = "none";
      }
    })
  },
  // 取消替换
  cancelReplace: function (needClick = true) {
    const componentObj = _Global.componentSaveTemp;
    if (componentObj.dom && componentObj.component) {
      // 显示隐藏元素
      componentObj.dom.style.display = "";
      // 移除mark标记
      componentObj.dom.removeAttribute("data-mark");
      // 销毁预览组件
      componentObj.store.unmount();
      componentObj.dom.nextElementSibling.remove();
      if(needClick) {
        // 选中
        this.clickFoucus(componentObj.dom);
      } else {
        _Global.currSelectedDom = componentObj.dom
      }
      // 清空暂存
      _Global.componentSaveTemp = {};
    }
  },
  // 确认组件替换
  confirmReplace: function (componentId) {
    const componentObj = _Global.componentSaveTemp;
    if (componentObj.dom && componentObj.component) {
      // 移除被替换节点
      componentObj.dom.remove();
      let newObj = _Global.componentSaveTemp;
      // 添加组件标识
      newObj.component.componentId = componentId;
      _Global.componentSaveTemp = {};
      _Global.replaceDomList.push(newObj);
      // 默认选中组件
      const itemEle = _Global.replaceDomList[_Global.replaceDomList.length - 1].store.dataDom
      this.clickFoucus(itemEle.nextElementSibling);
      // 触发ai编码
      Business.renderPrompt();
    }
  },
  // 解析elmenu结构
  generateMenuTemplate: function (menuData) {
    const renderItems = (items, level = 0) => {
      return items
        .map((item) => {
          const indent = "  ".repeat(level);
          const innerIndent = "  ".repeat(level + 1);

          // 判断是否是分组项
          if (item.groupTitle) {
            return `${indent}<el-menu-item-group title="${item.groupTitle}">
  ${renderItems(item.children, level + 1)}
  ${indent}</el-menu-item-group>`;
          }
          // 判断是否有子菜单
          else if (item.children) {
            return `${indent}<el-sub-menu index="${item.index}"${item.disabled ? " disabled" : ""}>
  ${innerIndent}<template #title>
  ${item.icon ? `${innerIndent}  <el-icon><${item.icon} /></el-icon>` : ""}
  ${innerIndent}  <span>${item.title}</span>
  ${innerIndent}</template>
  ${renderItems(item.children, level + 1)}
  ${indent}</el-sub-menu>`;
          }
          // 普通菜单项
          else {
            return `${indent}<el-menu-item index="${item.index}"${item.disabled ? " disabled" : ""}>
  ${item.icon ? `${innerIndent}<el-icon><${item.icon} /></el-icon>` : ""}
  ${innerIndent}<span>${item.title}</span>
  ${indent}</el-menu-item>`;
          }
        })
        .join("\n");
    };

    return `
  ${renderItems(menuData, 1)}
  </el-menu>`;
  },
  // 监听视窗变化 -- 工具栏适配
  addWinResize: function () {
    // 带防抖的基础监听
    function handleResize() {
      if(_Global.currSelectedDom) {
        Business.markSelectLine(_Global.currSelectedDom)
      }
    }
    window.addEventListener('resize', Utils.debounce(handleResize, 300));
  },
  // 获取UI库
  getUiLib: function () {
    const uiLib = _Global.uiLib
    if(uiLib === "element-ui") return "Element-Ui"
    if(uiLib === "element-plus") return "Element-Plus"
    if(uiLib === "vant") return "Vant4"
    if(uiLib === "hzb-ui") return "Hzb-Ui"
    return "Vant4"
  },
    /**
   * Hz包裹第三方库检测 -- vue2版本
   */
  checkIsHzLib: function () {
    // 1. 获取根 Vue 实例
    const root = document.querySelector('#app') && document.querySelector('#app').__vue__;
    if (!root) {
      // console.warn('未找到 Vue 根实例');
    } else {
      // 2. 递归查找全局 Vue 构造函数
      let VueCtor = root.constructor;
      while (VueCtor.super) {
        VueCtor = VueCtor.super;
      }
      // 3. 获取全局注册组件
      const globalComponents = VueCtor.options.components;
      // 4. 转换数组
      const globalComponentsList = Object.keys(globalComponents)
      // 5. 特性检测 -- 多组件检测 尽量避免误判
      if(globalComponentsList.indexOf("HzButton") > -1 && globalComponentsList.indexOf("HzButtonGroup") > -1 && globalComponentsList.indexOf("HzCascaderPanel") > -1) {
        _Global.isHzWrapper = true
      }
    }
  },
  /**
   * 日期格式版本转换器
   * @param {string} format - 原始格式字符串
   * @param {'ui2plus'|'plus2ui'|'auto'} mode - 转换模式
   * @returns {string} 转换后的格式字符串
   */
  convertDateFormat: function(format, mode = 'auto') {
    // 版本特征检测（自动模式）
    if (mode === 'auto') {
      mode = format.includes('YYYY') ? 'plus2ui' : 'ui2plus'
    }

    // 核心转换规则
    const rules = {
      ui2plus: [
        [/(yyyy)/g, 'YYYY'],  // 年
        [/(dd)/g, 'DD'],      // 日
        [/(HH)/g, 'hh'],      // 12小时制
        [/(h)/g, 'H'],        // 24小时制
        [/(mm)/g, 'MM'],      // 月份
        [/(ss)/g, 'SS'],      // 秒
        [/(tt)/g, 'A']        // AM/PM
      ],
      plus2ui: [
        [/(YYYY)/g, 'yyyy'],
        [/(DD)/g, 'dd'],
        [/(hh)/g, 'HH'],
        [/(H)/g, 'h'],
        [/(MM)/g, 'mm'],
        [/(SS)/g, 'ss'],
        [/(A)/g, 'tt']
      ]
    }

    // 执行转换
    let result = format
    rules[mode].forEach(([regex, replacement]) => {
      result = result.replace(regex, replacement)
    })

    return result
  },
  /**
   * 获取组件名称
   * @param {Array||String} component
   */
  getComponentName: function (component) {
    let componentName = component
    if(Array.isArray(component)) {
      const fullComponentName = component[0]
      // element-ui需要消除前缀
      if(fullComponentName.startsWith("El")) {
        componentName = fullComponentName.slice(2)
      } else {
        componentName = fullComponentName
      }
    } else {
      if(component.startsWith("El")) {
        componentName = component.slice(2)
      }
    }
    return componentName
  },
  // 收集源码
  receiveCode (result, prompt) {
    window._Global.storageCode.push({
      result,
      prompt,
    })
    // 当为最后一条消息时 生成最终提示词
    if(window._Global.storageCode.length === window._Global.iframes.length && window._Global.iframes.length > 0) {
      if(window._Global.storageCode.length > 0) {
        window._Global.storageCode.forEach(item => {
          if (window._Global.storageMsg && window._Global.storageMsg.data && item.result === "successed") {
            window._Global.storageMsg.data.prompt += item.prompt
          }
        })
      }
      Message.sendMessage(window._Global.storageMsg);
      // 消费完后释放
      window._Global.storageMsg = ""
      window._Global.storageCode = []
    }
  },
  hoverCodeBox (selector) {
    const element = document.getElementById(selector)
    element.dispatchEvent(new MouseEvent('mousedown', {
      detail: 1000
    }))
    element.dispatchEvent(new MouseEvent('mouseup'))
    element.dispatchEvent(new MouseEvent('click'))
  },
  removeButtonDisabled () {
    const disabledButtons = document.querySelectorAll('button[disabled]')
    Array.from(disabledButtons).forEach(itemButton => {
      itemButton.removeAttribute("disabled")
    })
  },
  // 预览&编辑模式切换
  toggleMode (mode = "preview") {
    // 判断是否需要进行模式切换
    const currentMode = window._Global.currentMode
    const newValue = mode === "preview" ? "disable" : "enable"
    const currentValue = currentMode === "preview" ? "disable" : "enable"
    window._Global.currentMode = mode
    if(newValue === currentValue) return 
    Business.addDragStyles(mode);
    Business.hijackRouterAdapter(mode);
    if (mode === "preview") {
      // 卸载事件监听
      if (_Global.eventHandlers) {
        _Global.eventHandlers()
        _Global.eventHandlers = null
      }
      Business.clearSelectLine()
      Business.clearHighlight()
    } else {
      _Global.eventHandlers = Business.enableUniversalDrag();
      Business.removeButtonDisabled()
    }
  },
  // 记录设计的原始描述文案
  markDesignMsg: function (txt, type = "default") {
    if(window._Global.currentDesignDom) {
      const posDesc = window._Global.currentDesignDom.closest("[data-insp-path]")?.getAttribute("data-insp-path")
      const saveMsg = `${posDesc}变更如下:${txt}`
      // 记录或清空描述信息
      if(!txt || txt === "") {
        window._Global?.currentDesignDom?.removeAttribute("data-design-msg") // setAttribute("data-design-msg", saveMsg)
        window._Global?.currentDesignDom?.classList.remove("has-canvas-comment");
      } else {
        window._Global?.currentDesignDom?.setAttribute("data-design-msg", saveMsg)
        // 生成修改标记
        window._Global.currentDesignDom.classList.add("has-canvas-comment");
      }
    }
  },
  // 生成设计提示词
  renderDesignPrompt: function () {
    // 获取所有设计节点
    const designDoms = document.getElementsByClassName('has-canvas-comment')
    let designPrompt = []
    if(designDoms && designDoms.length > 0) {
      Array.from(designDoms).forEach(item => {
        const itemPrompt = item.getAttribute("data-design-msg")
        const apiConfigText = item.getAttribute("data-api-config")
        let apiConfig = {}
        if(apiConfigText) {
          const [method, url, contentType, requestData, responseData, comment] = apiConfigText.split("|")
          apiConfig = {
            method, 
            url, 
            contentType, 
            requestData, 
            responseData,
            comment
          }
        }
        designPrompt.push({
          path: itemPrompt?.split("变更如下:")[0] || item.closest("[data-insp-path]")?.getAttribute("data-insp-path") || "",
          description: itemPrompt?.split("变更如下:")[1] || "",
          apiConfig
        })
      })
    }
    if(designPrompt?.length > 0) {
      const msg = {
        type: 'report-design',
        data: {
          text: designPrompt
        }
      }
      Message.sendMessage(msg);
    } else {
      Message.sendMessage({
        type: 'alert-msg',
        text: '当前无设计内容,请设计后再进行提交!',
        msgType: 'warning'
      });
    }
  },
  showEventsList: function (type = "default") {
    const events = _Global?.currentNodeEvents || []
    if(type === "clear") {
      _Global.designInput.setAttribute("events", "[]")
    } else {
      _Global.designInput.setAttribute("events", events)
    }
  },
  // 模拟点击 选中上级节点
  clickTopNode: function () {
    const currentNode = _Global.currSelectedDom 
    if(currentNode) {
      // 若当前节点为app节点 给出提示
      if(currentNode?.id === "app") return  Message.sendMessage({
        type: 'alert-msg',
        text: '已经是最顶层节点了!',
        msgType: 'warning'
      });
      const parentNode = currentNode?.parentElement
      parentNode.dispatchEvent(new MouseEvent('mousedown', {
        detail: 1000
      }))
      parentNode.dispatchEvent(new MouseEvent('mouseup'))
      parentNode.dispatchEvent(new MouseEvent('click')) 
    } else {
      return  Message.sendMessage({
        type: 'alert-msg',
        text: '未获取到当前选中节点!',
        msgType: 'warning'
      });
    }
  },
  routeGo: function (action) {
    try {
      switch (action) {
        case "back":
          window.history.back()
          break;
        case "forward":
          window.history.forward()
          break;
        case "reload":
          window.location.reload()
          break;
        default:
          console.warn('未知的路由操作:', action);
      }
    } catch (error) {
      console.error('路由操作失败:', error);
    }
  },
  addToMultiList: function () {
    const target = _Global.currSelectedDom
    if(!_Global.multiNodes.includes(target)) {
      _Global.multiNodes.unshift(target)
    } else {
      // 若存在 调整位置
      const currIdx = _Global.multiNodes.findIndex(item => item === target)
      _Global.multiNodes.splice(currIdx, 1)
      _Global.multiNodes.unshift(target)
    }
    _Global?.editToolbar?.setAttribute("is-multi-select", "enable")
    // 隐藏基础配置开关
    Message.sendMessage({
      type: "toggle-multi-select",
      data: {
        value: true
      }
    });
    const allNodes = _Global.multiNodes || []
    const allNodesInfo = allNodes.map(ele => {
      return {
        tagName: ele.tagName,
        className: ele.className.replace("dragging", "")
      }
    })
    this.editInputCtrl("selectNodes", allNodesInfo)
  },
  // 根据模式 展示对应的输入框
  adapterModeInput: function (target) {
    const currentMode = window._Global.currentMode
    if(currentMode === "edit") return this.showEditInput()
    if(currentMode === "design") return this.toggleDesignInput(target)
  }, 
  showEditInput: function () {
    const allNodes = _Global.multiNodes || []
    const allNodesInfo = allNodes.map(ele => {
      return {
        tagName: ele.tagName,
        className: ele.className.replace("dragging", "")
      }
    })
    const msg = {
      selectNodes: allNodesInfo,
      show: true,
      empty: Date.now()
    }
    this.editInputCtrl("json", msg)
  },
  editInputCtrl: function (type, value) {
    // if(type === "json") {
    //   _Global.editInput.setAttribute("config-obj", Utils.safeJsonStringify(value))
    // } else {
    //   const msg = {
    //     [type]: value
    //   }
    //   _Global.editInput.setAttribute("config-obj", Utils.safeJsonStringify(msg))
    // }
  },
  toggleDesignInput: function (target) {
    const currentVisibility = _Global.designInput.getAttribute("visibility")
    window._Global.currentDesignDom = target
    const designPrompt = target.getAttribute("data-design-msg")
    const designMsg = designPrompt?.split("变更如下:")[1] || ""
    _Global.designInput.setAttribute("msg", designMsg)
    _Global.designInput.setAttribute("visibility", currentVisibility === "hidden" ? "visible" : "hidden")
  }
}
