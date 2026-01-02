<template>
  <div class="product-right">
    <!-- 自定义 Tab 切换组件 -->
    <div class="product-tabs">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'ai' }"
        @click="setActiveTab('ai')"
      >
        <img :src="activeTab === 'ai' ? aiSelectSrc : aiSrc" class="ai-icon" />
        <span class="tab-label">AI助手</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'design' }"
        @click="setActiveTab('design')"
      >
        <img :src="activeTab === 'design' ? designSelectSrc : designSrc" />
        <span class="tab-label">设计</span>
      </div>
    </div>

    <!-- Tab 内容区域 -->
    <div class="tab-content">
      <!-- AI助手内容 -->
      <div v-show="activeTab === 'ai'" class="ai-assistant-content">
        <div class="page-info">
          <ul class="section-title">
            <li class="section-page" :class="isEmpty? 'select' : ''" @click="handlePageClick">
              <i></i>
              <span>页面</span>
            </li>
            <li v-if="!isEmpty" class="section-separator">></li>
            <li v-if="!isEmpty" class="section-element">
              <i></i>
              <span>元素</span>
            </li>
          </ul>
          <!-- 修改整个页面 -->
          <div v-if="isEmpty" class="edit-page">
            <div class="input-group">
              <label class="form-label">名称</label>
              <input
                v-model="pageName"
                class="input-field"
                placeholder="请输入页面名称"
              />
            </div>
            <div class="input-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="pageDescription"
                class="textarea-field"
                placeholder="请输入页面描述"
              ></textarea>
            </div>
          </div>
          <!-- 只修改某个元素 -->
          <div v-else class="edit-page">
            <div class="input-group">
              <label class="form-label">描述</label>
              <textarea
                v-model="elementDescription"
                class="textarea-field"
                placeholder="输入你想要的内容，例如对布局、图形、颜色、大小的更改，或者增加内容，描述的越清楚，AI生成效果越好"
              ></textarea>
            </div>
          </div>
          <!-- AI大模型 -->
          <div class="input-group">
            <label class="form-label">模型</label>
            <el-select v-model="model" style="width: 100%">
              <el-option
                v-for="item in modelList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
              </el-option>
            </el-select>
          </div>
        </div>
        <div class="action-button" @click="regeneratePage">
          <img src="@/assets/images/ai-colorful.png" />
          重新生成
        </div>
      </div>

      <!-- 设计内容 -->
      <div v-show="activeTab === 'design'" class="design-content">
        <CanvasRight :empty="isEmpty" />
        <div class="design-submit" @click="submitEdit">
          <div>提交修改</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import request from "@/common/request";
import createApiEndpoints from "@/common/api.js";
import { modelList } from "@/common/modelConfig.js";
import aiSelectSrc from '@/assets/images/ai-blue.png';
import aiSrc from '@/assets/images/ai-black.png';
import designSelectSrc from '@/assets/images/product/design-select.svg';
import designSrc from '@/assets/images/product/design.svg';
import CanvasRight from './CanvasRight/index.vue'
import { safeJsonStringify } from '@/utils'

const props = defineProps({
  pageData: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(["startPolling"]);

const route = useRoute();
let api;

// 响应式数据
const activeTab = ref("ai");
const pageName = ref("");
const pageDescription = ref("");
const elementDescription = ref("");
const model = ref("qwen-coder");
const loading = ref({
  regenerate: false,
});
const isEmpty = ref(true) // 可视化画布是否为空
const dataInspPath = ref("") // 当前选中的元素信息

// 监听器
watch(
  () => props.pageData,
  (newVal) => {
    if (newVal) {
      pageName.value = newVal.name || "";
      pageDescription.value = newVal.description || "";
    }
  },
  { immediate: true }
);

watch(model, (newVal) => {
  // 当model改变时，保存到localStorage
  localStorage.setItem("pageModel", newVal);
});

// 生命周期钩子
onMounted(async () => {
  api = await createApiEndpoints();
  // 从localStorage获取保存的model值
  const pageModel = localStorage.getItem("pageModel");
  if (pageModel) {
    // 验证保存的model是否在modelList中
    const isValidModel = modelList.some((item) => item.value === pageModel);
    if (isValidModel) {
      model.value = pageModel;
    }
  }
});

// 方法
const setActiveTab = (tab) => {
  activeTab.value = tab;
};

// 重新生成
const regeneratePage = async () => {
  loading.value.regenerate = true;
  try {
    // 准备提交的数据
    const requestData = {
      ...props.pageData,
      // name: pageName.value,
      // description: pageDescription.value,
      projectId: route.query.projectId,
      status: "generating",
      model: model.value,
    };

    if (isEmpty.value) { // 修改整个页面
      requestData.name = pageName.value;
      requestData.description = pageDescription.value;
    } else { // 只修改某个元素
      requestData.element = dataInspPath.value;
      requestData.elementDescription = elementDescription.value;
    }

    // 调用后端 API
    const res = await request({
      url: api.generateRecode,
      method: "post",
      data: requestData,
    });

    if (res.data.status == "success") {
      // 成功提示
      ElMessage.success("页面重新生成请求已发送");

      updateCallback()
    }
  } catch (error) {
    console.error("重新生成页面失败:", error);
    // 错误提示
    ElMessage.error("重新生成页面失败: " + (error.message || "未知错误"));
  } finally {
    loading.value.regenerate = false;
  }
};

// 点击页面
const handlePageClick = () => {
  // 清除元素选中状态
  if(window._child_win) {
    window._child_win.postMessage(safeJsonStringify({
      type: "clear-dom-select",
    }), '*')
  }
  // 隐藏画布
  isEmpty.value = true;
}

// 点击提交修改
const submitEdit = () => {
  if(window._child_win) {
    window._child_win.postMessage(safeJsonStringify({
      type: 'render-prompt'
    }), '*')
  }
}

// 将修改数据提交到后端接口
const updateCode = async (editData) => {
  console.log('editData', editData)
  try {
    // 准备提交的数据
    const requestData = {
      projectId: route.query.projectId,
      pageId: props.pageData.pageId,
      metas: editData.msg,
    };

    // 调用后端 API
    const res = await request({
      url: api.generateStyles,
      method: "post",
      data: requestData,
    });

    if (res.data.status == "success") {
      // 成功提示
      ElMessage.success("页面修改提交成功");

      updateCallback()
    }
  } catch (error) {
    console.error("页面修改提交失败:", error);
    // 错误提示
    ElMessage.error("页面修改提交失败: " + (error.message || "未知错误"));
  } finally {
    
  }
}

// 页面重新生成后的处理逻辑
const updateCallback= () => {
  // 提交成功后清空修改数据
  if(window._child_win) {
    window._child_win.postMessage(safeJsonStringify({
      type: "clear-dom-list",
    }), '*')
  }

  // 切换预览状态
  emit("switchType", "preview");

  // 开启轮询
  emit("startPolling");
}

// 暴露需要让父组件访问的方法或状态
defineExpose({
  isEmpty,
  dataInspPath,
  updateCode
})
</script>

<style lang="scss" scoped>
.product-right {
  display: flex;
  flex-direction: column;
  width: 328px;
  background-color: #fff;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.1);
}

/* 自定义 Tab 样式 */
.product-tabs {
  display: flex;
  height: 44px;
  border-bottom: 1px solid #efefef;

  .tab-item {
    display: flex;
    justify-content: center;
    align-items: center;
    // width: 50%;
    width: 100%;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;

    img {
      margin: 0 2px -2px 0;
    }

    &.active {
      border-bottom: 2px solid #078bfa;
      color: #078bfa;
    }

    .ai-icon {
      width: 12px;
      height: 12px;
      // filter: drop-shadow(1px 0 0 #078bfa) drop-shadow(-1px 0 0 #078bfa) drop-shadow(0 1px 0 #078bfa) drop-shadow(0 -1px 0 #078bfa);
    }
  }
}

.tab-content {
  flex: 1;
  overflow-y: auto;
}

/* AI助手内容样式 */
.ai-assistant-content {
  display: flex;
  flex-direction: column;
  gap: 20px;

  .page-info {
    padding: 20px;
  }

  .section-title {
    display: flex;
    font-size: 14px;
    height: 20px;

    li {
      display: flex;
      align-items: center;
      height: 100%;
    }
    .section-page {
      color: #999;
      cursor: pointer;
      i {
        width: 16px;
        height: 16px;
        margin: 2px 3px 0 0;
        background-image: url('@/assets/images/product/ai-page.png');
        background-size: cover;
      }
      &:hover, &.select {
        color: #1F1F1F;
        i {
          background-image: url('@/assets/images/product/ai-page-select.png');
        }
      }
    }
    .section-separator {
      padding: 3px 8px 0;
      color: #999;
    }
    .section-element {
      color: #1F1F1F;
      i {
        width: 16px;
        height: 16px;
        margin: 2px 3px 0 0;
        background-image: url('@/assets/images/product/ai-element.png');
        background-size: cover;
      }
    }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    margin-top: 16px;

    .form-label {
      margin-bottom: 10px;
      font-size: 12px;
    }

    .input-field {
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      padding: 12px 16px;
      outline: none;
    }

    .textarea-field {
      border: 1px solid rgba(230, 230, 230, 1);
      border-radius: 4px;
      padding: 12px 16px;
      min-height: 200px;
      white-space: pre-wrap;
      outline: none;
    }
  }

  .action-button {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 36px;
    margin: 0 16px;
    border-radius: 8px;
    font-size: 14px;
    color: #fff;
    background: linear-gradient(90deg, #426fff 0%, #a054ff 100%);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover {
      background: linear-gradient(90deg, #5b5bff 0%, #b35bff 100%);
      box-shadow: 0 4px 12px rgba(123, 97, 255, 0.3);
    }

    img {
      width: 16px;
      height: 16px;
      margin-right: 8px;
    }
  }
}

/* 设计内容区域 */
.design-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 200px;
}

.design-submit {
  height: 64px;
  padding: 12px 16px;
  border-top: 1px solid #E6E6E6;
  div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #078BFA;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
  }
}
</style>
