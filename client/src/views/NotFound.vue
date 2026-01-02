<template>
  <div class="not-found">
    <el-result
      icon="error"
      title="404"
      sub-title="抱歉，您访问的页面不存在"
    >
    </el-result>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
}
</script>

<style scoped lang="scss">
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f7fa;
}
</style>
