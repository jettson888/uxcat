<template>
  <el-tooltip placement="right" :content="content" effect="light" popper-class="custom-tooltip">
    <el-icon class="wrap">
      <QuestionFilled></QuestionFilled>
    </el-icon>
  </el-tooltip>
</template>
<script setup>
const props = defineProps({
  content: {
    type: String,
    required: true,
    default: ''
  }
})
</script>
<style lang="scss" scoped>
.wrap {
  cursor: pointer;
  margin-left: 4px;
}
</style>
<style lang="scss">
.custom-tooltip {
  max-width: 250px;
  word-break: break-word;
  line-height: 1.5;
}
</style>
