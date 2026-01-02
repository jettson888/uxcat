/**
 * 画布区域装载器
 * 具体包含功能如下:
 * 1、判断是否为画布来决定是否装载对应类
 * (AI生成的工程化项目中强制加载此js文件,
 * 是否状态画布相关类,于此进行判断)
 * 2、加载依赖包(vue、vant、element-plus、@element-plus-icons-vue,后续会拓展react体系)
 * 3、加载画布实现的业务类、工具类、全局变量等
 */

/**
 * 加载网络资源方法
 * @param {String} url 资源地址
 * @param {String} type 资源类型 script、style
 */
function loadResource(url, type) {
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

// 添加限定符 避免污染嵌入项目
function getParamsForCanvas () {
  const result = {};

  // 合并标准参数和hash参数
  new URLSearchParams(location.search).forEach((v, k) => result[k] = v);
  const hashPart = location.hash.includes('?') 
    ? location.hash.split('?')[1] 
    : '';
  new URLSearchParams(hashPart).forEach((v, k) => result[k] = v);

  return result;
}

/**
 * 加载在线依赖及业务模块
 */
async function setup (isProd = "no", platform, useTailwindcss, uiLib) {
  var domain = isProd === "yes" ? "/resources/canvas/" : "http://localhost:8010/"
  window._custom_element_domain = domain
  try {
    // 工具类优先加载
    await loadResource(`${domain}canvas/utils.js`, 'script');
    // 加载渲染器并实例化
    await loadResource(`${domain}canvas/render.js`, 'script');
    await loadResource(`${domain}vendors/my-lib.iife.js`, 'script');
    await loadResource(`${domain}vendors/echarts@5.6.0.js`, 'script');
    // 加载画布实现的业务类、工具类、全局变量等
    await loadResource(`${domain}canvas/_Global.js`, 'script');
    await loadResource(`${domain}canvas/business.js`, 'script');
    await loadResource(`${domain}canvas/message.js`, 'script');
    // 模拟杭易联API请求方法
    const ttMockData = safeJsonParse(window.sessionStorage.getItem("ttMockData"), {})
    if (ttMockData?.operno) {
      await loadResource(`${domain}canvas/moaLogin.js`, 'script');
      await loadResource(`${domain}canvas/moaTools.js`, 'script');
    }
    // 开启事件订阅
    Message.addMessageListener();
    let vueMajor
    if (document.querySelector("#app") && document.querySelector("#app").__vue__) {
      // 加载vue2及对应ui库资源
      await loadLib(`${domain}vendors/vue@2.7.14.min.js`, 'script')
      // await loadLib(`${domain}vendors/element-ui@2.15.13.min.js`, 'script')
      // await loadLib(`${domain}vendors/element-ui@2.15.13.min.css`, 'style')
      // await loadLib(`${domain}vendors/vant@2.13.9.js`, 'script')
      // await loadLib(`${domain}vendors/vant@2.13.9.css`, 'style')
      // await loadLib(`${domain}vendors/@hzbank-pc-vue2-ui.umd.js`, 'script')
      // await loadLib(`${domain}vendors/@hzbank-pc-vue2-ui.css`, 'style')
      vueMajor = "vue2"
      _Global.vueMajor = "vue2"
    } else {
      // 加载vue3及对应ui库资源
      await loadLib(`${domain}vendors/vue@v3.5.13.js`, 'script')
      // await loadLib(`${domain}vendors/element-plus@2.9.5.js`, 'script')
      // await loadLib(`${domain}vendors/element-plus@2.9.5.css`, 'style')
      // await loadLib(`${domain}vendors/vant@4.9.19.js`, 'script')
      // await loadLib(`${domain}vendors/vant@4.9.19.css`, 'style') 
      // // element-plus需额外加载图标库
      // await loadResource(`${domain}vendors/@element-plus-icons-vue@2.3.1.js`, 'script');
      vueMajor = "vue3"
      _Global.vueMajor = "vue3"
    }
    const renderInstance = new Render({
      domain,
      type: vueMajor,
      isProd
    })
    window.UseRender = {
      render: renderInstance.getRender(),
      instance: renderInstance
    }
    _Global.platform = platform
    _Global.uiLib = uiLib
    _Global.useTailwindcss = useTailwindcss
    // window.onload = function () {
    // 实例化配置组
    Business.initConfig()
    Business.addCommonStyles()
    // 添加点击dom节点获取属性监听
    // Business.getAttrsWithClick();
    // 注入选中高亮样式
    // Business.addDragStyles();
    // // 初始化删除按钮
    // Business.initDeleteBtn();
    // 开启拖拽
    // Business.enableUniversalDrag();
    // Business.toggleMode()
    // 默认一进来清空
    Business.clearSaveHistory();
    // 默认一进来保存初始化的版本
    // Business.initVersionController();
    // 禁用页面路由跳转
    // Business.hijackRouter()
    // 工具栏适配
    Business.addWinResize()
    // Hz前缀封装检测
    Business.checkIsHzLib()
    window.parent.postMessage(safeJsonStringify({
      type: "get-mode",
    }), "*");
    // }
  } catch (error) {
    console.error('资源加载失败:', error);
  }
}

function safeJsonParse (str, defaultValue = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("JSON parse error:", e);
    return defaultValue;
  }
}
function safeJsonStringify (obj, defaultValue = null) {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.warn("JSON stringify error:", e);
    return defaultValue;
  }
}
const overwriteCookie = () => {
  // 初始化mock cookie存储
  if (!window.sessionStorage.getItem("mockCookie")) {
    window.sessionStorage.setItem("mockCookie", "");
  }
  Object.defineProperty(document, 'cookie', {
    get: function() {
      return window.sessionStorage.getItem("mockCookie") || ""
    },
    set: function (val) {
      if (!val || typeof val !== 'string') {
        return;
      }
      
      // 解析cookie字符串 (name=value; attributes)
      const parts = val.split(';').map(part => part.trim());
      const [nameValue, ...attributes] = parts;
      const [name, value] = nameValue.split('=');
      
      if (!name) return;
      
      // 获取当前所有cookies
      const currentCookies = window.sessionStorage.getItem("mockCookie") || "";
      const cookieArray = currentCookies ? currentCookies.split('; ') : [];
      
      // 检查cookie是否已存在
      let cookieExists = false;
      const updatedCookies = cookieArray.map(cookie => {
        const [existingName] = cookie.split('=');
        if (existingName === name) {
          cookieExists = true;
          return `${name}=${value || ''}`;
        }
        return cookie;
      });
      
      // 如果是新cookie，添加到数组
      if (!cookieExists) {
        updatedCookies.push(`${name}=${value || ''}`);
      }
      
      // 处理属性 (简单实现，实际应处理expires, path, domain等)
      const cookieString = updatedCookies.join('; ');
      window.sessionStorage.setItem("mockCookie", cookieString);
    }
  })
  const urlParams = getParamsForCanvas()
  Object.entries(urlParams).forEach(([key, value]) => {
    document.cookie = `${key}=${value}`
  })
}
  
// 重写cookie获取方法 -- 兼容vscode下webview容器无法设置cookie
overwriteCookie()

document.addEventListener('DOMContentLoaded', function() {
  window.parent.postMessage(safeJsonStringify({
    type: "get-all-params",
  }), "*");
})

window.addEventListener("message", (event) => {
  // 只响应自定义事件(如webpack相关事件直接return)
  if (event.data.type) return;
  var data = safeJsonParse(event.data);
  if (!data) return;
  var type = data.type;
  if(type === "setup") {
    const params = data.params
    setup(params.isProd, params.platform, params.useTailwindcss, params.uiLib)
  }
})
let canvasRouterCurrentUrl = null
let canvasRouterReporter = setInterval(() => {
  const currentUrl = window.location.href
  if(canvasRouterCurrentUrl !== currentUrl) {
    window.parent.postMessage(safeJsonStringify({
      type: "report-route",
      data: window.location.href
    }), "*");
  }
}, 500)


// 模拟杭易联API请求方法
const installTtMockData = safeJsonParse(window.sessionStorage.getItem("ttMockData"), {})
if (installTtMockData?.operno) {
  window.tt = {
    invokeCustomAPI: function (...args) {
      if(window.canvasTt) {
        window.tt = window.canvasTt
        window.canvasTt.invokeCustomAPI(...args)
      } else {
        // 轮询检查 canvasTt 是否已加载
        const checkInterval = setInterval(() => {
          console.log('轮询中')
          if(window.canvasTt) {
            clearInterval(checkInterval);
            window.tt = window.canvasTt
            window.canvasTt.invokeCustomAPI(...args)
          }
        }, 100);
      }
    }
  }
} else {window.tt = {
    invokeCustomAPI: function () {
      let msg = {
        type: "alert-msg",
        msgType: "error",
        text: "杭易联项目须点击左上角“齿轮图标”设置操作员号后使用tt.invokeCustomAPI"
      }
      try {
        msg = JSON.stringify(msg)
      } catch (error) {
        console.error("杭易联项目须点击左上角“齿轮图标”设置操作员号后使用tt.invokeCustomAPI", error)
      }
      window.parent.postMessage(msg, "*");
    }
  }
}
