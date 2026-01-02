<template>
  <div class="corporate-banking-page">
    <!-- 全局导航栏 -->
    <GlobalNavigation />

    <!-- 页面内容区 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>企业银行</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>企业银行服务</h1>
        <p>为您提供全面的企业银行业务支持，助力企业发展壮大</p>
      </div>

      <!-- 功能模块卡片区域 -->
      <div class="cards-container">
        <hzb-row :gutter="20">
          <!-- 对公账户卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="navigateTo('corporateAccounts')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-bank-card card-icon"></i>
                  <span>对公账户</span>
                </div>
                <div class="card-content">
                  <p>为企业提供多种类型的对公账户服务，满足不同业务需求。</p>
                  <ul>
                    <li>基本账户管理</li>
                    <li>专用账户开设</li>
                    <li>账户信息查询</li>
                  </ul>
                </div>
                <div class="card-footer">
                  <hzb-button type="primary" plain>查看详情</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>

          <!-- 企业贷款卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="navigateTo('corporateLoans')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-money card-icon"></i>
                  <span>企业贷款</span>
                </div>
                <div class="card-content">
                  <p>多样化的贷款产品，支持企业资金周转和项目投资。</p>
                  <ul>
                    <li>流动资金贷款</li>
                    <li>固定资产贷款</li>
                    <li>信用贷款服务</li>
                  </ul>
                </div>
                <div class="card-footer">
                  <hzb-button type="primary" plain>查看详情</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>

          <!-- 国际业务卡片 -->
          <hzb-col :span="8">
            <div class="card-wrapper" @click="navigateTo('internationalBusiness')">
              <hzb-card class="service-card">
                <div slot="header" class="card-header">
                  <i class="iconfont hzb-icon-discover card-icon"></i>
                  <span>国际业务</span>
                </div>
                <div class="card-content">
                  <p>全方位的跨境金融服务，助力企业拓展国际市场。</p>
                  <ul>
                    <li>外汇结算服务</li>
                    <li>贸易融资产品</li>
                    <li>跨境投资咨询</li>
                  </ul>
                </div>
                <div class="card-footer">
                  <hzb-button type="primary" plain>查看详情</hzb-button>
                </div>
              </hzb-card>
            </div>
          </hzb-col>
        </hzb-row>
      </div>

      <!-- 优势特色区域 -->
      <div class="features-section">
        <h2>我们的优势</h2>
        <hzb-row :gutter="20">
          <hzb-col :span="6" v-for="(feature, index) in features" :key="index">
            <div class="feature-item">
              <i class="iconfont" :class="feature.icon"></i>
              <h3>{{ feature.title }}</h3>
              <p>{{ feature.description }}</p>
            </div>
          </hzb-col>
        </hzb-row>
      </div>
    </div>
  </div>
</template>

<script>
// 引入截图mixin
import screenshotMixin from "@/common/mixin.js"
// 引入全局导航组件
import GlobalNavigation from '@/components/GlobalNavigation.vue'

export default {
  name: 'CorporateBanking',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      // 特色优势数据
      features: [
        {
          icon: 'hzb-icon-bank-card',
          title: '专业团队',
          description: '资深企业金融专家团队，提供定制化解决方案'
        },
        {
          icon: 'hzb-icon-money',
          title: '高效审批',
          description: '简化流程，快速响应，提高业务办理效率'
        },
        {
          icon: 'hzb-icon-discover',
          title: '全面服务',
          description: '覆盖企业全生命周期的金融产品与服务'
        },
        {
          icon: 'hzb-icon-document-checked',
          title: '安全保障',
          description: '严格风控体系，确保企业资金安全'
        }
      ]
    }
  },
  methods: {
    // 页面导航方法
    navigateTo(pageId) {
      this.$router.push('/' + pageId)
    }
  }
}
</script>

<style scoped lang="scss">
.corporate-banking-page {
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

.breadcrumb-container {
  margin-bottom: 24px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;

  h1 {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
  }

  p {
    font-size: 16px;
    color: #666;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.6;
  }
}

.cards-container {
  margin-bottom: 50px;

  .card-wrapper {
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    height: 100%;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
    }
  }

  .service-card {
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;

    .card-header {
      display: flex;
      align-items: center;
      font-size: 20px;
      font-weight: 500;
      color: #333;
      padding: 20px;

      .card-icon {
        font-size: 24px;
        margin-right: 12px;
        color: #409eff;
      }
    }

    .card-content {
      padding: 0 20px 20px;

      p {
        color: #666;
        line-height: 1.6;
        margin-bottom: 16px;
      }

      ul {
        padding-left: 20px;

        li {
          color: #999;
          margin-bottom: 8px;
          line-height: 1.5;
        }
      }
    }

    .card-footer {
      padding: 0 20px 20px;
      text-align: right;
    }
  }
}

.features-section {
  background: #fff;
  border-radius: 8px;
  padding: 40px 30px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.04);

  h2 {
    text-align: center;
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 30px;
  }

  .feature-item {
    text-align: center;
    padding: 20px;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-8px);
    }

    i {
      font-size: 36px;
      color: #409eff;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin-bottom: 12px;
    }

    p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
    }
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .cards-container {
    .hzb-col {
      flex: 0 0 100%;
      max-width: 100%;
      margin-bottom: 20px;
    }
  }
  
  .features-section {
    .hzb-col {
      flex: 0 0 50%;
      max-width: 50%;
      margin-bottom: 20px;
    }
  }
}

@media (max-width: 768px) {
  .page-content {
    padding: 20px 16px;
  }
  
  .page-header {
    h1 {
      font-size: 24px;
    }
    
    p {
      font-size: 14px;
    }
  }
  
  .features-section {
    .hzb-col {
      flex: 0 0 100%;
      max-width: 100%;
    }
  }
}
</style>