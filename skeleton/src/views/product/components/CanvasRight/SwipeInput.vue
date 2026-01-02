<template>
  <el-input-number
    v-if="showType==='component'"
    class="swipe-input"
    v-model="componentStyleValue" 
    :controls="false"
    @input="e => changeCompoent(e)"
  >
    <template #prefix>
      {{ content }}
    </template>
  </el-input-number>
  <el-input-number
    v-else
    class="swipe-input"
    v-model="rightProps[type]" 
    :controls="false"
    @input="e => change(e)"
  >
    <template #prefix>
      {{ content }}
    </template>
  </el-input-number>
</template>
<script setup>
import { storeToRefs } from "pinia";
import useCanvasStore from "stores/canvas"
import { safeJsonStringify } from "@/utils"
const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)
const { currCptIdx, initComponents, rightProps } = CanvasStoreState
const emit = defineEmits(['change'])

const props = defineProps({
  type: {
    type: String,
    required: false,
    default: ""
  },
  content: {
    type: String,
    required: false,
    default: ""
  },
  showType: {
    type: String,
    required: false,
    default: "default",
  }
})
const componentStyleValue = computed({
  get: () => {
    if (props.showType === 'component') {
      const value = initComponents.value[currCptIdx.value]?.styles?.[props.type]
      return value ? parseInt(value.replace("px", "")) : 0
    }
    return 0
  },
  set: (value) => {
    // This will be handled by the @input event
  }
})
const handleBoxShadow = (key, value) => {
  // 0: h-shadow, 1: v-shadow, 2: blur, 3: spread, 4: color, 5: inset
  let boxShadow = rightProps.value.boxShadow
  let arr = boxShadow.split(' ')
  if(key < 4) {
    arr[key] = value + 'px'
  }
  let newValue = arr.join(' ')
  return newValue
}
const BoxShadowAttribute = {
    hShadow: 0,
    vShadow: 1,
    boxShadowBlur: 2,
    boxShadowSpread: 3
}
const change = (value) => {
  emit("change")
  if(BoxShadowAttribute[props.type] || BoxShadowAttribute[props.type] === 0) {
    const boxShadow = handleBoxShadow(BoxShadowAttribute[props.type], value)
    CanvasStore.update({
        key: "rightProps",
        value: {
            ...rightProps._value,
            boxShadow,
        },
    });
    sendMessage({
        key: "boxShadow",
        value: boxShadow,
    });
    return 
  }
  sendMessage({
    key: props.type,
    value: (props.type === "height" || props.type === "width") ? value + rightProps.value[`${props.type}Unit`] : value + "px"
  });
}
// 目前仅开放组件内外边距
const changeCompoent = (value) => {
  const newValue = {
    ...initComponents.value[currCptIdx.value].styles,
    [props.type]: `${value}px`,
  }
  const updateComponents = {
    ...initComponents.value,
    [currCptIdx.value]: {
      ...initComponents.value[currCptIdx.value],
      styles: newValue
    }
  }
  CanvasStore.updateWithJson({
    initComponents: updateComponents
  })
  if (window._child_win) {
    const msg = {
      type: "update-props",
      data: {
        key: "styles",
        value: newValue,
        componentId: currCptIdx.value,
        isJson: false
      },
    };
    window._child_win.postMessage(safeJsonStringify(msg), "*");
  }
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
<style scoped lang="scss">
.swipe-input {
  :deep(.el-input__wrapper) {
    padding: 0px !important;
  }
  :deep(.el-input__prefix-inner) {
    margin-left: 12px;
    font-size: 14px;
    color: #666;
    letter-spacing: 0;
    font-weight: 400;
  }
  :deep(.el-input__inner) {
    text-align: left;
    text-indent: 16px;
  }
}
</style>
