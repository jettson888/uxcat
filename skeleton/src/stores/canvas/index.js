import { defineStore, storeToRefs } from "pinia";
import { safeJsonParse, safeJsonStringify } from "@/utils";

const useCanvasStore = defineStore("canvas", {
  state: () => ({
    // 右侧通用属性
    rightProps: {
      left: 0,
      top: 0,
      width: 0,
      widthUnit: "px", 
      height: 0,
      heightUnit: "px",
      fontFamily: "微软雅黑",
      fontSize: 12,
      color: "black",
      backgroundColor: "white",
      fontWeight: "400",
      textAlign: "left",
      innerText: "",
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      // 居中方式
      centerType: "default",
      // 圆角模式
      borderRadiusType: "normal",
      // 固定圆角值
      borderRadius: 0,
      // 特殊圆角四个角值
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      // 边宽
      borderWidth: 0,
      // 边框颜色
      borderColor: '',
      // 边框样式
      borderStyle: '',
      // 阴影样式
      boxShadow: '0px 0px 0px 0px',
      boxShadowType: false,
      boxShadowColor: '',
      hShadow: 0,
      vShadow: 0,
      boxShadowBlur: 0,
      boxShadowSpread: 0,
      actionComponentsList: []
    },
    promptText: "",
    // 当前选中页面元素标签名
    tagName: "",
    // 是否为文本节点
    isOnlyTextNode: false,
    // 当前配置组件索引
    currCptIdx: -1,
    // 当前配置交互组件索引
    saveCurrCptIdx: -1,
    // 添加组件列表
    initComponents: {},
    // 组件索引
    componentIdx: 100000,
    // 属性栏tab
    activeName: "attrs",
    // 操作记录缓存队列
    historyActionArr: [
      {
        initComponents: {},
        componentIdx: 100000,
      },
    ],
    // 图标选择弹窗显隐状态
    iconsDialogVisible: false,
    // 交互组件配置弹窗显隐状态
    componentDrawerVisible: false,
    // 选中图标
    iconSelected: "",
    // 当前组件icon更新的属性名
    iconAttr: "",
    // isFullScreen: _sandbox_canvas.urlParams && _sandbox_canvas.urlParams.isZenMode === "active" ? true : false,
    // 组件替换时选中的组件值
    currentComponentsValue: {},
    showDrawer: false,
    isReplaceComponent: false,
    rightStatus: true,
    // 画布工程中路由列表--不包含动态路由
    routeList: [
      {
        label: "新增页面",
        value: "add-route-action",
      }
    ],
    routeValue: "",
    configRouteVisible: false,
    routerDialogVisible: false,
    // 点击按钮返回基础配置开关 -- 控制右侧属性配置面板不关闭
    isBackToBaseConfig: false,
    // 预览模式
    mode: "preview",
    cookieDialogVisible: false,
    sessionCookie: "",
    currentUrl: "",
    saveIframeUrl: "",
    isUrlInput: false,
    // 杭易联项目操作员号
    moaOperno: ""
  }),
  actions: {
    reset() {
      this.rightProps = {
        left: 0,
        top: 0,
        width: 0,
        widthUnit: "px", 
        height: 0,
        heightUnit: "px",
        fontFamily: "微软雅黑",
        fontSize: 12,
        color: "black",
        backgroundColor: "white",
        fontWeight: "400",
        textAlign: "left",
        innerText: "",
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
        paddingTop: 0,
        paddingRight: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        // 居中方式
        centerType: "default",
        // 圆角模式
        borderRadiusType: "normal",
        // 固定圆角值
        borderRadius: 0,
        // 特殊圆角四个角值
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        // 边宽
        borderWidth: 0,
        // 边框颜色
        borderColor: '',
        // 边框样式
        borderStyle: '',
        // 阴影样式
        boxShadow: '0px 0px 0px 0px',
        boxShadowType: false,
        boxShadowColor: '',
        hShadow: 0,
        vShadow: 0,
        boxShadowBlur: 0,
        boxShadowSpread: 0,
        actionComponentsList: []
      }
      this.promptText = ""
      this.isOnlyTextNode = false
      this.currCptIdx = -1
      this.saveCurrCptIdx = -1
      this.initComponents = {}
      this.componentIdx = 100000
      this.activeName = "attrs"
      this.historyActionArr = [
        {
          initComponents: {},
          componentIdx: 100000,
        }
      ]
      this.iconsDialogVisible = false
      this.componentDrawerVisible = false
      this.iconSelected = ""
      this.iconAttr = ""
      // this.isFullScreen = _sandbox_canvas.urlParams && _sandbox_canvas.urlParams.isZenMode === "active" ? true : false
      this.currentComponentsValue = {}
      this.showDrawer = false
      this.isReplaceComponent = false
      this.rightStatus = true
      this.routeList = [
        {
          label: "新增页面",
          value: "add-route-action",
        }
      ]
      this.routeValue = ""
      this.configRouteVisible = false
      this.routerDialogVisible = false
      this.isBackToBaseConfig = false
      // this.mode = "preview"
      this.cookieDialogVisible = false
      this.sessionCookie = ""
      this.currentUrl = ""
      // this.saveIframeUrl = ""  记录当前路由 不清空
      this.isUrlInput = false
    },
    update({ key, value }) {
      this[key] = value;
    },
    /**
     * 多个状态值更新通用方法
     * @param {*} paylaod
     */
    updateWithJson(paylaod = {}) {
      for (let key in paylaod) {
        this[key] = paylaod[key];
      }
    },
    /**
     * 缓存当前组件信息
     */
    saveComponentsInfo(index = 0) {
      if (index < 0) return;
      // 解除响应式
      const components = safeJsonParse(safeJsonStringify(this.initComponents));
      const componentIdx = this.componentIdx;
      let historyActionArr = [...this.historyActionArr];
      const currData = {
        components,
        componentIdx,
      };
      /**
       * 判断是否存在
       * 若存在 则更新
       * 不存在 则添加
       */
      if (historyActionArr[index]) {
        // 更新
        historyActionArr[index] = currData;
      } else {
        // 插入
        historyActionArr.push(currData);
        this.historyActionArr = historyActionArr;
      }
    },
    /**
     * 还原组件信息
     */
    restoreComponents(index = 0) {
      if (index < 0) return;
      const { components = {}, componentIdx = 100000 } =
        this.historyActionArr[index];
      this.initComponents = safeJsonParse(safeJsonStringify(components));
      this.componentIdx = Number(componentIdx.toString());
      this.activeName = "attrs";
      this.currCptIdx = -1;
      return safeJsonParse(safeJsonStringify(components));
    },
  }
});

export default useCanvasStore;
