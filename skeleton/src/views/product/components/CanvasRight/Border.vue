<template>
  <div class="item">
    <div class="label">圆角</div>
    <div class="form-item">
      <el-select
        :suffix-icon="CaretBottom"
        v-model="rightProps.borderRadiusType"
        class="width-188 height-36"
        placement="left"
      >
        <el-option
          v-for="item in BorderRadiusType"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
    </div>
  </div>
  <div class="item" :class="{'height-76':rightProps.borderRadiusType === 'special'}">
    <div class="label">圆角大小</div>
    <div class="form-item" v-if="rightProps.borderRadiusType === 'normal'">
      <el-input-number
        class="width-188 height-36"
        :controls="false"
        v-model="rightProps.borderRadius"
        :min="0"
        @input="changeBorderRadius"
      >
        <template #suffix>
          <span>px</span>
        </template>
      </el-input-number>
    </div>
    <div class="form-item" v-if="rightProps.borderRadiusType === 'special'">
      <el-tooltip
        placement="top"
        content="左上角"
      >
        <SwipeInput content="左上" type="borderTopLeftRadius" class="width-92 height-36 margin-bottom-4" @change="commonMethods" />
      </el-tooltip>
      <el-tooltip
        placement="top"
        content="右上角"
      >
        <SwipeInput  content="右上" type="borderTopRightRadius" class="width-92 height-36 margin-left-4 margin-bottom-4" @change="commonMethods" />
      </el-tooltip>
      <el-tooltip
        placement="top"
        content="左下角"
      >
        <SwipeInput content="左下" type="borderBottomLeftRadius" class="width-92 height-36" @change="commonMethods" />
      </el-tooltip>
      <el-tooltip
        placement="top"
        content="右下角"
      >
        <SwipeInput  content="右下" type="borderBottomRightRadius" class="width-92 height-36 margin-left-4" @change="commonMethods" />
      </el-tooltip>
    </div>
  </div>
  <div class="item">
    <div class="label">边框宽度</div>
    <div class="form-item">
      <el-input-number
        class="width-188 height-36"
        :controls="false"
        v-model="rightProps.borderWidth"
        :min="0"
        @input="changeBorderWidth"
      >
        <template #suffix>
          <span>px</span>
        </template>
      </el-input-number>
    </div>
  </div>
  <div class="item">
    <div class="label">边框颜色</div>
    <div class="form-item">
      <el-tooltip
        placement="top"
        content="边框颜色"
        :hide-after="0"
      >
        <div @click.stop class="tooltip-popover">
          <el-color-picker
            class="height-36 width-36"
            v-model="rightProps.borderColor"
            @change="changeBorderColor"
          />
        </div>
      </el-tooltip>
    </div>
  </div>
  <div class="item">
    <div class="label">边框样式</div>
    <div class="form-item">
      <el-select
        v-model="rightProps.borderStyle"
        placement="left"
        class="width-188 height-36"
        @change="changeBorderStyle"
      >
        <el-option
          v-for="item in BorderStyleType"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { CaretBottom } from '@element-plus/icons-vue'
import { storeToRefs } from "pinia";
import useCanvasStore from "stores/canvas"
import SwipeInput from "./SwipeInput.vue"
import { safeJsonStringify } from "@/utils";

const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)
const { rightProps, currCptIdx, initComponents } = CanvasStoreState

const props = defineProps({
  type: {
    type: String,
    required: false,
    default: "normal"
  }
})
const getBorder = () => {
  const {
    borderRadiusType,
    borderRadius,
    borderTopLeftRadius,
    borderTopRightRadius,
    borderBottomLeftRadius,
    borderBottomRightRadius,
    borderWidth,
    borderColor,
    borderStyle
  } = rightProps.value
  const width = Number(borderWidth) || 0
  const style = borderStyle || 'solid'
  const color = borderColor || 'transparent'

  const radius = (val) => {
    if (val === 0) return '0'
    return val ? (typeof val === 'number' ? `${val}px` : val) : "0"
  }

  const styleObj = {}

  // 1) 先合成 border（当宽度>0时才生效）
  if (width > 0) {
    styleObj.border = `${width}px ${style} ${color}`
  } else {
    styleObj.border = ''
  }

  // 2) 再处理圆角：四角优先，否则用整体
  if(borderRadiusType === "normal") {
    styleObj.borderRadius = radius(borderRadius)
  } else {
    styleObj.borderRadius = `${radius(borderTopLeftRadius)} ${radius(borderTopRightRadius)} ${radius(borderBottomRightRadius)} ${radius(borderBottomLeftRadius)}`
  }
  return styleObj
}
onMounted(() => {
  resetBorder()
})
const resetBorder = () => {
  if(props.type === "component") {
    const properties = initComponents.value[currCptIdx.value].properties
    const border = properties.filter(item => item.attr === "border")[0].value
    const borderRadius = properties.filter(item => item.attr === "borderRadius")[0].value
    let updateBorders = {
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
      borderStyle: ''
    }
    if(border.split(" ").length > 1) {
      updateBorders.borderWidth = Number(border.split(" ")[0].replace("px", ""))
      updateBorders.borderStyle = border.split(" ")[1]
      updateBorders.borderColor = border.split(" ")[2]
    }
    if(borderRadius.split(" ").length > 1) {
      updateBorders.borderRadiusType = "special"
      updateBorders.borderTopLeftRadius = Number(borderRadius.split(" ")[0].replace("px", ""))
      updateBorders.borderTopRightRadius = Number(borderRadius.split(" ")[1].replace("px", ""))
      updateBorders.borderBottomRightRadius = Number(borderRadius.split(" ")[2].replace("px", ""))
      updateBorders.borderBottomLeftRadius = Number(borderRadius.split(" ")[3].replace("px", ""))
    } else {
      updateBorders.borderRadius = Number(borderRadius.replace("px", ""))
    }
    CanvasStore.updateWithJson({
      rightProps: {
        ...rightProps.value,
        ...updateBorders
      }
    })
  }
}
const commonMethods = (type = "borderRadius") => {
  if(props.type !== "component") return
  nextTick(() => {
    const styleObj = getBorder()
    let newProperties = [...initComponents.value[currCptIdx.value].properties]
    newProperties.forEach(property => {
      if(type === type) {
        if(property.attr === type) {
          property.value = styleObj[type]
        }
      } 
    }) 
    const newInitComponents = {
      ...initComponents.value,
      [currCptIdx.value]: {
        ...initComponents.value[currCptIdx.value],
        properties: newProperties
      }
    }
    CanvasStore.updateWithJson({
      initComponents: newInitComponents
    })
    if (window._child_win) {
      const msg = {
        type: "update-props",
        data: {
          key: type,
          value: styleObj[type],
          componentId: currCptIdx.value,
          isJson: false
        },
      };
      window._child_win.postMessage(safeJsonStringify(msg), "*");
    }
  })
}

const BorderStyleType = ref([
  {
    label: "无边框",
    value: "",
  },
  {
    label: "实线",
    value: "solid",
  },
  {
    label: "虚线",
    value: "dashed",
  },
  {
    label: "点线",
    value: "dotted",
  },
]);
/* 圆角设置模块 */
const BorderRadiusType = ref([
  {
    label: "固定圆角",
    value: "normal",
  },
  {
    label: "独立定义",
    value: "special",
  },
]);

/* 边框设置模块 */
// 改变边宽
const changeBorderWidth = (value) => {
  sendMessage({
    key: "borderWidth",
    value: value + "px",
  });
};
// 改变边框颜色 
const changeBorderColor = (value) => {
  sendMessage({
    key: "borderColor",
    value: value ? value : "",
  });
};
// 输入固定圆角数值
const changeBorderRadius = (value) => {
  sendMessage(
    {
      key: "borderRadius",
      value: value + "px",
    },
    "update-attrs",
    "data",
    true
  );
};
// 改变边框样式
const changeBorderStyle = (value) => {
  sendMessage({
    key: "borderStyle",
    value,
  });
};
/* 边框设置模块 end */

const sendMessage = ({ key, value }, type = "update-attrs", msgKey = "data", isRadius = false) => {
  if(props.type === "component") {
    nextTick(() => {
      commonMethods(isRadius ? "borderRadius" : "border")
    })
    return 
  }
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
    text-align: left;
    margin-left: 8px;
  }
}
.margin-left-4 {
  margin-left: 4px;
}
.margin-bottom-4 {
  margin-bottom: 4px;
}
.width-188 {
  width: 188px;
}
.width-92 {
  width: 92px;
}
.width-36 {
  width: 36px;
}
.height-36 {
  height: 36px;
  line-height: 36px;
}
.height-76 {
  height: 76px;
}
:deep(.el-input__wrapper) {
  padding: 0px !important;
  line-height: 36px !important;
}
:deep(.el-input__inner)  {
  text-align: left !important;
  text-indent: 12px;
  font-size: 14px;
  color: #1F1F1F;
  letter-spacing: 0;
  font-weight: 400;
}
:deep(.el-input__suffix-inner) {
  margin-right: 8px;
  font-size: 14px;
  color: #999;
  font-weight: 400;
}
:deep(.el-select__wrapper) {
  height: 36px;
  line-height: 36px;
  font-size: 14px;
  color: #1F1F1F;
  letter-spacing: 0;
  font-weight: 400;
}
.tooltip-popover {
  .el-button {
    width: 100%;
    border-radius: 0;
  }
  .font-color {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
    border-right: 0;
  }
  .high-light {
    border-right: 0;
  }
}
:deep(.el-select__selected-item) span {
  font-size: 14px;
  color: #1F1F1F;
  letter-spacing: 0;
  font-weight: 400;
}
</style>