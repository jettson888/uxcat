# vite + Vue2 项目示例


AI原型设计模板，项目尽量简洁
只引入了@hzbank/pc-vue2-ui和ECharts图表库。


## 开发指南

### 启动项目

```bash
npm run dev
```

### 构建项目

```bash
npm run build
```


<!-- 引入可视化插-public下文件修改点 -->
_Global.js
  configComponent: {},
business.js
  window.Business
  // 清空修改数据
  case "clear-dom-list":
    _Global.configDomList = [];
    break;
  const addDomDelList
  const actionDomDelList
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
install.js
  无
message.js
  window.Message
render.js
  无
utils.js
  window.Utils

my-lib.life.js是AI原型工程中执行npm run buildWin:lib生成的

---

dev：

http://127.0.0.1:3000/?ip=158.58.171.17&clientPort=9371&serverPort=9369#/
