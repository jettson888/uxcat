/**
 * 全局变量定义
 */
window._Global = {
  platform: "pc",
  useTailwindcss: "no",
  uiLib: "element-ui",
  isHzWrapper: false,
  // prompt起始词
  // 6.5变更 不需起始prompt
  // promptStart: function () {
  //   return `你是一位精通${this.useTailwindcss === "yes" ? " Tailwind CSS、" : ""}Vant4、Vue3 的前端开发专家。
  //   你的核心任务是根据后续提供的 **文本描述**，在上一次生成代码后的基础之上、进行样式或者布局精准调整。
  //   **最关键的目标之一是：必须通过${this.useTailwindcss === "yes" ? " Tailwind CSS " : ""}精确覆盖 Vant 组件的默认样式，确保最终视觉效果与 文本描述 完全一致。
  //   **文本描述 绝对优先，Vant 样式必须覆盖 (核心要求中的核心):**\n`
  // },
  // promptStartPc: function () {
  //   return `你是一位精通${this.useTailwindcss === "yes" ? " Tailwind CSS、" : ""}Element Plus、Vue3 的前端开发专家。
  //   你的核心任务是根据后续提供的 **文本描述**，在上一次生成代码后的基础之上、进行样式或者布局精准调整。
  //   **最关键的目标之一是：必须通过${this.useTailwindcss === "yes" ? " Tailwind CSS " : ""}精确覆盖 Element Plus 组件的默认样式，确保最终视觉效果与 文本描述 完全一致。
  //   **文本描述 绝对优先，Element Plus 样式必须覆盖 (核心要求中的核心):**\n`
  // },
  // 当前选中节点
  currSelectedDom: null,
  // 删除节点列表
  delDomList: [],
  // 配置节点数组
  configDomList: [],
  // 复制节点数组
  copyDomList: [],
  elementIsMove: false,
  // 当前hover元素
  currHoverDom: null,
  historyActionArr: [],
  // 用户是否按了shift
  shiftOn: false,
  // 点击节点的时候保存DOM节点,用于撤销用
  whenClickDOM: null,
  // 多选的DOM节点插入
  whenShfitOnDom: [],
  // 当前添加的交互组件
  actionComponentApp: null,
  promptStart: "用电报风格回答，禁止解释思考过程，以新任务执行",
  promptTips: "重要点:若以上变更涉及UI库及icon图标,需检测工程中是否有引入UI库及icon图标库相关的js及css文件,若未引入,请在main.js中引入.确保组件正确注册和使用.【严格执行】但凡涉及代码写入,写入的代码必须通过项目中配置的eslint、prettier等的校验.",
  promptTipsForUi: `【图标使用】element-ui 下的图标使用需严格按照以下规则：
  1. 推荐使用 <i class=\"el-icon-图标名\"></i> 的方式在 template 中引用图标。例如：
  <i class=\"el-icon-edit\"></i>
  2. 图标名需参考 element-ui 官方文档，确保拼写正确。
  3. 禁止随意 import 或 require 图标 SVG 文件，必须使用 element-ui 提供的 class 方式。
  4. 仅允许在 template 中直接使用，不要在 script 中动态创建图标节点。
  【正例】
  // 使用 element-ui 的 edit 图标
  <i class=\"el-icon-edit\"></i>
  【反例】
  // 错误：直接 import svg 文件
  import EditIcon from 'xxx.svg'
  // 错误：未按 class 规范命名
  <i class=\"icon-edit\"></i>
  重要点:若以上变更涉及 UI 库,需检测工程中是否有引入 UI 库相关的 js 及 css 文件,若未引入,请在 main.js 中引入.确保组件正确注册和使用.
  【严格执行】但凡涉及代码写入,写入的代码必须通过项目中配置的 eslint、prettier 等的校验。`,
  promptTipsForHzbUi: `【图标使用】@hzbank/pc-vue2-ui 下的图标使用需严格按照以下规则：
  1. 推荐使用 <i class=\"hzb-icon-图标名\"></i> 的方式在 template 中引用图标。例如：
  <i class=\"hzb-icon-edit\"></i>
  2. 图标名需参考 @hzbank/pc-vue2-ui 官方文档，确保拼写正确。
  3. 禁止随意 import 或 require 图标 SVG 文件，必须使用 @hzbank/pc-vue2-ui 提供的 class 方式。
  4. 仅允许在 template 中直接使用，不要在 script 中动态创建图标节点。
  【正例】
  // 使用 @hzbank/pc-vue2-ui 的 edit 图标
  <i class=\"hzb-icon-edit\"></i>
  【反例】
  // 错误：直接 import svg 文件
  import EditIcon from 'xxx.svg'
  // 错误：未按 class 规范命名
  <i class=\"icon-edit\"></i>
  重要点:若以上变更涉及 UI 库,需检测工程中是否有引入 UI 库相关的 js 及 css 文件,若未引入,请在 main.js 中引入.确保组件正确注册和使用.涉及组件在template中的使用,其前缀为hzb-,具体参考以下示例:
  // 使用Button组件 其前缀为hzb-
  <hzb-button>按钮</hzb-button>
  【严格执行】但凡涉及代码写入,写入的代码必须通过项目中配置的 eslint、prettier 等的校验。`,
  promptTipsForHz: `【图标使用】element-ui 下的图标使用需严格按照以下规则：
  1. 推荐使用 <i class=\"el-icon-图标名\"></i> 的方式在 template 中引用图标。例如：
  <i class=\"el-icon-edit\"></i>
  2. 图标名需参考 element-ui 官方文档，确保拼写正确。
  3. 禁止随意 import 或 require 图标 SVG 文件，必须使用 element-ui 提供的 class 方式。
  4. 仅允许在 template 中直接使用，不要在 script 中动态创建图标节点。
  5. 此处class 前缀保持 el-icon- 不变,不受 hz 替换影响。
  【正例】
  // 使用 element-ui 的 edit 图标
  <i class=\"el-icon-edit\"></i>
  【反例】
  // 错误：直接 import svg 文件
  import EditIcon from 'xxx.svg'
  // 错误：未按 class 规范命名
  <i class=\"icon-edit\"></i>
  【严格执行】但凡涉及代码写入,写入的代码必须通过项目中配置的eslint、prettier等的校验.`,
  promptTipsOnly: "",
  // 组件提测暂存对象
  componentSaveTemp: {},
  // 替换组件的数组
  replaceDomList: [],
  // 画布配置组件数据对象
  configComponent: {},
  // 添加组件时引入方式提示词
  paddingAddPrompt: `【组件注册】涉及element-ui下的组件引入,需在项目根目录下的src/element-split.js中校验是否引入,若未引入,则需进行引入.`,
  useageOfHzWrapper: `【组件使用说明】本项目已对 element-ui 下的所有组件进行全局注册，无需单独引入或安装依赖。使用时请直接在 template 中将组件标签名的 "el" 前缀替换为 "hz"，例如：
// 使用 element-ui 的 button 组件
<hz-button>我是按钮</hz-button>
// 切勿单独 import 或 require 相关组件。
`,
  paddingHzbUiPrompt: `【组件注册】涉及@hzbank/pc-vue2-ui下的组件引入,需在项目根目录下的src/ui-split.js中校验是否引入,若未引入,则需进行引入.`,
  currentIframe: null,
  iframes: [],
  storageCode: [],
  storageMsg: "",
  eventHandlers: null,
  globalRouter: null,
  reRenderMsg: null,
  currentMode: "preview",
  currentDesignDom: null,
  currentNodeEvents: [],
  backupConfigDomList: [], // 变更数组备份
  backupDom: null, // dom节点备份
  multiNodes: [],
  editToolbar: null,
  editInput: null,
  designInput: null,
  vueMajor: "vue2"
};
/**
 * 保存的历史记录
 */
window.saveHistoryArr = [];
