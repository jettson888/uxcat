<template>
  <div class="customer-service-page">
    <!-- 全局导航栏 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <hzb-breadcrumb separator="/" class="breadcrumb">
        <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
        <hzb-breadcrumb-item>客户服务</hzb-breadcrumb-item>
      </hzb-breadcrumb>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="title">客户服务</h1>
        <p class="subtitle">为您提供全面的客户支持与帮助</p>
      </div>

      <!-- 功能模块卡片区域 -->
      <div class="cards-container">
        <hzb-row :gutter="20">
          <!-- 常见问题卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="goToPage('faq')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-question card-icon"></i>
                  <span>常见问题</span>
                </div>
                <div class="card-body">
                  <p>查看常见问题解答，快速解决您的疑问</p>
                  <hzb-button type="primary" plain class="card-button">查看详情</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>

          <!-- 在线客服卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="goToPage('onlineSupport')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-service card-icon"></i>
                  <span>在线客服</span>
                </div>
                <div class="card-body">
                  <p>联系在线客服，获取实时帮助与支持</p>
                  <hzb-button type="primary" plain class="card-button">立即咨询</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>

          <!-- 网点查询卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="goToPage('branchLocator')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-map-location card-icon"></i>
                  <span>网点查询</span>
                </div>
                <div class="card-body">
                  <p>查找附近营业网点，获取地址和联系方式</p>
                  <hzb-button type="primary" plain class="card-button">查找网点</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>
        </hzb-row>
      </div>
    </div>
  </div>
</template>

<script>
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import screenshotMixin from "@/common/mixin.js"

export default {
  name: 'CustomerService',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  methods: {
    goToPage(pageId) {
      this.$router.push('/' + pageId)
    }
  }
}
</script>

<style scoped lang="scss">
.customer-service-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 30px 24px;
}

.breadcrumb {
  margin-bottom: 24px;
}

.page-header {
  margin-bottom: 32px;
  
  .title {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    line-height: 1.3;
  }
  
  .subtitle {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
  }
}

.cards-container {
  .hzb-row {
    margin: 0 -10px;
  }
  
  .hzb-col {
    padding: 0 10px;
  }
}

.card-wrapper {
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  height: 100%;
  
  &:hover {
    transform: translateY(-4px);
    
    .service-card {
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
      border-color: #e0e0e0;
    }
  }
}

.service-card {
  height: 100%;
  border: 1px solid #eaeaea;
  border-radius: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
  
  ::v-deep .hzb-card__header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    background-color: #fafafa;
  }
  
  ::v-deep .hzb-card__body {
    padding: 24px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  font-size: 20px;
  font-weight: 500;
  color: #333;
  
  .card-icon {
    font-size: 24px;
    margin-right: 12px;
    color: #409eff;
  }
}

.card-body {
  p {
    font-size: 14px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 20px;
  }
}

.card-button {
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
}

// 兼容Chrome 83及以下版本
@media screen and (-webkit-max-device-pixel-ratio: 1) {
  .cards-container .hzb-row {
    display: flex;
    flex-wrap: wrap;
  }
  
  .cards-container .hzb-col {
    flex: 0 0 33.333%;
    max-width: 33.333%;
  }
}
</style>