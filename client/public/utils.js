/**
 * 工具类
 */
window.Utils = {
  // px/%兼容处理
  paddingUnits: function (value = "") {
    // 有设置单位 直接返回
    if(value.endsWith("px") || value.endsWith("%")) return value
    // 非数字字符串  
    if(!(/^\d+$/.test(value))) return false
    // 数字则拼接px
    return value + "px"
  },
  // camelCase转kebab-case
  camelToKebab: function (str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
  },
  // PascalCase转kebab-case
  pascalToKebab: function (pascal) {
    return pascal
      .replace(/[A-Z]/g, (match) => "-" + match.toLowerCase())
      .slice(1);
  },
  // kebab-case转
  kebabToCamel: function (str) {
    if (!str || typeof str !== "string") {
      return str;
    }
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  },
  // 是否为文本节点
  isOnlyTextNode: function (node) {
    return (
      node.nodeType === Node.TEXT_NODE ||
      (node.nodeType === Node.ELEMENT_NODE &&
        (node.childNodes && node.childNodes.length > 0 && Array.from(node.childNodes).filter(itemNode => (itemNode.nodeType !== Node.TEXT_NODE && itemNode.nodeType !== Node.COMMENT_NODE)).length < 1)
      )
    );
  },
  // 获取顶层元素标签
  getTopTagStringWithAttributes: function (node) {
    if (node && node.tagName) {
      const tagName = node.tagName.toLowerCase();
      const attributes = Array.from(node.attributes)
        .map((attr) => {
          if (attr.name === "style") {
            return "";
          } else {
            return `${attr.name}="${attr.value.replaceAll("dragging", "")}"`;
          }
        })
        .join(" ");

      return attributes
        ? `<${tagName} ${attributes}></${tagName}>`
        : `<${tagName} />`;
    }
    return null;
  },
  // 获取url参数
  getParams: function () {
    const result = {};
  
    // 合并标准参数和hash参数
    new URLSearchParams(location.search).forEach((v, k) => result[k] = v);
    const hashPart = location.hash.includes('?') 
      ? location.hash.split('?')[1] 
      : '';
    new URLSearchParams(hashPart).forEach((v, k) => result[k] = v);

    return result;
  },
  // 通过坐标查找元素
  getElementAtPosition: function (x, y) {
    var element = document.elementFromPoint(x, y);
    return element;
  },
  // 基于dom节点找出组件名称(EP、EU、Vant)
  findUiComponentName: function (node, type = "default") {
    const isVue2 = (_Global.uiLib === "element-ui" || _Global.uiLib === "hzb-ui") ? true : false
    let current = node
    while (current) {
      const vueInstance = isVue2 ? current.__vue__ : current.__vueParentComponent
      // 找出虚拟节点
      if(vueInstance) {
        let returnComponentName = null
        const componentName = isVue2 ? vueInstance.$options.name : vueInstance.type.name
        // 当前找寻规则为 从node本身向上寻找 直至找出虚拟节点 符合以下判断即为UI组件
        if((componentName && (componentName.startsWith("Hzb") || componentName.startsWith("El") || componentName.startsWith("Van"))) && componentName !== 'ElFocusTrap' ) {
          returnComponentName = componentName
        }
        let events = []
        if(type === "event" && vueInstance?.$listeners) {
          const eventsJsonArray = Object.entries(vueInstance?.$listeners)
          events = eventsJsonArray.map(([key]) => key)
        }
        return type === "default" ? returnComponentName : events
      }
      current = current.parentElement
    }
  },
  // 基于dom节点获取支持的事件集
  getNodeEvents: function (node) {
    const commonEvents = [
      {
        label: "点击事件",
        value: "click"
      },
      {
        label: "双击事件",
        value: "dblclick"
      },
      {
        label: "聚焦事件",
        value: "focus"
      },
      {
        label: "失焦事件",
        value: "blur"
      },     
    ]
    const tagName = node?.tagName?.toLowerCase()
    const formEventMap = {
      "input": [
        {
          label: "数据变化事件",
          value: "change"
        },
        {
          label: "数据输入事件",
          value: "input"
        }
      ],
      "textarea": [
        {
          label: "数据变化事件",
          value: "change"
        },
        {
          label: "数据输入事件",
          value: "input"
        }
      ],
      "select": [
        {
          label: "数据变化事件",
          value: "change"
        }
      ],
    }
    // const customEvents = this.findUiComponentName(node, "event")
    let events = [
      ...new Set([
        ...commonEvents,
        ...(formEventMap[tagName] || []),
        // ...customEvents
      ])
    ]
    return Utils.safeJsonStringify(events)
  }, 
  findComponent: function (node) {
    const isVue2 = (_Global.uiLib === "element-ui" || _Global.uiLib === "hzb-ui") ? true : false
    let current = node
    while (current) {
      const vueInstance = isVue2 ? current.__vue__ : current.__vueParentComponent
      if (vueInstance) {
        return vueInstance
      }
      current = current.parentElement
    }
  }, 
  describeDOMNode: function (node) {
    const componentName = Utils.findUiComponentName(node)
    if(componentName) {
      return `${node.textContent?"包含文字内容为" + node.textContent + "的" : ""}${componentName}组件`
    }
    // svg元素特殊处理
    if(node && node.children && node.children[0] && Utils.isSVGElement(node.children[0])) {
      node.className = node.className.replace(/(dragging|center-h|center-v|center-vh)/g, "")
      return `${node.outerHTML}匹配的icon组件`
    }
    if (!node?.nodeType || node.nodeType !== 1) return "Invalid DOM element";

    // 基础信息提取
    const tag = node.tagName.toLowerCase();
    const id = node.id ? `ID="${node.id}"` : "";
    // 兼容svg元素获取class处理
    const fitClassName = (node.className && typeof node.className === 'object' && 'baseVal' in node.className) ? node.className.baseVal : node.className;
    const className = fitClassName && fitClassName.replace(/(dragging|center-h|center-v|center-vh)/g, "")
    const classes = className ? `class="${className}"` : "";
    // 关键属性收集（可扩展）
    const attrs = [];
    ["href", "alt", "title", "role", "type", "value"].forEach((attr) => {
      if (node.hasAttribute(attr))
        attrs.push(`${attr}="${node.getAttribute(attr)}"`);
    });

    // ARIA 属性特殊处理
    Array.from(node.attributes)
      .filter((attr) => attr.name.startsWith("aria-"))
      .forEach((attr) => attrs.push(`${attr.name}="${attr.value}"`));

    // 上下文信息构建
    const parent = node.parentElement;
    const parentInfo = parent
      ? `${parent.tagName.toLowerCase()}${parent.id ? `#${parent.id}` : ""}`
      : "document";
    const position = parent ? Array.from(parent.children).indexOf(node) + 1 : 0;

    // 内容描述
    const text = node.getAttribute("data-default-innerText") ? node.getAttribute("data-default-innerText") : node.textContent.trim().replace(/\s+/g, " ");
    const contentDesc = text
      ? `包含文本内容："${text.slice(0, 100)}"`
      : "无文本内容";

    // 结构描述
    const childElements = node.children.length;
    const childrenDesc = childElements
      ? `包含 ${childElements} 个子元素`
      : "无子元素";

    // 可见性检测
    const style = window.getComputedStyle(node);
    const visibility =
      style.display === "none"
        ? "不可见"
        : style.visibility === "hidden"
          ? "隐藏"
          : "可见";

    // 组合描述
    return [
      `找寻一个 <${tag}> 元素`,
      ...[id, classes].filter(Boolean),
      attrs.length ? `具有属性：${attrs.join(", ")}` : "",
      // `位于 ${parentInfo} 的第 ${position} 个子位置`,
      contentDesc,
      childrenDesc,
      // `当前状态：${visibility}`,
      // `完整选择器：${this.cssPath(node)}`,
    ]
      .filter(Boolean)
      .join(",");
  },
  // 生成 CSS 路径工具函数
  cssPath: function (node) {
    const path = [];
    while (node && node.nodeType === Node.ELEMENT_NODE) {
      let selector = node.tagName.toLowerCase();
      if (node.id) {
        selector += `#${node.id}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = node,
          nth = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          nth++;
        }
        if (nth !== 1) selector += `:nth-of-type(${nth})`;
      }
      path.unshift(selector);
      node = node.parentNode;
    }
    return path.join(" > ");
  },
  // 通过坐标找出最近的元素
  getClosestChildWithPosition: function (element, x, y) {
    var children = Array.from(element.children);
    var closestChild = null;
    var minDistance = Infinity;
    var position = "";
    // 遍历所有子节点，计算它们到(x, y)的距离
    children.forEach((child, index) => {
      var rect = child.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var distance = Math.sqrt(
        Math.pow(centerX - x, 2) + Math.pow(centerY - y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestChild = child;
        if (x <= centerX) {
          position = "before";
        } else {
          position = "after";
        }
      }
    });
    var result = {
      element: closestChild,
      position: position,
    };
    return result;
  },
  getPosition: function (element, x) {
    var rect = element.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    if (x <= centerX) {
      return "before";
    } else {
      return "after";
    }
  },
  throttle: function (fn, delay) {
    let lastTime = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastTime >= delay) {
        fn.apply(this, args);
        lastTime = now;
      }
    };
  },
  debounce: function (fn, delay = 300) {
    let timer = null;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  },
  safeJsonParse: function (str, defaultValue = null) {
    try {
      return JSON.parse(str);
    } catch (e) {
      console.warn("JSON parse error:", e);
      return defaultValue;
    }
  },
  safeJsonStringify: function (obj, defaultValue = null) {
    try {
      return JSON.stringify(obj);
    } catch (e) {
      console.warn("JSON stringify error:", e);
      return defaultValue;
    }
  },
  // 根据属性名找出组件
  findComponentWithAttr: function (rootElement, attributeName) {
    let result = [];
    // 检查当前元素是否有指定的属性
    if (rootElement.hasAttribute(attributeName)) {
      result.push(rootElement);
    }
    // 递归遍历所有子元素
    for (let child of rootElement.children) {
      result =[...new Set([...result, ...this.findComponentWithAttr(child, attributeName)])]
    }
    return result
  },
  // 去除节点数组被包含的子节点
  filterContainedNodes: function (nodes) {
    // 先复制数组避免修改原数组
    const nodeList = Array.from(nodes);
    const result = [];
    for (let i = 0; i < nodeList.length; i++) {
      let isContained = false;
      const current = nodeList[i];
      
      // 检查当前节点是否被其他节点包含
      for (let j = 0; j < nodeList.length; j++) {
        if (i !== j && nodeList[j].contains(current)) {
          isContained = true;
          break;
        }
      }
      
      if (!isContained) {
        result.push(current)
      }
    }
    return result
  },
  // 判断是否为path元素
  isPathElement: function (node) {
    return node instanceof SVGPathElement || 
           node.nodeName.toLowerCase() === 'path';
  },
  // 判断是否为svg元素
  isSVGElement: function (node) {
    return node instanceof SVGElement || 
           node.nodeName.toLowerCase() === 'svg';
  },
  // el转换hz
  elToHz: function (source) {
    // 1. 替换 <el 为 <hz
    let result = source.replace(/<el/g, '<hz');
    // 2. 替换 </el 为 </hz
    result = result.replace(/<\/el/g, '</hz');
    // 3. 删除 import { ... } from 'element-ui';
    result = result.replace(/import\s*\{[^}]*\}\s*from\s*['"]element-ui['"];\s*/g, '');
    // 4. 删除 components: { ... } 中 'el-' 开头的所有行
    result = result.replace(
      /(components\s*:\s*\{)([\s\S]*?)(\})/,
      (match, start, body, end) => {
        // 删除 body 中以 'el-' 开头的行
        const newBody = body
          .split('\n')
          .filter(line => !/['"]el-/.test(line))
          .join('\n');
        return start + newBody + end;
      }
    );
    return result;
  },
  // 检测是否注册web component
  isWebComponent: function (tagName) {
    const el = document.createElement(tagName);
    return el.constructor !== HTMLElement;
  },
  registerWebComponent: function (tagName) {
    // 匿名注册
    customElements.define(tagName, class extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `<i class="${this.tagName.toLowerCase()}"></i>`;
      }
    });
  },
  // 判断是否为画布禁用交互元素
  isDisabledElement: function (element) {
    // 根节点html禁用
    if(element.nodeName === "HTML") return true
    // 非元素节点直接返回true
    if(element.nodeType !==1 ) return true
    return element.nodeName.startsWith("AI-") || // AI工具栏
    // 消息弹窗按钮系列
    (!!element.closest(".el-message-box__btns") && !!element.closest(".el-message-box")) || 
    // 对话框按钮系列
    (!!element.closest(".dialog-footer") && !!element.closest(".el-dialog")) || 
    // element-ui、element-plus下抽屉组件、对话框组件关闭按钮
    (!!element.closest(".el-icon") && !!element.closest(".el-dialog__close")) || 
    (!!element.closest(".el-icon") && !!element.closest(".el-drawer__close")) || 
    !!element.closest(".el-drawer__close-btn") ||
    !!element.closest(".el-dialog__headerbtn") || 
    // 消息弹窗按钮系列
    (!!element.closest(".ep-message-box__btns") && !!element.closest(".ep-message-box")) || 
    // 对话框按钮系列
    (!!element.closest(".dialog-footer") && !!element.closest(".ep-dialog")) || 
    // element-ui、element-plus下抽屉组件、对话框组件关闭按钮
    (!!element.closest(".ep-icon") && !!element.closest(".ep-dialog__close")) || 
    (!!element.closest(".ep-icon") && !!element.closest(".ep-drawer__close")) || 
    !!element.closest(".ep-drawer__close-btn") ||
    !!element.closest(".ep-dialog__headerbtn")
  },
  // style属性转为json对象
  styleToJson: function (style) {
    if(!style) return ["{}", {}]
    let result = {}
    let allResult = {}
    // 先切割;
    const itemStyleArr = style.split(";")
    itemStyleArr.forEach(item => {
      const itemArr = item.split(":")
      const saveKey = ["position", "left", "top"]
      if(itemArr[0]) {
        if(saveKey.includes(itemArr[0].trim())) {
          result[itemArr[0].trim()] = itemArr[1]
        }
        allResult[itemArr[0].trim()] = itemArr[1]
      }
    })
    return [this.safeJsonStringify(result), result, allResult]
  },
  // json转style字符串
  jsonToStyle: function (json = {}) {
    if(Object.keys(json).length === 0) return false
    let result = ""
    for(let i in json) {
      console.log(i)
      result += `${i}: ${json[i]};` 
    }
    return result
  },
  /**
   * 查找指定DOM节点最近的支持滚动的父级节点
   * @param {Element} node - 要查找的DOM节点
   * @returns {Element|null} - 返回找到的可滚动父级节点，如果没有则返回null
   */
  findScrollableParent: function(node) {
    // 从当前节点开始向上遍历
    let current = node;
  
    while (current && current !== document.body) {
        // 检查当前节点是否支持滚动
        const styles = window.getComputedStyle(current);
        const overflowY = styles.overflowY;
        const isScrollable = (overflowY === 'auto' || overflowY === 'scroll') && 
              current.scrollHeight > current.clientHeight;
        
        if (isScrollable) {
            return current;
        }
        
        // 移动到父节点继续查找
        current = current.parentNode;
    }
  
    // 如果都没找到，检查body和html元素
    if (document.body.scrollHeight > window.innerHeight) {
        return document.body;
    }
  
    if (document.documentElement.scrollHeight > window.innerHeight) {
        return document.documentElement;
    }
  
    return null;
  },
  /**
   * 获取元素相对于指定父元素的偏移量
   * @param {HTMLElement} element - 需要计算偏移量的子元素
   * @param {HTMLElement} parent - 参考父元素
   * @returns {{top: number, left: number}} 包含top和left属性的偏移量对象
   */
  getOffsetInParent: function (element, parent) {
    if (!element || !parent) {
      throw new Error('Element and parent must be provided');
    }

    // 获取元素相对于文档的偏移量
    // function getElementOffset(element) {
    //   let offset = { top: 0, left: 0 };
    //   let current = element;
      
    //   while (current && current.nodeType === 1) {
    //       offset.top += current.offsetTop;
    //       offset.left += current.offsetLeft;
    //       current = current.offsetParent;
    //   }
      
    //   return offset;
    // }

    // // 获取子元素和父元素的文档偏移量
    // const elementOffset = getElementOffset(element);
    // const parentOffset = getElementOffset(parent);

    // // 计算相对偏移量
    // return {
    //   top: elementOffset.top - parentOffset.top,
    //   left: elementOffset.left - parentOffset.left
    // };
    // 使用现代API获取更准确的位置 
    const elementRect = element.getBoundingClientRect(); 
    const parentRect = parent.getBoundingClientRect(); 
    // 计算相对位置 
    let offset = { 
      top: elementRect.top - parentRect.top, 
      left: elementRect.left - parentRect.left 
    }; 
    // 如果父元素有滚动，需要考虑滚动偏移 
    if (parent.scrollLeft || parent.scrollTop) { 
      offset.top += parent.scrollTop; 
      offset.left += parent.scrollLeft; 
    } 
    return offset;
  },
  /**
   * 针对嵌入项目中存在多滚动条导致定位不准确问题统一处理
   * 大致逻辑如下:
   * 1、基于定位元素找出最近的滚动容器
   * 2、标识类插入到滚动容器中--基于定位元素相对于滚动容器偏移量进行定位
   * 3、若滚动容器为设置定位属性,追加relative--报障标识类的定位生效
   */
  /**
   * 查找最近的滚动容器（包括元素本身）
   * @param {HTMLElement} element - 要查找的DOM节点
   * @returns {HTMLElement|null} - 最近的滚动容器
   */
  findNearestScrollContainerIncludingSelf: function(element) {
    /**
     * 判断元素是否为滚动容器
     * @param {HTMLElement} element - 要检查的元素
     * @returns {boolean} - 是否是滚动容器
     */
    const isScrollContainer = (element) => {
      const style = window.getComputedStyle(element);
      const overflow = style.overflow;
      const overflowX = style.overflowX;
      const overflowY = style.overflowY;
      
      // 检查overflow属性
      const hasScrollableOverflow = 
          overflow === 'auto' || 
          overflow === 'scroll' ||
          overflowX === 'auto' || overflowX === 'scroll' ||
          overflowY === 'auto' || overflowY === 'scroll';
      
      if (!hasScrollableOverflow) {
          return false;
      }
      
      // 检查元素是否实际可滚动
      return (
          element.scrollHeight > element.clientHeight ||
          element.scrollWidth > element.clientWidth
      );
    }

    /**
     * 查找给定DOM节点的最近滚动容器
     * @param {HTMLElement} element - 要查找的DOM节点
     * @returns {HTMLElement|null} - 最近的滚动容器，找不到时返回null
     */
    const findNearestScrollContainer = (element) => {
      // 参数验证
      if (!(element instanceof HTMLElement)) {
        console.error('参数必须是有效的HTMLElement');
        return null;
      }

      let currentElement = element;

      // 遍历DOM树向上查找
      while (currentElement && currentElement !== document.body) {
        // 检查当前元素是否是滚动容器
        if (isScrollContainer(currentElement)) {
            return currentElement;
        }
        
        // 移动到父元素
        currentElement = currentElement.parentElement;
      }

      // 检查document.body
      if (isScrollContainer(document.body)) {
          return document.body;
      }

      // 检查html元素
      const htmlElement = document.documentElement;
      if (isScrollContainer(htmlElement)) {
          return htmlElement;
      }

      return null;
    }

    // 首先检查元素本身是否是滚动容器
    if (isScrollContainer(element)) {
        return element;
    }
    
    // 如果本身不是，则向上查找
    return findNearestScrollContainer(element);
  },
};
