<template>
  <div class="item">
    <div class="label">类型</div>
    <div class="form-item">
      <el-select
        :suffix-icon="CaretBottom"
        v-model="rightProps.boxShadowType"
        class="width-188 height-36"
        placement="left"
        @change="value=>handleBoxShadow(5, value)"
      >
        <el-option
          v-for="item in BoxShadowTypeOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
    </div>
  </div>
  <div class="item height-116">
    <div class="label">阴影样式</div>
    <div class="form-item">
      <el-tooltip
        placement="top"
        content="阴影X轴偏移"
      >
        <SwipeInput content="X" type="hShadow" class="width-92 height-36 margin-bottom-4" />
      </el-tooltip>
      <el-tooltip
        placement="top"
        content="阴影y轴偏移  "
      >
        <SwipeInput  content="Y" type="vShadow" class="width-92 height-36 margin-left-4 margin-bottom-4" />
      </el-tooltip>
      <SwipeInput content="模糊" type="boxShadowBlur" class="width-92 height-36 margin-bottom-4" />
      <SwipeInput  content="拓展" type="boxShadowSpread" class="width-92 height-36 margin-left-4 margin-bottom-4" />
      <el-tooltip
        placement="top"
        content="阴影颜色"
        :hide-after="0"
      >
        <div @click.stop class="align-left">
          <el-color-picker
            class="height-36 width-36"
            v-model="rightProps.boxShadowColor"
            @change="value=>handleBoxShadow(4, value)"
          />
        </div>
      </el-tooltip>
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
const { rightProps } = CanvasStoreState

const BoxShadowTypeOptions = ref([
  {
    label: "外阴影",
    value: false,
  },
  {
    label: "内阴影",
    value: true,
  },
]);
const handleBoxShadow = (key, value) => {
  // 0: h-shadow, 1: v-shadow, 2: blur, 3: spread, 4: color, 5: inset
  let arr = rightProps.value.boxShadow && rightProps.value.boxShadow.split(' ')
  if(key === 4) {
    const colorIndex = arr.findIndex(item => item.includes('#'))
    if(colorIndex > -1) {
      arr[colorIndex] = value
    } else {
      arr.push(value)
    }
  } else if (key === 5) {
    const insetIndex = arr.indexOf('inset')
    if(value && insetIndex === -1) {
      arr.push('inset')
    }
    if(!value && insetIndex > -1) {
      arr.splice(insetIndex, 1)
    }
  }
  let boxShadowArr = arr.join(' ')
  CanvasStore.update({
    key: "rightProps",
    value: {
      ...rightProps._value,
      boxShadow: boxShadowArr,
    },
  });
  sendMessage({
    key: "boxShadow",
    value: boxShadowArr,
  });
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
}
.item:last-child {
  margin-bottom: 0px;
}
.width-188 {
  width: 188px;
}
.width-92 {
  width: 92px;
}
.margin-left-4 {
  margin-left: 4px;
}
.margin-bottom-4 {
  margin-bottom: 4px;
}
.width-36 {
  width: 36px !important;
}
.height-36 {
  height: 36px !important;
  line-height: 36px;
}
.height-116 {
  height: 116px;
}
.align-left {
  text-align: left;
}
:deep(.el-color-picker__trigger) {
  width: 36px !important;
  height: 36px !important;
}
</style>
