<template>
  <div
    class="product-left"
    :class="{ collapsed: isListCollapsed }"
    ref="productLeft"
  >
    <div class="product-left-inner" v-show="!isListCollapsed">
      <div class="header-section">
        <span class="page-count">页面({{ pageNumber }})</span>
        <div class="generate-all-button" @click="handleGenerateAll">
          <img src="@/assets/images/ai-blue-planar.png" class="ai-icon" />
          <span class="button-text">生成全部页面</span>
        </div>
      </div>
      <!-- 折叠面板 -->
      <CustomCollapse accordion v-model="activeName">
        <CustomCollapseItem
          v-for="(ls, index) in categoryList"
          :key="index"
          :name="index"
        >
          <template #title>
            <div>{{ ls.title }}</div>
          </template>
          <ul class="product-list" ref="productList">
            <li
              v-for="item in ls.list"
              :key="item.id"
              :class="{ active: item.active }"
              @click="handlePageClick(item)"
              :ref="setItemRef(item.pageId)"
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
        </CustomCollapseItem>
      </CustomCollapse>
    </div>
    <div
      class="product-toggle"
      :class="{ collapsed: isListCollapsed }"
      @click="toggleList"
    >
      <el-icon>
        <ArrowRight v-if="isListCollapsed" />
        <ArrowLeft v-else />
      </el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import createApiEndpoints from "@/common/api.js";
import request from "@/common/request.js";
import { useAppStore } from "@/stores/app";
import useCanvasStore from "stores/canvas";
import { safeJsonStringify } from '@/utils'
import { confirmAction } from '@/utils/confirm'

const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)

const props = defineProps({
  categoryList: {
    type: Array,
    default: () => [],
  },
  pageList: {
    type: Array,
    default: () => [],
  },
  projectId: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["page-select", "startPolling"]);

const appStore = useAppStore();
let api;

// 响应式数据
const isListCollapsed = ref(false);
const activeName = ref(0);
const productLeft = ref(null);
const productListRefs = ref({});

// 计算属性
const pageNumber = computed(() => {
  return props.categoryList.reduce(
    (acc, category) => acc + category.list.length,
    0
  );
});

const serverUrl = computed(() => appStore.serverUrl);

// 生命周期钩子
onMounted(async () => {
  api = await createApiEndpoints();
  // 组件挂载后的逻辑
});

// 方法
const setItemRef = (pageId) => (el) => {
  if (el) {
    productListRefs.value[pageId] = el;
  }
};

const handlePageClick = async (item) => {
  if (item.active) {
    return;
  }

  const mode = CanvasStoreState.mode.value;
  if (mode === 'edit') {
    ElMessage({
      message: '编辑状态下不可切换页面！',
      type: 'warning',
    })
    return;
  }

  // 先判断可视化是否有未提交的修改
  const domList = JSON.parse(sessionStorage.getItem('domList'));
  console.log('domList', domList)
  if (domList && domList.length > 0) {
    const isConfirmed = await confirmAction('您修改的内容尚未提交，是否确定离开当前页面？');
    if (isConfirmed) {
      // 离开时清空保存的修改数据
      sessionStorage.removeItem('domList');
    } else {
      return;
    }
  }

  // 切换页面前先清空编辑数据
  CanvasStore.reset();
  if(window._child_win) {
    window._child_win.postMessage(safeJsonStringify({
      type: "clear-dom-list",
    }), '*')
  }
  
  // 通知父组件处理页面点击和激活状态更新
  emit("page-select", item);
};

// 切换列表显示状态
const toggleList = () => {
  isListCollapsed.value = !isListCollapsed.value;
};

// 滚动到激活页面位置
const scrollToActivePage = () => {
  // 查找激活的页面元素
  let activePage = null;
  let activeCategoryIndex = -1;

  for (let i = 0; i < props.categoryList.length; i++) {
    activePage = props.categoryList[i].list.find((page) => page.active);
    if (activePage) {
      activeCategoryIndex = i;
      activeName.value = i; // 激活当前页面所在面板
      break;
    }
  }

  // 如果找到了激活的页面，滚动到对应位置
  if (activePage && activeCategoryIndex !== -1) {
    nextTick(() => {
      const pageElement = productListRefs.value[activePage.pageId];
      if (pageElement) {
        pageElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    });
  }
};

// 处理生成全部页面按钮点击
const handleGenerateAll = async () => {
  let arr = props.pageList.filter(
    (item) => item.status != "done" && item.status != "generating"
  );
  arr = arr.map((page) => {
    return {
      ...page,
      status: "generating",
    };
  });
  if (!arr.length) {
    ElMessage.warning("页面已全部生成完毕，无需重复生成");
    return;
  }
  try {
    // 调用后端接口生成全部页面
    const res = await request({
      url: api.generateCode,
      method: "post",
      data: {
        projectId: props.projectId,
        pages: arr,
        model: localStorage.getItem("pageModel") || "qwen-coder",
      },
    });

    console.log("res", res);
    if (res.data.status == "success") {
      // 成功提示
      ElMessage.success("生成全部页面请求已发送");

      // 开启轮询
      emit("startPolling");
    }
  } catch (error) {
    console.error("生成全部页面失败", error);
    ElMessage.error("生成全部页面失败: " + (error.message || "未知错误"));
  }
};

// 暴露方法给父组件
defineExpose({
  scrollToActivePage,
});
</script>

<style lang="scss" scoped>
.product-left {
  position: relative;
  width: 232px;
  transition: width 0.3s ease;

  &.collapsed {
    width: 0;
  }
}

.product-left-inner {
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

  .generate-all-button {
    display: flex;
    align-items: center;
    padding: 6px 16px;
    background: linear-gradient(to right, #c8e9ff, #dedcff);
    box-shadow: 0 2px 4px rgba(64, 158, 255, 0.1);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.2s ease;

    .ai-icon {
      width: 14px;
      height: 14px;
      // filter: invert(42%) sepia(92%) saturate(1404%) hue-rotate(190deg) brightness(101%) contrast(99%);
    }

    .button-text {
      font-size: 12px;
      font-weight: 600;
      background: linear-gradient(90deg, #426fff 0%, #a054ff 100%);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }
}

.product-list {
  padding-bottom: 16px;
  background: #f8f8f8;
  li {
    padding: 16px 16px 0;
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

.product-toggle {
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
</style>
