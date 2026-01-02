<template>
  <div class="item" :class="{'height-68': properties.type === 'textarea'&&align!=='right','height-80': properties.type === 'textarea'&&align==='right', 'height-auto': properties.type === 'json' || properties.type === 'style-json' || properties.type === 'tabs' }" v-if="!properties.hidden">
    <div class="label" :class="{'alignRight':align==='right'}">{{ properties.name }}<QuestionFilled v-if="!!properties.tips" :content="properties.tips" /></div>
    <div class="form-item align-left" :class="{'l-12':align==='right', 'is-tabs': properties.type === 'tabs'}">
      <!-- 下拉列表 -->
      <el-select
        :suffix-icon="CaretBottom"
        class="width-188 height-36"
        :class="{'width-160':align==='right'}"
        v-model="properties.value"
        :placeholder="properties.placeholder"
        v-if="properties.type === 'select'"
        @change="(e) => updateProps(e, properties.attr)"
      >
        <el-option
          v-for="option in properties.options"
          :key="option"
          :label="properties.isLabelValue?option.label:option"
          :value="properties.isLabelValue?option.value:option"
        />
      </el-select>
      <el-select
        :suffix-icon="CaretBottom"
        class="width-188 height-36"
        :class="{'width-160':align==='right'}"
        v-model="properties.value"
        :placeholder="properties.placeholder"
        v-if="properties.type === 'select-change'"
        @change="(e) => updateValue(properties.controllerKey, properties.map[e])"
      >
        <el-option
          v-for="option in properties.options"
          :key="option"
          :label="properties.isLabelValue?option.label:option"
          :value="properties.isLabelValue?option.value:option"
        />
      </el-select>
      <!-- 文本输入框 -->
      <el-input
        class="width-188 height-36"
        :class="{'width-336':align==='right'}"
        v-model="properties.value"
        :placeholder="properties.placeholder"
        v-if="properties.type === 'input'"
        @input="(e) => updateProps(e, properties.attr)"
      />
      <!-- 数字输入框 -->
      <el-input
        class="width-188 height-36"
        :class="{'width-336':align==='right'}"
        v-model.number="properties.value"
        onkeyup="value=value.replace(/[^\d]/g,'')"
        :placeholder="properties.placeholder"
        v-if="properties.type === 'number-input'"
        @input="
          (e) =>
            updateProps(
              ~~e > 0 ? ~~e : 0,
              properties.attr
            )
        "
      />
      <!-- 带单位的数字输入框 -->
      <div v-if="properties.type === 'input-select'" class="input-select-wrap">
        <el-input-number
          class="width-188 height-36"
          :class="{'width-336':align==='right'}"
          v-model="properties.value"
          :placeholder="properties.placeholder"
          controls-position="right"
          style="width:120px"
          :min="0"
          @input="(e) => updateProps(e+properties.unitValue, properties.attr, false, properties.unitValue)"
        />
        <el-select v-model="properties.unitValue" style="width:64px;margin-left:4px"
          @change="(e) => updateProps(properties.value+e, properties.attr, false, properties.unitValue)"
        >
          <el-option v-for="item in properties.unitOptions" :label="item" :value="item" :key="item"></el-option>
        </el-select>
      </div>
      <!-- 文本域 -->
      <el-input
        v-if="properties.type === 'textarea'"
        class="width-188 height-68"
        :class="{'width-336':align==='right', 'height-80':align==='right'}"
        type="textarea"
        :rows="2"
        :placeholder="properties.placeholder"
        @input="(e) => updateProps(e, properties.attr, properties.isJson)"
        v-model="properties.value"
      />
      <!-- json编辑 -->
      <v-ace-editor
        v-if="properties.type === 'json'"
        v-model:value="properties.value"
        lang="json"
        theme="github"
        @change="() => changeJson(properties.attr, properties.isJson)"
        :options="{ wrap: true, useWorker: true }" 
        style="min-height: 400px;height: auto;width: 270px;" 
      />
      <!-- 样式json编辑 -->
      <v-ace-editor
        v-if="properties.type === 'style-json'"
        v-model:value="properties.value"
        lang="json"
        theme="github"
        @change="() => changeJson(properties.attr, properties.isJson)"
        :options="{ wrap: true, useWorker: true }" 
        style="min-height: 100px;height: auto;width: 270px;"
      />
      <!-- 拾色器 -->
      <el-color-picker
        v-model="properties.value"
        @change="(e) => updateProps(e, properties.attr)"
        v-if="properties.type === 'color-picker'"
      />
      <!-- 单选框 -->
      <el-radio-group
        v-if="properties.type === 'radio'"
        v-model="properties.value"
        @change="(e) => updateProps(e, properties.attr)"
      >
        <el-radio :value="true">是</el-radio>
        <el-radio :value="false">否</el-radio>
      </el-radio-group>
      <!-- 图标选择器 -->
      <el-input
        clearable
        class="width-188 height-36"
        :class="{'width-336':align==='right'}"
        @clear="updateProps('', properties.attr)"
        v-model="properties.value"
        :placeholder="properties.placeholder"
        v-if="properties.type === 'icon-picker'"
        @click="openIconDialog(properties.value, properties.attr)"
      />
      <!-- json数据编辑 -->
      <el-tabs
        v-if="properties.type === 'tabs'"
        v-model="properties.selectValue"
        type="border-card"
        editable
        @edit="(targetName, action) => handleTabsEdit(targetName, action, properties.attr)"
      >
        <el-form label-width="80px">
          <el-tab-pane
            v-for="(item, index) in properties.value"
            :key="item.name"
            :label="item.title"
            :name="item.name"
          >
            <el-form-item :label="(properties.label||'选项') + '标题'" v-if="item.hasOwnProperty('title')">
              <el-input v-model="item.title" @input="() => updateTabsJson(properties.attr)" />
            </el-form-item>
            <el-form-item :label="(properties.label||'选项') + '图标'" v-if="item.hasOwnProperty('icon')">
              <el-input 
                v-model="item.icon" 
                @click="openIconDialog(item.icon, `${properties.attr}-${index}`)"
              />
            </el-form-item>
            <el-form-item :label="(properties.label||'选项') + '值'" v-if="item.hasOwnProperty('name')">
              <el-input v-model="item.name" disabled />
            </el-form-item>
          </el-tab-pane>
        </el-form>
      </el-tabs>
      <!-- 新增按钮 -->
      <el-button 
        type="primary"
        v-if="properties.type === 'button'"
        @click="buttonClick(properties.actionType)"
      >
        {{ properties.value }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from "pinia";
import { CaretBottom } from '@element-plus/icons-vue'
import ace from 'ace-builds'
import workerJson from 'ace-builds/src-noconflict/worker-json?raw';
import { VAceEditor } from 'vue3-ace-editor';
import 'ace-builds/src-noconflict/theme-github'
import 'ace-builds/src-noconflict/mode-json';
import useCanvasStore from "stores/canvas";
import { safeJsonParse, safeJsonStringify, throttle } from "@/utils";
import QuestionFilled from "./QuestionFilled.vue"
import { ElCol } from 'meta/element-ui'

// 禁用网络请求
ace.config.set('loadWorkerFromBlob', false);
const workerBlob = new Blob([workerJson], {type: 'text/javascript'});
ace.config.set('workerPath', URL.createObjectURL(workerBlob));

const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)
const { componentIdx, currCptIdx, initComponents, currentComponentsValue } = CanvasStoreState
const elCol = safeJsonParse(ElCol)

/**
 * 插槽组件的增删处理 -- 目前只适用标签页、折叠面板组件
 * @param targetName 操作子集的name 为删除时才有值
 * @param action 添加或删除
 * @param type 匹配的属性
 */
const handleTabsEdit = (targetName, action, type) => {
  const currComponent = initComponents.value[currCptIdx.value]
  let properties = currentComponentsValue.value.properties ? [...currentComponentsValue.value.properties] : [...currComponent.properties]
  const index = properties.findIndex(property => property.attr === type)
  const idIndex = currComponent.properties[index].idIndex
  // 添加
  if (action === 'add') {
    let addItem = {
      title: `${(properties[index].label||'选项')}${idIndex+1}`,
      name: `${idIndex+1}`,
      content: '请从右侧组件列表中拖入组件到此处区域',
      key: 100001 + idIndex
    }
    if(!properties[index].noIcon) {
      addItem.icon = "el-icon-bell"
    }
    properties[index].value.push(addItem)
    // 默认选中最后一项
    properties[index].selectValue = properties[index].value[properties[index].value.length-1].name
    // 更新序号
    properties[index].idIndex = idIndex+1
  }
  // 删除
  else if(action === 'remove') {
    properties[index].value =  properties[index].value.filter(item => item.name !== targetName)
    properties[index].selectValue = properties[index].value.length > 0 ? properties[index].value[0].name : "0"
  }
  const updateInitComponents = {
    ...initComponents.value,
    [currCptIdx.value]: {
      ...currComponent,
      properties
    }
  }
  CanvasStore.updateWithJson({
    initComponents: updateInitComponents
  })
  // 广播信息至画布
  updateProps(properties[index].value, type, false, false, true)
}
const buttonClick = (type) => {
  // 优化if写法
  const actionFunction = {
    // 添加列
    addCol: () => {
      const componentKey = componentIdx.value + 1
      const component = elCol
      const initComponentsList = {
        ...initComponents.value,
        [componentKey]: {
          componentId: componentKey,
          ...component
        }
      }
      let updateState = {
        currCptIdx: componentKey,
        initComponents: initComponentsList,
        componentIdx: componentKey
      }
      if (window._child_win) {
        const msg = {
          type: "create-component",
          data: {
            pos: {
              x: 0,
              y: 0,
            },
            component: {
              componentId: componentKey,
              ...elCol,
              appendPosition: "start"
            },
            parentId: currCptIdx.value,
            type: 'ui',
            action: "group"
          },
        };
        window._child_win.postMessage(safeJsonStringify(msg), "*");
      }
      CanvasStore.updateWithJson(updateState)
    }
  }
  return throttle(actionFunction[type](), 500)
}

const updateTabsJson = (attr) => {
  nextTick(() => {
    const currComponent = initComponents.value[currCptIdx.value]
    let properties = currentComponentsValue.value.properties ? [...currentComponentsValue.value.properties] : [...currComponent.properties]
    const index = properties.findIndex(property => property.attr === attr)
    const value = currComponent.properties[index].value
    updateProps(value, attr, false, false, true)
  })
  
}
const openIconDialog = (iconType = "", attr = "") => {
  CanvasStore.updateWithJson({
    iconsDialogVisible: true,
    iconSelected: iconType,
    iconAttr: attr,
  });
};
const updateValue = (controllerKey, value) => {
  let properties = initComponents.value[currCptIdx.value].properties
  properties.forEach(item => {
    if(item.attr === controllerKey) {
      item.value = value
    }
  })
  const updateComponents = {
    ...initComponents.value,
    [currCptIdx.value]: {
      ...initComponents.value[currCptIdx.value],
      properties
    }
  }
  CanvasStore.updateWithJson({
    initComponents: updateComponents
  })
}
const changeJson = (attr, isJson) => {
  nextTick(() => {
    updateProps(props.properties.value, attr, isJson)
  })
}
const updatePropsWithUnit = (value = "", prop = "", isJson = false) => {

}
/**
 * 更新组件属性
 * @param {String} value 值
 * @param {String} prop 属性名
 */
const updateProps = (value = "", prop = "", isJson = false, unitValue = false, needRender = false) => {
  if (window._child_win) {
    const msg = {
      type: "update-props",
      data: {
        key: prop,
        value,
        componentId: currCptIdx.value,
        isJson,
        unitValue,
        needRender
      },
    };
    window._child_win.postMessage(safeJsonStringify(msg), "*");
  }
};
const props = defineProps({
  properties: {
    type: Object,
    required: true,
    default: () => {},
  },
  align: {
    type: String,
    required: false,
    default: "left",
  }
});
</script>

<style lang="scss" scoped>
.height-auto {
  height: auto !important;
  flex-direction: column;
}
.input-select-wrap {
  display: flex;
}
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
    display: flex;
    align-items: center;
    line-height: normal;
  }
  .form-item {
    width: 188px;
    margin-left: 8px;
    text-align: left;
  }
}
.width-188 {
  width: 188px;
}
.height-68 {
  height: 68px !important;
}
.height-36 {
  height: 36px;
  line-height: 36px;
}
.align-left {
  text-align: left;
}
:deep(.el-select__wrapper) {
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  color: #1F1F1F;
  letter-spacing: 0;
  font-weight: 400;
}
:deep(.el-textarea__inner) {
  height: 100%;
  line-height: 22px;
  font-size: 14px;
  color: #1F1F1F;
  letter-spacing: 0;
  font-weight: 400;
  resize: none;
}
:deep(.el-textarea__inner::placeholder) {
  line-height: 22px;
  font-size: 14px;
  color: #CCC;
  letter-spacing: 0;
  font-weight: 400;
}
:deep(.el-input-number__increase) {
  height: 18px !important;
}
:deep(.el-input-number__decrease) {
  height: 18px !important;
}
:deep(.el-input__inner::placeholder) {
  font-size: 14px;
  color: #CCC;
  letter-spacing: 0;
  font-weight: 400;
}
:deep(.el-color-picker__trigger) {
  width: 36px;
  height: 36px;
}
:deep(.el-radio) {
  margin-right: 20px;
}
.alignRight {
  text-align: right !important;
}
.l-12 {
  margin-left: 12px !important;
}
.width-336 {
  width: 336px !important;
}
.width-160 {
  width: 160px !important;
}
.height-80 {
  height: 80px !important;
}
.is-tabs {
  width: 100% !important;
  margin-top: 12px;
  margin-left: 0px !important; 
}
</style>
