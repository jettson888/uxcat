<template>
  <div class="content-wrap margin-bottom-12">
    <div class="item height-76">
      <div class="label">
        外边距
        <QuestionFilled content="单位:px" />
      </div>
      <div class="form-item">
        <SwipeInput :show-type="type" content="上" type="marginTop" class="width-92 height-36 margin-bottom-4" />
        <SwipeInput  :show-type="type" content="下" type="marginBottom" class="width-92 height-36 margin-left-4 margin-bottom-4" />
        <SwipeInput :show-type="type" content="左" type="marginLeft" class="width-92 height-36" />
        <SwipeInput  :show-type="type" content="右" type="marginRight" class="width-92 height-36 margin-left-4" />
      </div>
    </div>
  </div> 
  <div class="content-wrap">
    <div class="item height-76">
      <div class="label">
        内边距
        <QuestionFilled content="单位:px" />
      </div>
      <div class="form-item">
        <SwipeInput :show-type="type" content="上" type="paddingTop" class="width-92 height-36 margin-bottom-4" />
        <SwipeInput  :show-type="type" content="下" type="paddingBottom" class="width-92 height-36 margin-left-4 margin-bottom-4" />
        <SwipeInput :show-type="type" content="左" type="paddingLeft" class="width-92 height-36" />
        <SwipeInput :show-type="type" content="右" type="paddingRight" class="width-92 height-36 margin-left-4" />
      </div>
    </div>
  </div>
</template>
<script setup>
import SwipeInput from "./SwipeInput.vue"
import QuestionFilled from './QuestionFilled.vue'
const props = defineProps({
  type: {
    type: String,
    required: false,
    default: "default",
  }
})
</script>

<style lang="scss" scoped>
.item {
  display: flex;
  height: 36px;
  line-height: 36px;
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
.content-wrap {
  background-color: #F2F5F6;
  padding: 12px;
  border-radius: 4px;
  width: 304px;
  margin: 12px;
}
.margin-left-4 {
  margin-left: 4px;
}
.width-92 {
  width: 92px;
}
.height-76 {
  height: 76px;
}
.height-36 {
  height: 36px;
  line-height: 36px;
}
.margin-bottom-4 {
  margin-bottom: 4px;
}
.margin-bottom-12 {
  margin-bottom: 12px;
}
</style>
