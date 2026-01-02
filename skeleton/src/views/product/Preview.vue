<template>
  <div class="preview-page">
    <Header :projectName="projectName" />

    <div class="preview-main">
      <div class="preview-left" :class="{ collapsed: isListCollapsed }">
        <div class="preview-left-inner" v-show="!isListCollapsed">
          <div class="header-section">
            <span class="page-count">页面({{ pageNumber }})</span>
          </div>
          <!-- 折叠面板 -->
          <DiyCollapse accordion :value="activeName">
            <DiyCollapseItem
              v-for="(ls, index) in categoryList"
              :key="index"
              :name="index"
            >
              <template #title>
                <div>{{ ls.title }}</div>
              </template>
              <ul class="preview-list">
                <li
                  v-for="item in ls.list"
                  :key="item.id"
                  :class="{ active: item.active }"
                  @click="handlePageClick(item)"
                >
                  <div>
                    <img
                      v-if="item.status == 'done' && item.imgUrl"
                      :src="
                        item.imgUrl.indexOf('base64') !== -1
                          ? item.imgUrl
                          : serverUrl + item.imgUrl
                      "
                      class="list-thumbnail"
                    />
                    <img
                      v-else-if="item.status == 'done' && !item.imgUrl"
                      src="@/assets/images/ai-colorful.png"
                      class="ai-icon"
                    />
                    <img
                      v-else-if="item.status == 'generating'"
                      src="@/assets/images/ai-loading.webp"
                      class="ai-icon-max"
                    />
                    <img
                      v-else-if="item.status == 'error'"
                      src="@/assets/images/ai-black.png"
                      class="ai-icon"
                    />
                    <img
                      v-else
                      src="@/assets/images/ai-gray.png"
                      class="ai-icon"
                    />
                  </div>
                  <p>{{ item.name }}</p>
                </li>
              </ul>
            </DiyCollapseItem>
          </DiyCollapse>
        </div>
        <div
          class="preview-toggle"
          :class="{ collapsed: isListCollapsed }"
          @click="toggleList"
        >
          <el-icon>
            <ArrowRight v-if="isListCollapsed" />
            <ArrowLeft v-else />
          </el-icon>
        </div>
      </div>

      <div class="preview-center">
        <iframe
          v-if="selectedPage && selectedPage.status == 'done'"
          :src="iframeSrc"
          frameborder="0"
          :style="getIframeStyle()"
        ></iframe>
        <div
          v-else-if="selectedPage && selectedPage.status == 'generating'"
          class="preview-drawing"
        >
          <img class="ai-icon-max" src="@/assets/images/ai-loading.webp" />
          <p>页面正在绘制，请稍后…</p>
        </div>
        <div
          v-else-if="selectedPage && selectedPage.status == 'error'"
          class="preview-drawing"
        >
          <img class="ai-icon" src="@/assets/images/ai-black.png" />
          <p>页面生成失败，请重新生成</p>
        </div>
        <div v-else class="preview-drawing">
          <img class="ai-icon" src="@/assets/images/ai-gray.png" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute, useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import DiyCollapse from "@/common/components/Collapse.vue";
import DiyCollapseItem from "@/common/components/CollapseItem.vue";
import Header from "@/common/components/Header.vue";
import request from "@/common/request.js";
import createApiEndpoints from "@/common/api.js";
import { useAppStore } from "@/stores/app";

// 使用路由和store
const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
const { serverUrl, clientUrl } = storeToRefs(appStore);

// 定义响应式数据
let api;
const projectId = ref("");
const pageId = ref("");
const iframeSrc = ref("");
const selectedPage = ref(null);
const projectName = ref("");
const activeName = ref(0); // 默认激活第一个面板
const categoryList = ref([]);
const isListCollapsed = ref(false); // 控制列表是否收起
const resolutionWidth = ref(null);
const resolutionHeight = ref(null);

// 计算属性
const pageNumber = computed(() => {
  return categoryList.value.reduce(
    (acc, category) => acc + category.list.length,
    0
  );
});

// 生命周期钩子
onMounted(async () => {
  api = await createApiEndpoints();
  getParams();
  initGetPages();
  // 添加 iframe 通信事件监听器
  window.addEventListener("message", handleIframeMessage);
});

onBeforeUnmount(() => {
  // 移除 iframe 通信事件监听器
  window.removeEventListener("message", handleIframeMessage);
});

// 获取路由参数
const getParams = () => {
  projectId.value = route.query.projectId || "";
  pageId.value = route.query.pageId || "";
};

// 初始化页面数据
const initGetPages = async () => {
  try {
    const res = await request({
      url: api.getPages,
      method: "post",
      data: {
        projectId: projectId.value,
      },
    });
    projectName.value = res.data[projectId.value].projectName || "";

    // 处理分辨率数据（所有页面统一的分辨率）
    if (res.data.resolution) {
      const [width, height] = res.data.resolution.split("*").map(Number);
      resolutionWidth.value = width;
      resolutionHeight.value = height;
    }

    // 转换数据结构
    categoryList.value = res.data.categoryList;

    // 根据pageId参数定位具体页面
    setActivePage();
  } catch (error) {
    console.error("页面数据请求失败", error);
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
};

// 处理页面点击
const handlePageClick = (item) => {
  // 更新页面列表中的激活状态
  categoryList.value.forEach((ls) => {
    ls.list.forEach((page) => {
      page.active = page.pageId === item.pageId;
    });
  });

  // 根据选中的页面更新iframe的src
  iframeSrc.value = `${clientUrl.value}/#/${item.pageId}`;
  // 更新选中的页面数据
  selectedPage.value = item;

  // 更新路由参数中的pageId
  router.replace({
    query: {
      ...route.query,
      pageId: item.pageId,
    },
  });
};

// iframe 通信事件处理
const handleIframeMessage = (event) => {
  const message = event.data;
  let page = null;

  console.log("拿到模板页面传来的message", message);
  // 判断是否有对应的页面
  for (let i = 0; i < categoryList.value.length; i++) {
    page = categoryList.value[i].list.find(
      (page) => page.pageId === message.data.pageId
    );
    if (page) {
      activeName.value = i; // 激活当前页面所在面板
      break;
    }
  }
  if (!page) {
    return;
  }

  // 根据消息类型处理不同的事件
  if (message.type === "ROUTE_CHANGED") {
    console.log("接收到iframe路由变化");
    // 防止重复处理：如果当前选中的页面就是消息中的页面，则不处理
    if (!selectedPage.value || selectedPage.value.pageId !== page.pageId) {
      // 根据pageId选中页面
      handlePageClick(page);
    } else {
      console.log("页面已选中，跳过重复处理");
    }
  }
};

// 切换列表显示状态
const toggleList = () => {
  isListCollapsed.value = !isListCollapsed.value;
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
</script>

<style lang="scss" scoped>
.preview-page {
  height: 100vh;
  background-image: url("@/assets/images/back.svg");
  background-color: #f6f8f9;
}

.preview-main {
  display: flex;
  height: calc(100vh - 56px);
  box-sizing: border-box;
}

.preview-left {
  position: relative;
  width: 232px;
  transition: width 0.3s ease;

  &.collapsed {
    width: 0;
  }
}

.preview-left-inner {
  width: 100%;
  height: 100%;
  background: #fff;
  overflow-y: auto;

  .header-section {
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    left: 0;
    width: 100%;
    height: 44px;
    padding: 0 16px;
    border-bottom: 1px solid rgb(239, 239, 239);
    font-size: 14px;
    background-color: #fff;
    z-index: 10;
  }

  .page-count {
    color: #4e4e4e;
    font-size: 14px;
    font-weight: 500;
  }

  .preview-list {
    li {
      margin: 16px;
      cursor: pointer;

      div {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 112px;
        background: #f2f5f6;
        border: 1px solid rgba(230, 230, 230, 1);
        border-radius: 8px;
        overflow: hidden;

        .list-thumbnail {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .ai-icon {
          width: 40px;
          height: 40px;
          // filter: brightness(90%) contrast(90%);
        }
        .ai-icon-max {
          width: 64px;
          height: 64px;
        }
      }

      p {
        margin-top: 4px;
        font-size: 12px;
      }

      &.active div {
        border: 2px solid #007bff;
      }
      &:hover div {
        border: 1px solid #007bff;
      }
    }
  }
}

.preview-toggle {
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
  right: -14px;
  // left: 306px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 100px;
  border-radius: 0 10px 10px 0;
  background: #fff;
  cursor: pointer;
}

.preview-center {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 16px;
  box-shadow: inset 0 0 20px 5px rgba(0, 0, 0, 0.1);
  overflow: auto;

  iframe {
    flex: 1;
    width: 100%;
    min-height: 400px;
    background: #fff;
    box-shadow: 0 1px 4px rgba(64, 158, 255, 0.1);
  }

  .preview-drawing {
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
