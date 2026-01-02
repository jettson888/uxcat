<template>
  <div class="product-page">
    <Header :projectName="projectName" />
    <!-- 显示当前项目名称 -->
    <div class="product-main">
      <ul class="product-sidebar">
        <li
          :class="{ active: activeTab === 'page' }"
          @click="setActiveTab('page')"
        >
          <div class="sidebar-icon page-icon"></div>
          <span>页面</span>
        </li>
        <!-- <li
          :class="{ active: activeTab === 'layer' }"
          @click="setActiveTab('layer')"
        >
          <div class="sidebar-icon layer-icon"></div>
          <span>图层</span>
        </li>
        <li :class="{ active: activeTab === 'history' }" @click="setActiveTab('history')">
          <div class="sidebar-icon history-icon"></div>
          <span>历史版本</span>
        </li> -->
      </ul>
      <ProductLeft
        ref="productLeftRef"
        :category-list="categoryList"
        :page-list="pageList"
        :project-id="projectId"
        @page-select="handlePageSelect"
        @startPolling="startPolling"
      />
      <div class="product-center">
        <!-- 工具栏 -->
        <div class="product-tools">
          <ul class="product-tools-type">
            <li
              :class="{ select: activeType === 'preview' }"
              @click="switchType('preview')"
            >
              <span class="preview-icon"></span>
              预览
            </li>
            <li
              :class="{ select: activeType === 'edit' }"
              @click="switchType('edit')"
            >
              <span class="edit-icon"></span>
              编辑
            </li>
          </ul>
        </div>
        <!-- iframe内容区域 -->
        <div class="product-iframe">
          <iframe
            v-if="selectedPage && selectedPage.status == 'done'"
            :src="iframeSrc"
            :style="getIframeStyle()"
            frameborder="0"
            ref="iframe"
            @load="onIframeLoad"
          ></iframe>
          <div
            v-else-if="selectedPage && selectedPage.status == 'generating'"
            class="product-drawing"
          >
            <img class="ai-icon-max" src="@/assets/images/ai-loading.webp" />
            <p>页面正在绘制，请稍后…</p>
          </div>
          <div
            v-else-if="selectedPage && selectedPage.status == 'error'"
            class="product-drawing"
          >
            <img class="ai-icon" src="@/assets/images/ai-black.png" />
            <p>页面生成失败，请重新生成</p>
          </div>
          <div v-else class="product-drawing">
            <img class="ai-icon" src="@/assets/images/ai-gray.png" />
          </div>
        </div>
      </div>
      <ProductRight
        v-if="activeType === 'edit'"
        ref="productRightRef"
        :page-data="selectedPage"
        @startPolling="startPolling"
        @switchType="switchType"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import Header from "@/common/components/Header.vue";
import ProductLeft from "./components/ProductLeft.vue";
import ProductRight from "./components/ProductRight.vue";
import createApiEndpoints from "@/common/api.js";
import request from "@/common/request.js";
import { useAppStore } from "@/stores/app";
import useCanvasStore from "stores/canvas";
import { safeJsonParse, safeJsonStringify } from '@/utils'

const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)

// 响应式数据
let api;
const pageList = ref([]);
const categoryList = ref([]);
const iframeSrc = ref("");
const selectedPage = ref(null);
const projectName = ref("");
const projectId = ref("");
const pageId = ref("");
const activeTab = ref("page"); // 默认选中页面tab
const activeType = ref("preview"); // 默认选中Type
const pollingTimer = ref(null); // 轮询定时器
const resolutionWidth = ref(null);
const resolutionHeight = ref(null);
const iframe = ref(null)

// 组件引用
const productLeftRef = ref(null);
const productRightRef = ref(null);

// 路由和store
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { clientUrl } = storeToRefs(appStore);

// 生命周期钩子
onMounted(async () => {
  // 清空保存的修改数据
  sessionStorage.removeItem('domList');
  // 初始化api方法
  api = await createApiEndpoints();
  // 初始化获取链接参数
  getParams();
  // 初始化接口请求
  initGetPages();

  // 添加 iframe 通信事件监听器
  window.addEventListener("message", handleIframeMessage);
});

onBeforeUnmount(() => {
  // 移除 iframe 通信事件监听器
  window.removeEventListener("message", handleIframeMessage);
  // 清理轮询定时器
  stopPolling();
});

// 方法
// 获取链接参数
const getParams = () => {
  // 从路由params中获取projectId和pageId
  projectId.value = route.query.projectId || "";
  pageId.value = route.query.pageId || "";
};

// 获取页面数据的公共方法
const fetchPageData = async () => {
  try {
    const res = await request({
      url: api.getPages,
      method: "post",
      data: {
        projectId: projectId.value,
      },
    });
    projectName.value = res.data[projectId.value]?.projectName || "";
    pageList.value = res.data.list || [];

    // 处理分辨率数据（所有页面统一的分辨率）
    if (res.data.resolution) {
      const [width, height] = res.data.resolution.split("*").map(Number);
      resolutionWidth.value = width;
      resolutionHeight.value = height;
    }

    // 转换数据结构以匹配ProductLeft组件的期望
    return res.data.categoryList;
  } catch (error) {
    console.error("页面数据请求失败", error);
    throw error;
  }
};

// 初始化页面数据
const initGetPages = async () => {
  try {
    categoryList.value = await fetchPageData();

    // 根据pageId参数定位具体页面
    setActivePage();

    // 检查是否需要启动轮询
    checkAndStartPolling(true);
  } catch (error) {
    console.error("初始化页面数据失败", error);
  }
};

// 根据pageId参数设置激活页面
const setActivePage = () => {
  if (categoryList.value.length === 0) return;

  let targetPage = null;

  // 如果有pageId参数，优先查找匹配的页面
  if (pageId.value) {
    for (let i = 0; i < categoryList.value.length; i++) {
      targetPage = categoryList.value[i].list.find(
        (page) => page.pageId === pageId.value
      );
      if (targetPage) {
        break;
      }
    }
  }

  // 如果没有指定pageId或找不到匹配页面，使用第一个页面
  if (!targetPage) {
    targetPage = categoryList.value[0].list[0];
  }

  // 设置激活状态和iframe源
  targetPage.active = true;
  iframeSrc.value = `${clientUrl.value}/#/${targetPage.pageId}`;
  selectedPage.value = targetPage;

  // 滚动到激活位置
  nextTick(() => {
    if (productLeftRef.value) {
      productLeftRef.value.scrollToActivePage();
    }
  });
};

// 选中页面
const handlePageSelect = (item) => {
  let targetPage = null;
  let newPageList = [];

  // 更新页面列表中的激活状态（通过新数组newPageList来强制刷新，防止某些情况下数据改变后视图没有变化）
  categoryList.value.forEach((ls) => {
    const newLs = [];
    ls.list.forEach((page) => {
      if (page.pageId === item.pageId) {
        targetPage = {
          ...page,
          active: true,
        };
        newLs.push(targetPage);
      } else {
        newLs.push({
          ...page,
          active: false,
        });
      }
    });
    newPageList.push({
      ...ls,
      list: newLs,
    });
  });
  categoryList.value = newPageList;
  // 根据选中的页面更新iframe的src
  iframeSrc.value = `${clientUrl.value}/#/${targetPage.pageId}`;
  // 更新选中的页面数据
  selectedPage.value = targetPage;

  // 更新路由参数中的pageId
  router.replace({
    query: {
      ...route.query,
      pageId: targetPage.pageId,
    },
  });
};

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

// iframe 通信事件处理
const handleIframeMessage = (event) => {
  console.log("handleIframeMessage");
  const message = event.data;

  if (message.data) { // 模板工程截图、路由、报错等相关信息处理
    let page = null;

    console.log("拿到模板页面传来的message", message);
    // 判断是否有对应的页面
    for (let i = 0; i < categoryList.value.length; i++) {
      page = categoryList.value[i].list.find(
        (page) => page.pageId === message.data.pageId
      );
      if (page) {
        break;
      }
    }
    if (!page) {
      return;
    }

    // 根据消息类型处理不同的事件
    if (message.type == "PAGE_SCREENSHOT") {
      // 替换当前页面截图
      page.imgUrl = message.data.imgUrl;

      // 调用接口保存缩略图
      savePageThumbnail(page);

      console.log("页面截图更新成功");
      // 触发视图更新（Vue3中通常不需要手动触发）
    } else if (message.type === "ROUTE_CHANGED") {
      // 防止重复处理：如果当前选中的页面就是消息中的页面，则不处理
      if (!selectedPage.value || selectedPage.value.pageId !== page.pageId) {
        // 根据pageId选中页面
        handlePageSelect(page);
        nextTick(() => {
          if (productLeftRef.value) {
            productLeftRef.value.scrollToActivePage();
          }
        });
      } else {
        console.log("页面已选中，跳过重复处理");
      }
    } else if (message.type === "PAGE_NOT_FOUND") {
      console.log("接收到页面404报错");
      // 触发页面重新生成
      // if (productRightRef.value) {
      //   productRightRef.value.regeneratePage();
      // }
    } else if (message.type === "PAGE_ERROR") {
      // 将报错信息传给后端
      request({
        url: api.sendError,
        method: "post",
        data: {
          ...message.data,
          projectId: projectId.value,
        },
      });
    }
  } else { // 可视化相关信息处理
    const msg = safeJsonParse(message);

    if (!msg) {
      return;
    }
    console.log('收到模板工程传来的消息msg：', msg)

    if (msg.type === 'report-attrs') {
      // 收到可视化选中的元素信息
      attrMsg(msg.data);
    } else if (msg.type == 'to-update-code') {
      // 将要修改的数据提交给后端去调用AI大模型进行修改
      productRightRef.value.updateCode(msg.data);
    } else if (msg.type == 'alert-msg') {
      // 收到可视化警告信息
      ElMessage({
        message: msg.text,
        type: 'warning',
      })
    } else if (msg.type == 'get-dom-list') {
      // 保存已修改数据
      sessionStorage.setItem('domList', JSON.stringify(msg.data))
    }
  }
};

// 保存页面缩略图到后端
const savePageThumbnail = async (page) => {
  try {
    await request({
      url: api.saveThumbnail,
      method: "post",
      data: {
        projectId: projectId.value,
        pageId: page.pageId,
        imgUrl: page.imgUrl,
      },
    });
    console.log("缩略图保存成功");
  } catch (error) {
    console.error("缩略图保存失败", error);
  }
};

// 检查并启动轮询
const checkAndStartPolling = (init) => {
  let hasGenerating = false;
  // 检查是否有状态为 'generating' 的页面
  for (let i = 0; i < categoryList.value.length; i++) {
    hasGenerating = categoryList.value[i].list.some(
      (page) => page.status === "generating"
    );
    if (hasGenerating) {
      break;
    }
  }

  if (hasGenerating) {
    // 如果有正在生成的页面，启动轮询
    // 确保计时器只启动一次
    if (init) {
      startPolling();
    }
  } else {
    // 如果没有正在生成的页面且不全是pending状态，停止轮询
    stopPolling();
  }
};

// 启动轮询
const startPolling = () => {
  // 先执行一次防止等太久
  refreshPageData();

  // 如果已经存在轮询定时器，先清理
  stopPolling();

  // 启动新的轮询，每5秒检查一次
  pollingTimer.value = setInterval(() => {
    refreshPageData();
  }, 5000);
};

// 停止轮询
const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = null;
  }
};

// 轮询刷新页面数据
const refreshPageData = async () => {
  try {
    const newCategoryList = await fetchPageData();

    // 更新页面列表数据，保持激活状态
    newCategoryList.forEach((ls) => {
      ls.list.forEach((page) => {
        // 如果当前有选中的页面
        if (selectedPage.value && page.pageId === selectedPage.value.pageId) {
          page.active = true; // 激活当前页面
          if (
            selectedPage.value.status != "done" ||
            page.status == "generating"
          ) {
            // 如果当前选中的页面是生成中则更新选中页面的数据
            selectedPage.value = page;
          }
        } else {
          page.active = false;
        }
      });
    });
    categoryList.value = newCategoryList;

    // 检查是否还需要继续轮询
    checkAndStartPolling();
  } catch (error) {
    console.error("轮询刷新页面数据失败", error);
    // 出错时也检查是否需要继续轮询
    checkAndStartPolling();
  }
};

// 计算iframe样式，支持等比例缩小
const getIframeStyle = () => {
  // 如果没有分辨率数据，使用默认样式
  if (!resolutionWidth.value || !resolutionHeight.value) {
    return {
      width: "100%",
      height: "100%",
      minWidth: "100%",
      minHeight: "100%",
    };
  }

  // 获取容器尺寸（这里假设容器最大为100%宽高）
  const containerWidth = window.innerWidth - 80 - 232 - 32 - 300; // 减去侧边栏、左侧区域、padding和右边区域
  const containerHeight = window.innerHeight - 56 - 32; // 减去header和padding

  // 如果设置的尺寸小于等于容器尺寸，直接使用原始尺寸
  if (
    resolutionWidth.value <= containerWidth &&
    resolutionHeight.value <= containerHeight
  ) {
    return {
      width: resolutionWidth.value + "px",
      height: resolutionHeight.value + "px",
    };
  }

  // 计算缩放比例
  const widthRatio = containerWidth / resolutionWidth.value;
  const heightRatio = containerHeight / resolutionHeight.value;
  const scaleRatio = Math.min(widthRatio, heightRatio);

  // 计算缩放后的尺寸
  const scaledWidth = Math.floor(resolutionWidth.value * scaleRatio);
  const scaledHeight = Math.floor(resolutionHeight.value * scaleRatio);

  return {
    width: scaledWidth + "px",
    height: scaledHeight + "px",
  };
};

// iframe载入事件
const onIframeLoad = () => {
  if (iframe.value && iframe.value.contentWindow) {
    window._child_win = iframe.value.contentWindow;
  }
}

// 切换预览/编辑模式
const switchType = async (type) => {
  if (type === 'preview') {
    // 获取修改数据
    if(window._child_win) {
      window._child_win.postMessage(safeJsonStringify({
        type: 'get-dom-list'
      }), '*')
    }
  }

  if (type=== 'edit' && selectedPage.value.status === 'generating') {
    ElMessage({
      message: '页面生成中，无法进行编辑！',
      type: 'warning',
    })
    return;
  }
  
  activeType.value = type;
  CanvasStore.updateWithJson({
    mode: type,
  })
  if(window._child_win) {
    window._child_win.postMessage(safeJsonStringify({
      type: "toggle-mode",
      data: type
    }), '*')
  }
}

// 消息处理
const attrMsg = (msg = '') => {
  productRightRef.value.isEmpty = true
  // 修复右侧属性表单未触发变更时画布区域选中元素已变更问题
  nextTick(() => {
    productRightRef.value.isEmpty = false
    productRightRef.value.dataInspPath = msg.attrs['data-insp-path'];
    const { props = null, currCptIdx = -1, actionComponentsList } = msg
    const classNames = (msg.attrs.class || '').split(' ')
    let centerType = 'default'
    if (classNames.indexOf('center-v') > -1) {
      centerType = 'center-v'
    } else if (classNames.indexOf('center-h') > -1) {
      centerType = 'center-h'
    } else if (classNames.indexOf('center-vh') > -1) {
      centerType = 'center-vh'
    }
    let borderRadiusType = ''
    let borderRadius = 0
    // 四个圆角值相等为normal 否则为special
    if (
      parseFloat(msg.styles['border-top-left-radius']) ===
        parseFloat(msg.styles['border-top-right-radius']) &&
      parseFloat(msg.styles['border-top-right-radius']) ===
        parseFloat(msg.styles['border-bottom-left-radius']) &&
      parseFloat(msg.styles['border-bottom-left-radius']) ===
        parseFloat(msg.styles['border-bottom-right-radius'])
    ) {
      borderRadiusType = 'normal'
      borderRadius = parseFloat(msg.styles['border-top-left-radius'])
    } else {
      borderRadiusType = 'special'
    }
    let borderWidth = msg.styles['border-width']
      ? parseFloat(msg.styles['border-width'])
      : 0
    let borderColor = msg.styles['border-color'] || ''
    let borderStyle = msg.styles['border-style'] || 'solid'
    let boxShadow = ''
    let boxShadowType = false
    let boxShadowColor = ''
    let hShadow = 0
    let vShadow = 0
    let boxShadowBlur = 0
    let boxShadowSpread = 0
    if (msg.styles['box-shadow']) {
      msg.styles['box-shadow'] = convertRgbaToHex(msg.styles['box-shadow'])
      let shadowArr = msg.styles['box-shadow'].split(' ')
      if (msg.styles['box-shadow'].includes('inset')) {
        boxShadowType = true
        shadowArr.splice(shadowArr.length - 1, 1)
      } else boxShadowType = false

      if (msg.styles['box-shadow'].includes('#')) {
        const colorIndex = shadowArr.findIndex(item => item.includes('#'))
        boxShadowColor = shadowArr[colorIndex]
        shadowArr.splice(colorIndex, 1)
      } else {
        boxShadowColor = ''
      }
      hShadow = parseFloat(shadowArr[0])
      vShadow = parseFloat(shadowArr[1])
      boxShadowBlur = shadowArr[2] ? parseFloat(shadowArr[2]) : 0
      boxShadowSpread = shadowArr[3] ? parseFloat(shadowArr[3]) : 0
      boxShadow = `${hShadow}px ${vShadow}px ${boxShadowBlur}px ${boxShadowSpread}px${boxShadowType ? ' inset' : ''}`
    } else {
      boxShadow = '0px 0px 0px 0px'
      boxShadowType = false
      hShadow = 0
      vShadow = 0
      boxShadowBlur = 0
      boxShadowSpread = 0
    }
    // 获取选中元素属性
    const {
      left = '0px',
      top = '0px',
      width = '0px',
      height = '0px',
      color = 'black'
    } = msg.styles
    const stylesProps = {
      left: Math.floor(parseFloat(left)),
      top: Math.floor(parseFloat(top)),
      width: Math.floor(parseFloat(width)),
      widthUnit: width.includes('%') ? '%' : 'px',
      heightUnit: height.includes('%') ? '%' : 'px',
      height: Math.floor(parseFloat(height)),
      fontFamily: msg.styles['font-family'],
      fontSize: Math.floor(parseFloat(msg.styles['font-size'])),
      color,
      backgroundColor: msg.styles['background-color'],
      fontWeight:
        msg.styles['font-weight'] === '700' ||
        msg.styles['font-weight'] === 'bold'
          ? 'bold'
          : 'normal',
      textAlign: msg.styles['text-align'],
      marginTop: Math.floor(parseFloat(msg.styles['margin-top'])),
      marginRight: Math.floor(parseFloat(msg.styles['margin-right'])),
      marginBottom: Math.floor(parseFloat(msg.styles['margin-bottom'])),
      marginLeft: Math.floor(parseFloat(msg.styles['margin-left'])),
      paddingTop: Math.floor(parseFloat(msg.styles['padding-top'])),
      paddingRight: Math.floor(parseFloat(msg.styles['padding-right'])),
      paddingBottom: Math.floor(parseFloat(msg.styles['padding-bottom'])),
      paddingLeft: Math.floor(parseFloat(msg.styles['padding-left'])),
      innerText: msg.innerText,
      centerType,
      actionComponentsList,
      borderRadiusType,
      borderRadius,
      borderTopLeftRadius: Math.floor(
        parseFloat(msg.styles['border-top-left-radius'])
      ),
      borderTopRightRadius: Math.floor(
        parseFloat(msg.styles['border-top-right-radius'])
      ),
      borderBottomLeftRadius: Math.floor(
        parseFloat(msg.styles['border-bottom-left-radius'])
      ),
      borderBottomRightRadius: Math.floor(
        parseFloat(msg.styles['border-bottom-right-radius'])
      ),
      borderWidth,
      borderColor,
      borderStyle,
      boxShadow,
      boxShadowType,
      boxShadowColor,
      hShadow,
      vShadow,
      boxShadowBlur,
      boxShadowSpread
    }
    const initComponents = CanvasStoreState.initComponents.value
    let updateJson = {
      activeName: 'attrs',
      rightProps: stylesProps,
      isOnlyTextNode: msg.isOnlyTextNode,
      currCptIdx,
      isReplaceComponent: msg.isReplaceComponent,
      tagName:
        msg.tagName && msg.tagName.length > 0
          ? msg.tagName.charAt(0).toUpperCase() +
            msg.tagName.slice(1).toLowerCase()
          : ''
    }
    CanvasStore.updateWithJson(updateJson)
  })
}

// rgba颜色转换16进制颜色
const convertRgbaToHex = inputStr => {
  // 匹配rgba颜色值的正则表达式
  const rgbaRegex =
    /rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([01]?\.\d+)\s*\)/gi

  return inputStr.replace(rgbaRegex, (match, r, g, b, a) => {
    // 将RGBA分量转换为16进制
    const hexR = parseInt(r).toString(16).padStart(2, '0')
    const hexG = parseInt(g).toString(16).padStart(2, '0')
    const hexB = parseInt(b).toString(16).padStart(2, '0')
    const hexA = Math.round(parseFloat(a) * 255)
      .toString(16)
      .padStart(2, '0')

    return `#${hexR}${hexG}${hexB}${hexA}`.toUpperCase()
  })
}
</script>

<style lang="scss" scoped>
.product-page {
  height: 100vh;
  background-image: url("@/assets/images/back.svg");
  background-color: #f6f8f9;
}

.product-main {
  display: flex;
  height: calc(100vh - 56px);
  box-sizing: border-box;
}

// 侧边栏
.product-sidebar {
  width: 80px;
  background: #fff;
  border-right: 1px solid rgb(230, 230, 230);
  padding: 8px 0;

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 0;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid rgb(230, 230, 230);
    border-radius: 12px;
    box-sizing: border-box;
    margin: 16px 8px 0;
    color: #1f1f1f;

    &:hover,
    &.active {
      background-color: #358aff;
      color: #fff;
      border: 0;
    }

    .sidebar-icon {
      width: 20px;
      height: 20px;
      margin-bottom: 4px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
    }

    .page-icon {
      background-image: url("@/assets/images/product/sidebar-page.svg");
    }

    .layer-icon {
      background-image: url("@/assets/images/product/sidebar-layer.svg");
    }

    .history-icon {
      background-image: url("@/assets/images/product/sidebar-history.svg");
    }

    &:hover .page-icon,
    &.active .page-icon {
      background-image: url("@/assets/images/product/sidebar-page-select.svg");
    }

    &:hover .layer-icon,
    &.active .layer-icon {
      background-image: url("@/assets/images/product/sidebar-layer-select.svg");
    }

    &:hover .history-icon,
    &.active .history-icon {
      background-image: url("@/assets/images/product/sidebar-history-select.svg");
    }

    span {
      font-size: 12px;
      font-weight: 400;
      line-height: 16px;
    }
  }
}

.product-center {
  display: flex;
  flex-direction: column;
  flex: 1;
  box-shadow: inset 0 0 10px 5px rgba(0, 0, 0, 0.1);

  .product-tools {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 48px;
    padding: 0 16px;
    background: #fff;
  }
  
  .product-tools-type {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1px;
    border: 1px solid #EFEFEF;
    border-radius: 4px;
    li {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96px;
      height: 30px;
      margin-left: 3px;
      text-align: center;
      color: #666;
      border-radius: 4px;
      cursor: pointer;

      &:first-child {
        margin-left: 0;
      }

      &.select,
      &:hover {
        background: #E7F4FF;
        color: #078BFA;
        border-radius: 4px;
      }

      span {
        width: 16px;
        height: 16px;
        margin-right: 3px;
        background-size: contain;
        background-repeat: no-repeat;
        background-position: center;
      }

      .preview-icon {
        background-image: url("/src/assets/images/product/preview.png");
      }

      .edit-icon {
        background-image: url("/src/assets/images/product/edit.png");
      }

      &.select .preview-icon,
      &:hover .preview-icon {
        background-image: url("/src/assets/images/product/preview-select.png");
      }

      &.select .edit-icon,
      &:hover .edit-icon {
        background-image: url("/src/assets/images/product/edit-select.png");
      }
    }
  }

  .product-iframe {
    flex: 1;
    padding: 16px;
    overflow: auto;
    iframe {
      flex: 1;
      width: 100%;
      min-height: 400px;
      background: #fff;
      box-shadow: 0 1px 4px rgba(64, 158, 255, 0.1);
    }
  }

  .product-drawing {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 100%;

    .ai-icon {
      width: 40px;
      height: 40px;
    }

    .ai-icon-max {
      width: 64px;
      height: 64px;
    }

    p {
      margin-top: 10px;
    }
  }
}
</style>
