/**
 * 通讯模块
 */
window.Message = {
  // 开启消息订阅
  addMessageListener: function () {
    window.addEventListener("message", (event) => {
      // 只响应自定义事件(如webpack相关事件直接return)
      if (event.data.type) return;
      var data = Utils.safeJsonParse(event.data);
      if (!data) return;
      var type = data.type;
      /**
       * 消息结构体
       * {
       *   // create-component: 创建组件 render-prompt: 生成prompt
       *   // update-attrs: 更新style delete-dom: 删除元素
       *   type: "create-component",
       *   data: {} // 消息内容
       * }
       */
      switch (type) {
        // 获取修改数据
        case "get-dom-list":
          Business.getDomList();
          break;
        // 清空修改数据
        case "clear-dom-list":
          _Global.configDomList = [];
          break;
        // 清除元素选中状态
        case "clear-dom-select":
          Business.clearSelectLine();
          Business.clearHighlight();
          break;
        case "create-component":
          var data = data.data
          var pos = data && data.pos || ""
          var component = data && data.component || ""
          var type = data && data.type || ""
          const action = data && data.action || ""
          const parentId = data && data.parentId || ""
          Business.createComponent(pos, component, type, action, parentId);
          // vue2Sandbox
          // console.log(document.getElementById("vue2Sandbox"), "1111")
          // document.getElementById("vue2Sandbox").contentWindow.postMessage(event.data, "*")
          break;
        case "render-prompt":
          Business.adapterSubmit();         
          break;
        case "update-attrs":
          var style = data.style;
          Business.updateAttrsAdapter(style.key, style.value)
          break;
        case "delete-dom":
          Business.deleteAdapter(data.data);
          break;
        case "update-props":
          var data = data.data;
          Business.updateProps(data.key, data.value, data.componentId, data.isJson, data.unitValue, data.needRender);
          break;
        case "save-dom":
          Business.saveDomAndMemory();
          break;
        case "render-dom":
          var data = data.data;
          Business.renderDomAndMemory(data);
          break;
        case "remove-history":
          Business.clearSaveDomInLocalStorage();
        case "update-hover-dom":
          var data = data.data;
          Business.updateHoverDom(data.pos);
          break;
        case "revoke":
          Business.revoke();
          break;
        // 接受复制
        case "accept-copy":
          Business.acceptCopy();
          break;
        // 组件替换--预览
        case "replace-dom":
          var data = data.data;
          Business.replaceComponent(data.component);
          break;
        // 取消组件替换
        case "cancel-replace":
          Business.cancelReplace();
          break;
        // 确认组件替换
        case "confirm-replace":
          var componentId = data.data.componentId
          Business.confirmReplace(componentId);
          break;
        case "shift-on":
            _Global.shiftOn=true
            // 如果用户按shift的时候，已经有选中的DOM，需要加入进来
            if(_Global.currSelectedDom){
              _Global.whenShfitOnDom.push(_Global.currSelectedDom)
            }
            break;
        case "shift-off":
            _Global.shiftOn=false
            break;
        // 画布元素聚焦
        case "click-foucus":
          Business.clickFoucus();

        /**
         * 以下为监听源码容器沙箱消息
         */
        
        case "report-component-props":
          /**
           * 上报组件属性
           * 画布直接代理至画布容器
           */
          const propsMsg = {
            data: {
              currCptIdx: data.data.componentId,
              attrs: {},
              styles: {}
            },
            type: "report-attrs", // 回显属性
          };
          window._Global.currentIframe = document.getElementById(data.data.selector)
          this.sendMessage(propsMsg);
          break;
        // 打开源码组件配置面板  
        case "action-right":
          this.sendMessage(data)
          break; 
        // 接收源码
        case "report-code": 
          Business.receiveCode(data.data.result, data.data.prompt)
          break;
        case "hover-code-box": 
          Business.hoverCodeBox(data.data.selector)
          break;
        case "toggle-mode": 
          Business.toggleMode(data.data)
          break;
        // 刷新嵌入源码项目
        case "request-reload-page": 
          this.sendMessage(data)
          break;
        case "report-component-tree":
          Business.doChangeAppendPosition(data.data.value, data.data.tree)
          break;
        case "sourcecode-loaded":
          Business.doReRender()
          break;
        case "update-mock-cookie":
          window.sessionStorage.setItem("mockCookie", data.data.cookie)
          if (data.data.operno && data.data.moaLoginUrl) {
            window.sessionStorage.setItem("ttMockData", Utils.safeJsonStringify({
              operno: data.data.operno,
              moaLoginUrl: data.data.moaLoginUrl
            }, ""))
          }
          // cookie写入通知更新页面
          this.sendMessage({
            type: "restart-serve"
          })
          break;
        case "get-tt-mock-data":
          var ttMockData = window.sessionStorage.getItem("ttMockData")
          this.sendMessage({
            type: "old-tt-mock-data",
            data: Utils.safeJsonParse(ttMockData)
          })
          break;
        // dom配置回滚
        case "reset-dom" :
          Business.resetDom()
          break;
        case "route-go":
          var routeAction = data.data.action
          Business.routeGo(routeAction)
          break;
        default:
          break;
      }
    });
  },
  // 父容器发送消息
  sendMessage: function (msg = {}) {
    /**
     * msg结构
     * {
     *   type: 
     *    "", 
     *    /** 1、report-prompt: 上报prompt 
     *    * 2、report-attrs: 上报dom信息
     *    * 3、do-copy: 复制操作询问确
     *    * 4、open-code: 打开代码块 
     *    ** /
     *   data: {} 消息体
     * }
     */
    window.parent.postMessage(Utils.safeJsonStringify(msg), "*");
  },
};
