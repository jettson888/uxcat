<template>
  <div v-if="!empty" class="right-box">
    <div class="right-content" v-if="!showDrawer">
      <div class="element-style-panel">
        <div class="text-style-panel">
          <div class="element-title" v-if="currCptIdx <= 100000">
            <span>页面元素<font class="tagname-light">{{ tagName }}</font></span>
            <el-button @click="resetDom">重置</el-button>
            <!-- <el-button type="primary" class="replaceBtn" @click="gotoReplace">组件替换</el-button> -->
          </div>
          <div class="element-title" v-else>
            <span>{{ initComponents[currCptIdx].name }}<font class="tagname-light">{{initComponents[currCptIdx].elementName ? initComponents[currCptIdx].elementName : Array.isArray(initComponents[currCptIdx].componentName) ? initComponents[currCptIdx].componentName[0] : initComponents[currCptIdx].componentName}}</font></span>
          </div>
          <CustomCollapse v-model="componentDftExpend" v-if="currCptIdx > 100000">
            <CustomCollapseItem name="1" :icon="CaretRight">
              <template #title>
                <div class="title-box">
                  <span class="title">基础配置</span>
                </div>
              </template>
              <div class="content-wrap">
                <div class="item" v-if="!isReplaceComponent && initComponents[currCptIdx].needPos">
                  <div class="label">插入位置</div>
                  <div class="form-item align-left">
                    <el-select
                      :suffix-icon="CaretBottom"
                      class="width-188 height-36"
                      v-model="initComponents[currCptIdx].appendPosition"
                      placeholder="请选择组件插入位置"
                      @change="(e) => changeAppendPosition(e)"
                    >
                      <el-option
                        v-for="option in positionOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </el-select>
                  </div>
                </div>
                <item-property
                  v-for="(item, index) in initComponents[currCptIdx].properties"
                  :key="index"
                  :properties="item"
                />
              </div>
            </CustomCollapseItem>
            <CustomCollapseItem name="2" :icon="CaretRight" v-if="initComponents[currCptIdx].styles">
              <template #title>
                <div class="title-box">
                  <span class="title">边距</span>
                </div>
              </template>
              <MarginAndPadding type="component" />
            </CustomCollapseItem>
            <CustomCollapseItem name="3" :icon="CaretRight" v-if="initComponents[currCptIdx].needBorder">
              <template #title>
                <div class="title-box">
                  <span class="title">边框</span>
                </div>
              </template>
              <div class="content-wrap">
                <Border type="component" />
              </div>
            </CustomCollapseItem>
          </CustomCollapse>
          <CustomCollapse v-model="collapseName" accordion v-else>
            <CustomCollapseItem name="1" :icon="CaretRight">
              <template #title>
                <div class="title-box">
                  <span class="title">基础配置</span>
                </div>
              </template>
              <div class="content-wrap">
                <BaseConfig />
              </div>
            </CustomCollapseItem>
            <CustomCollapseItem name="2" :icon="CaretRight">
              <template #title>
                <div class="title-box">
                  <span class="title">边距</span>
                </div>
              </template>
              <MarginAndPadding />
            </CustomCollapseItem>
            <CustomCollapseItem name="3" :icon="CaretRight">
              <template #title>
                <div class="title-box">
                  <span class="title">边框</span>
                </div>
              </template>
              <div class="content-wrap">
                <Border />
              </div>
            </CustomCollapseItem>
            <CustomCollapseItem name="4" :icon="CaretRight">
              <template #title>
                <div class="title-box">
                  <span class="title">阴影</span>
                </div>
              </template>
              <div class="content-wrap">
                <Shadow />
              </div>
            </CustomCollapseItem>
            <CustomCollapseItem name="5" :icon="CaretRight" v-if="rightProps.actionComponentsList&&rightProps.actionComponentsList.length>0">
              <template #title>
                <div class="title-box">
                  <span class="title">交互组件信息</span>
                </div>
              </template>
              <div class="content-wrap action-item" v-for="(item, index) in rightProps.actionComponentsList" :key="index">
                <p class="action-title">交互组件{{ index + 1 }}</p>
                <div class="action-content">
                  <span class="action-label">组件名称</span>
                  <span class="action-name">{{ item.name }}</span>
                </div>
                <div class="action-content">
                  <span class="action-label">绑定事件</span>
                  <span class="action-name">{{ item.triggerEvent.label }}</span>
                </div>
                <img class="action-edit" @click="editActionComponent(item.componentId)" src="@/assets/icons/edit.png" alt="加载中...">
                <img class="action-delete" @click="deleteActionComponent(item.componentId)" src="@/assets/icons/delete.svg" alt="加载中...">
              </div>
            </CustomCollapseItem>
          </CustomCollapse>
        </div>
      </div>
    </div>
    <!-- <PropDrawer v-else></PropDrawer> -->
  </div>
  <div v-else class="right-empty">请选中画布区域元素进行配置</div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { ref } from "vue";
import BaseConfig from "./BaseConfig.vue"
import MarginAndPadding from "./MarginAndPadding.vue";
import Border from "./Border.vue"
import Shadow from "./ Shadow.vue"
import ItemProperty from "./ItemProperty.vue";
// import PropDrawer from "./PropDrawer.vue";
import { CaretRight, CaretBottom } from '@element-plus/icons-vue'
import useCanvasStore from "stores/canvas";
import { safeJsonStringify } from "@/utils";
const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)
const { tagName, rightProps, currCptIdx, initComponents, showDrawer, isReplaceComponent } = CanvasStoreState;
const props = defineProps({
  empty: {
    type: Boolean,
    required: true,
    default: true,
  },
});
const componentDftExpend = ["1", "2", "3"] 
const positionOptions = ref([
  {
    label: "元素前插入",
    value: "before"
  },
  {
    label: "元素后插入",
    value: "after"
  },
  // {
  //   label: "元素内起始位置插入",
  //   value: "in-before"
  // },
  // {
  //   label: "元素内结束位置插入",
  //   value: "in-after"
  // }
])
watch(
  () => props.empty,
  () => {
    collapseName.value = "1"
  }
)
const collapseName = ref("1");
const gotoReplace = () => {
  CanvasStore.updateWithJson({
    showDrawer: true,
    // currentComponentsValue: safeJsonParse(safeJsonStringify(component))
  })
}
// dom元素配置回滚
const resetDom = () => {
  console.log("触发点击")
  sendMessage({
    key: "key",
    value: ""
  }, "reset-dom")
}
/**
 * 变更组件插入位置
 */
const changeAppendPosition = (value) => {
  sendMessage({
    key: "appendPosition",
    value
  })
}
/**
 * 修改交互组件
 */
const editActionComponent = (componentId) => {
  CanvasStore.updateWithJson({
    componentDrawerVisible: true,
    currCptIdx: componentId,
    saveCurrCptIdx: currCptIdx.value
  })
}
/**
 * 删除交互组件
 */
const deleteActionComponent = (componentId) => {
  sendMessage({
    key: "componentId",
    value: componentId
  }, "delete-dom")
}
const sendMessage = ({ key, value }, type = "update-attrs", msgKey = "data") => {
  const dataKey = type === "update-attrs" ? "style" : msgKey
  if (window._child_win) {
    const msg = {
      type,
      [dataKey]: {
        key,
        value,
      },
    };
    window._child_win.postMessage(safeJsonStringify(msg), "*");
  }
};
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  height: 36px;
  line-height: 36px;
  margin-bottom: 12px;
  .label {
    font-size: 14px;
    color: #1F1F1F;
    font-weight: 400;
    width: 84px;
    text-align: left;
  }
  .form-item {
    width: 188px;
    margin-left: 8px;
    text-align: left;
  }
  .width-188 {
    width: 188px;
  }
  .height-36 {
    height: 36px;
    line-height: 36px;
  }
}
.content-wrap {
  background-color: #F2F5F6;
  padding: 12px;
  border-radius: 4px;
  width: 304px;
  margin: 12px;
}
// .title-box {
//   display: flex;
//   align-items: center;
//   height: 56px;
//   line-height: 56px;
//   padding: 0 16px;
//   .title {
//     font-size: 14px;
//     font-weight: 600;
//     color: #1F1F1F;
//   }
// }
.right-box {
  flex: 1;
  width: 100%;
  overflow: hidden;
  // height: calc(100% - 50px);
  .right-title {
    line-height: 48px;
  }
  .right-content {
    font-size: 13px;
    // overflow-y: scroll;
    // overflow-x: hidden;
    height: 100%;
  }
}
.right-empty {
  flex: 1;
  line-height: 48px;
  text-align: center;
  color: gray;
  font-size: 14px;
}
.text-style-panel {
  user-select: none;
}
.action-item {
  height: 100px;
  padding: 12px;
  text-align: left;
  position: relative;
  .action-edit, .action-delete {
    width: 16px;
    height: 16px;
    cursor: pointer;
    position: absolute;
    top: 14px;
    right: 12px;
  }
  .action-edit {
    right: 40px;
  }
}
.action-title {
  font-size: 14px;
  color: #1F1F1F;
  line-height: 22px;
  font-weight: 700;
}
.action-content {
  margin-top: 4px;
  .action-label {
    font-size: 14px;
    color: #999;
    line-height: 22px;
    font-weight: 400;
    margin-right: 8px;
  }
  .action-name {
    font-size: 14px;
    color: #1F1F1F;
    line-height: 22px;
    font-weight: 400;
  }
}
.element-title {
  line-height: 48px;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #efefef;
  .replaceBtn {
    height: 30px;
    font-size: 14px;
    color: white;
    font-weight: 400;
  }
  .tagname-light {
    color: #409eff;
    margin-left: 4px;
  }
}
</style>

<style scoped>
:deep(.full-ratio .el-radio-button__inner) {
  width: 100%;
}

:deep(.full-ratio .el-radio-button) {
  position: relative;
  display: inline-flex;
  outline: 0;
  flex: 1;
}
:deep(.full-checkbox .el-checkbox-button) {
  position: relative;
  display: inline-flex;
  outline: 0;
  flex: 1;
}

:deep(.full-checkbox .el-checkbox-button__inner) {
  width: 100%;
}
:deep(.el-input .el-input-group__prepend) {
  padding: 0 5px;
}
:deep(.el-input .el-input-group__append) {
  padding: 0 5px;
}
:deep(.full-ratio .el-radio-button__inner) {
  width: 100%;
}
:deep(.size-row .el-input-group__prepend) {
  min-width: 24px;
}
</style>
