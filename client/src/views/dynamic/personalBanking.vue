<template>
  <div class="personal-banking-page">
    <!-- 全局导航栏 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>个人银行</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>个人银行服务</h1>
        <p>为您提供全面的个人银行业务信息和服务</p>
      </div>

      <!-- 功能模块卡片区域 -->
      <div class="cards-container">
        <hzb-row :gutter="20">
          <hzb-col :span="8" v-for="item in serviceModules" :key="item.id">
            <div class="service-card" @click="handleCardClick(item.targetPageId)">
              <div class="card-icon">
                <i :class="['iconfont', item.icon]"></i>
              </div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <hzb-button type="text" class="more-button">
                了解更多 <i class="hzb-icon-arrow-right"></i>
              </hzb-button>
            </div>
          </hzb-col>
        </hzb-row>
      </div>

      <!-- 特色服务区域 -->
      <div class="featured-services">
        <h2>特色服务</h2>
        <div class="services-grid">
          <div 
            v-for="service in featuredServices" 
            :key="service.id"
            class="service-item"
            @click="handleCardClick(service.targetPageId)"
          >
            <div class="service-icon">
              <i :class="['iconfont', service.icon]"></i>
            </div>
            <div class="service-info">
              <h4>{{ service.title }}</h4>
              <p>{{ service.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import screenshotMixin from "@/common/mixin.js"

// 页面导航数据
const pageNavigation = [
  {"name":"账户管理","navigationId":"goAccountManagement","navigationType":"页面导航","targetPageId":"accountManagement","trigger":""},
  {"name":"储蓄理财","navigationId":"goSavingsAndWealth","navigationType":"页面导航","targetPageId":"savingsAndWealth","trigger":""},
  {"name":"个人贷款","navigationId":"goPersonalLoan","navigationType":"页面导航","targetPageId":"personalLoan","trigger":""}
]

export default {
  name: 'PersonalBanking',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      serviceModules: [
        {
          id: 1,
          title: '账户管理',
          description: '管理您的银行账户，查看交易记录，设置账户安全',
          icon: 'hzb-icon-bank-card',
          targetPageId: 'accountManagement'
        },
        {
          id: 2,
          title: '储蓄理财',
          description: '多样化的储蓄和理财产品，助您实现财富增值',
          icon: 'hzb-icon-money',
          targetPageId: 'savingsAndWealth'
        },
        {
          id: 3,
          title: '个人贷款',
          description: '便捷的个人贷款申请，满足您的各种资金需求',
          icon: 'hzb-icon-data-board',
          targetPageId: 'personalLoan'
        }
      ],
      featuredServices: [
        {
          id: 1,
          title: '在线开户',
          description: '足不出户，快速开立银行账户',
          icon: 'hzb-icon-s-home',
          targetPageId: 'accountManagement'
        },
        {
          id: 2,
          title: '理财产品',
          description: '精选理财产品，专业投资顾问',
          icon: 'hzb-icon-money',
          targetPageId: 'savingsAndWealth'
        },
        {
          id: 3,
          title: '信用贷款',
          description: '快速审批，灵活还款',
          icon: 'hzb-icon-data-board',
          targetPageId: 'personalLoan'
        },
        {
          id: 4,
          title: '账户安全',
          description: '多重安全保障，守护您的资金安全',
          icon: 'hzb-icon-bank-card',
          targetPageId: 'accountManagement'
        }
      ]
    }
  },
  methods: {
    handleCardClick(targetPageId) {
      // 根据导航数据验证路由合法性
      const isValidRoute = pageNavigation.some(nav => nav.targetPageId === targetPageId)
      if (isValidRoute) {
        this.$router.push('/' + targetPageId)
      }
    }
  }
}
</script>

<style scoped lang="scss">
.personal-banking-page {
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
  
  ::v-deep .hzb-breadcrumb {
    font-size: 14px;
  }
}

.page-header {
  margin-bottom: 40px;
  
  h1 {
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }
  
  p {
    font-size: 16px;
    color: #666;
    line-height: 1.6;
  }
}

.cards-container {
  margin-bottom: 50px;
  
  .service-card {
    background: #ffffff;
    border-radius: 12px;
    padding: 30px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    height: 100%;
    display: flex;
    flex-direction: column;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    }
    
    .card-icon {
      margin-bottom: 20px;
      
      i {
        font-size: 48px;
        color: #409eff;
      }
    }
    
    h3 {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      flex-grow: 1;
      margin-bottom: 20px;
    }
    
    .more-button {
      align-self: center;
      font-size: 14px;
      color: #409eff;
      
      i {
        margin-left: 4px;
        font-size: 12px;
      }
    }
  }
}

.featured-services {
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 24px;
  }
  
  .services-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .service-item {
    background: #ffffff;
    border-radius: 12px;
    padding: 24px;
    display: flex;
    align-items: flex-start;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
    }
    
    .service-icon {
      margin-right: 16px;
      
      i {
        font-size: 28px;
        color: #409eff;
      }
    }
    
    .service-info {
      flex: 1;
      
      h4 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        color: #666;
        line-height: 1.5;
      }
    }
  }
}

// 兼容Chrome 83及以下版本
.hzb-row {
  margin-left: -10px;
  margin-right: -10px;
  
  &::before,
  &::after {
    content: "";
    display: table;
  }
  
  &::after {
    clear: both;
  }
}

.hzb-col {
  float: left;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .page-content {
    padding: 20px 16px;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .cards-container .service-card {
    padding: 24px 20px;
  }
  
  .featured-services .services-grid {
    grid-template-columns: 1fr;
  }
}
</style>