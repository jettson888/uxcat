<template>
  <div class="item">
    <div class="label">
      偏移
      <QuestionFilled content="相对原始位置水平及垂直偏移量(单位:px)" />
    </div>
    <div class="form-item">
      <el-tooltip placement="top" content="水平偏移">
        <SwipeInput content="X" type="left" class="width-92 height-36" />
      </el-tooltip>
      <el-tooltip placement="top" content="垂直偏移">
        <SwipeInput
          content="Y"
          type="top"
          class="width-92 height-36 margin-left-4"
        />
      </el-tooltip>
    </div>
  </div>
  <div class="item">
    <div class="label">
      宽度
    </div>
    <div class="form-item">
      <el-input-number
        class="width-188 height-36"
        :class="{'width-336':align==='right'}"
        v-model="rightProps.width"
        placeholder="请输入宽度"
        controls-position="right"
        style="width:120px"
        :min="0"
        @input="e => changeWidthHeight('width', e)"
      />
      <el-select v-model="rightProps.widthUnit" style="width:64px;margin-left:4px"
        @change="changeWidthHeight('width')"
      >
        <el-option v-for="item in widthUnitOptions" :label="item" :value="item" :key="item"></el-option>
      </el-select>
    </div>
  </div>
  <div class="item">
    <div class="label">
      高度
    </div>
    <div class="form-item">
      <el-input-number
        class="width-188 height-36"
        :class="{'width-336':align==='right'}"
        v-model="rightProps.height"
        placeholder="请输入高度"
        controls-position="right"
        style="width:120px"
        :min="0"
        @input="e => changeWidthHeight('height', e)"
      />
      <el-select v-model="rightProps.heightUnit" style="width:64px;margin-left:4px"
        @change="changeWidthHeight('height')"
      >
        <el-option v-for="item in heightUnitOptions" :label="item" :value="item" :key="item"></el-option>
      </el-select>
    </div>
  </div>
  <div class="item">
    <div class="label">
      字号
      <QuestionFilled content="字体大小(单位:px)" />
    </div>
    <div class="form-item">
      <el-select
        v-model="rightProps.fontSize"
        filterable
        allow-create
        default-first-option
        placement="left"
        :suffix-icon="CaretBottom"
        @change="changeFontSize"
        class="width-148 height-36"
      >
        <el-option
          v-for="n in [...Array(31).keys()].map(i => i + 6)"
          :key="n"
          :label="2 * n"
          :value="2 * n"
        ></el-option>
      </el-select>
      <el-button
        class="width-36 height-36 margin-left-4"
        type="primary"
        v-if="rightProps.fontWeight === 'bold'"
        @click="changeBold('normal')"
      >
        <IconTextBold />
      </el-button>
      <el-button
        class="width-36 height-36 margin-left-4"
        v-else
        @click="changeBold('bold')"
      >
        <IconTextBold />
      </el-button>
    </div>
  </div>
  <div class="item">
    <div class="label">文字颜色</div>
    <div class="form-item w-44">
      <el-tooltip placement="top" content="文字颜色" :hide-after="0">
        <div @click.stop>
          <el-color-picker
            class="height-36 width-36"
            v-model="rightProps.color"
            @change="changeColor"
          />
        </div>
      </el-tooltip>
    </div>
    <div class="label">背景颜色</div>
    <div class="form-item w-44">
      <el-tooltip placement="top" content="背景颜色" :hide-after="0">
        <div @click.stop>
          <el-color-picker
            class="height-36 width-36"
            v-model="rightProps.backgroundColor"
            @change="changeBgColor"
          />
        </div>
      </el-tooltip>
    </div>
  </div>
  <div class="item" v-if="rightProps.innerText">
    <div class="label">文字对齐</div>
    <div class="form-item">
      <el-radio-group
        class="full-ratio"
        v-model="rightProps.textAlign"
        @change="changeTextAlign"
      >
        <el-tooltip placement="top" content="文字对齐：左对齐" :hide-after="0">
          <el-radio-button value="left" class="width-47 height-36">
            <IconAlignTextLeft />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip placement="top" content="文字对齐：居中" :hide-after="0">
          <el-radio-button value="center" class="width-47 height-36">
            <IconAlignTextCenter />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip placement="top" content="文字对齐：右对齐" :hide-after="0">
          <el-radio-button value="right" class="width-47 height-36">
            <IconAlignTextRight />
          </el-radio-button>
        </el-tooltip>
        <el-tooltip
          placement="top"
          content="文字对齐：两边对齐"
          :hide-after="0"
        >
          <el-radio-button value="justify" class="width-47 height-36">
            <IconAlignTextBoth />
          </el-radio-button>
        </el-tooltip>
      </el-radio-group>
    </div>
  </div>
  <div class="item height-72" v-if="rightProps.innerText">
    <div class="label">内容</div>
    <div class="form-item">
      <el-input
        class="width-188 height-72"
        v-model="rightProps.innerText"
        type="textarea"
        :rows="2"
        placeholder="请输入内容"
        @input="
          value =>
            sendMessage({
              key: 'innerText',
              value: value ? value : '&nbsp;&nbsp;&nbsp;&nbsp'
            })
        "
      />
    </div>
  </div>
  <div class="item">
    <div class="label">
      居中方式
      <QuestionFilled content="对选中节点内所有元素进行居中" />
    </div>
    <div class="form-item">
      <el-select
        class="width-188 height-36"
        v-model="rightProps.centerType"
        placement="left"
        :suffix-icon="CaretBottom"
        @change="changeCenterType"
      >
        <el-option
          v-for="item in CenterType"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        ></el-option>
      </el-select>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import useCanvasStore from 'stores/canvas'
import SwipeInput from './SwipeInput.vue'
import { CaretBottom } from '@element-plus/icons-vue'
import QuestionFilled from './QuestionFilled.vue'
import { safeJsonStringify } from '@/utils'

const CanvasStore = useCanvasStore()
const CanvasStoreState = storeToRefs(CanvasStore)
const { rightProps } = CanvasStoreState

const props = defineProps({
  align: {
    type: String,
    required: false,
    default: "left",
  }
});

const widthUnitOptions = ref(["%", "px", "vw"])
const heightUnitOptions = ref(["%", "px", "vh"])

const changeWidthHeight = (type = "width", val) => {
  const value = val || rightProps.value[type]
  const unit = rightProps.value[`${type}Unit`]
  sendMessage({
    key: type,
    value: value + unit
  });
}
const CenterType = ref([
  {
    label: '默认',
    value: 'default'
  },
  {
    label: '水平居中',
    value: 'center-h'
  },
  {
    label: '垂直居中',
    value: 'center-v'
  },
  {
    label: '水平垂直居中',
    value: 'center-vh'
  }
])
const changeCenterType = value => {
  sendMessage({
    key: 'centerType',
    value
  })
}
const changeTextAlign = value => {
  sendMessage({
    key: 'textAlign',
    value
  })
}
const changeBgColor = value => {
  sendMessage({
    key: 'backgroundColor',
    value: value ? value : ''
  })
}
const changeColor = value => {
  sendMessage({
    key: 'color',
    value: value ? value : ''
  })
}
const changeFontSize = value => {
  sendMessage({
    key: 'fontSize',
    value: value + 'px'
  })
}
const changeBold = value => {
  CanvasStore.update({
    key: 'rightProps',
    value: {
      ...rightProps._value,
      fontWeight: value
    }
  })
  sendMessage({
    key: 'fontWeight',
    value: value === 'bold' ? '700' : '400'
  })
}
const sendMessage = (
  { key, value },
  type = 'update-attrs',
  msgKey = 'data'
) => {
  const dataKey = type === 'update-attrs' ? 'style' : msgKey
  if (window._child_win) {
    const msg = {
      type,
      [dataKey]: {
        key,
        value
      }
    }
    window._child_win.postMessage(safeJsonStringify(msg), '*')
  }
}
</script>

<style lang="scss" scoped>
.full-ratio {
  display: flex;
  flex: 1;
  .el-radio-button {
    position: relative;
    display: inline-flex;
    outline: 0;
    flex: 1;
  }
  .el-radio-button__inner {
    width: 100%;
  }
}
:deep(.el-textarea__inner) {
  height: 72px;
  line-height: 22px;
  font-size: 14px;
  color: #1f1f1f;
  font-weight: 400;
  letter-spacing: 0;
  resize: none;
}
:deep(.el-textarea__inner::placeholder) {
  line-height: 22px;
  font-size: 14px;
  color: #ccc;
  letter-spacing: 0;
  font-weight: 400;
}
:deep(.el-select__wrapper) {
  height: 36px;
  line-height: 36px;
}
:deep(.el-select__input) {
  font-size: 14px;
  color: #1f1f1f;
  font-weight: 400;
}
.margin-left-4 {
  margin-left: 4px;
}
.width-188 {
  width: 188px;
}
.width-92 {
  width: 92px;
}
.width-148 {
  width: 148px;
}
.width-47 {
  width: 47px;
}
.width-36 {
  width: 36px;
}
.height-36 {
  height: 36px;
  line-height: 36px;
}
.item {
  display: flex;
  height: 36px;
  line-height: 36px;
  margin-bottom: 12px;
  .label {
    font-size: 14px;
    color: #1f1f1f;
    font-weight: 400;
    width: 84px;
    text-align: left;
    display: flex;
    align-items: center;
  }
  .form-item {
    width: 188px;
    margin-left: 8px;
    text-align: left;
  }
}
.height-72 {
  height: 72px;
  line-height: 36px;
}
.w-44 {
  width: 44px !important;
}
</style>
