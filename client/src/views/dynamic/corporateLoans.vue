<template>
  <div class="corporate-loans-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <hzb-breadcrumb separator="/">
        <hzb-breadcrumb-item @click.native="$router.push('/corporateBanking')">
          <i class="iconfont hzb-icon-s-home"></i> 企业银行
        </hzb-breadcrumb-item>
        <hzb-breadcrumb-item>企业贷款</hzb-breadcrumb-item>
      </hzb-breadcrumb>
      <h1 class="page-title">企业贷款产品</h1>
      <p class="page-description">为您提供多样化的贷款产品，满足企业发展不同阶段的资金需求</p>
    </div>

    <!-- 产品列表 -->
    <div class="products-section">
      <hzb-row :gutter="20">
        <hzb-col 
          v-for="product in loanProducts" 
          :key="product.id" 
          :span="8" 
          class="product-col"
        >
          <div 
            class="product-card" 
            @click="goToDetail(product.targetPageId)"
          >
            <div class="product-icon">
              <i :class="['iconfont', product.icon]"></i>
            </div>
            <h3 class="product-name">{{ product.name }}</h3>
            <div class="product-details">
              <div class="detail-item">
                <span class="label">贷款额度：</span>
                <span class="value">{{ product.amount }}</span>
              </div>
              <div class="detail-item">
                <span class="label">年利率：</span>
                <span class="value">{{ product.interestRate }}</span>
              </div>
              <div class="detail-item">
                <span class="label">期限：</span>
                <span class="value">{{ product.term }}</span>
              </div>
            </div>
            <hzb-button 
              type="primary" 
              class="apply-button"
              @click.stop="goToDetail(product.targetPageId)"
            >
              了解详情
            </hzb-button>
          </div>
        </hzb-col>
      </hzb-row>
    </div>

    <!-- 申请流程 -->
    <div class="application-process">
      <h2 class="section-title">在线申请流程</h2>
      <div class="process-steps">
        <div 
          v-for="(step, index) in applicationSteps" 
          :key="index" 
          class="step-item"
        >
          <div class="step-icon">
            <span class="step-number">{{ index + 1 }}</span>
          </div>
          <div class="step-content">
            <h3 class="step-title">{{ step.title }}</h3>
            <p class="step-description">{{ step.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"

export default {
  name: "CorporateLoans",
  mixins: [screenshotMixin],
  data() {
    return {
      // 贷款产品列表
      loanProducts: [
        {
          id: 1,
          name: "流动资金贷款",
          icon: "hzb-icon-s-flag",
          amount: "100万-5000万",
          interestRate: "4.35%-6.15%",
          term: "1-3年",
          targetPageId: "corporateLoanDetail"
        },
        {
          id: 2,
          name: "固定资产贷款",
          icon: "hzb-icon-s-grid",
          amount: "500万-2亿",
          interestRate: "4.75%-6.55%",
          term: "1-10年",
          targetPageId: "corporateLoanDetail"
        },
        {
          id: 3,
          name: "贸易融资贷款",
          icon: "hzb-icon-s-custom",
          amount: "50万-3000万",
          interestRate: "3.95%-5.85%",
          term: "3个月-3年",
          targetPageId: "tradeFinanceDetail"
        },
        {
          id: 4,
          name: "项目贷款",
          icon: "hzb-icon-s-platform",
          amount: "1000万-10亿",
          interestRate: "4.95%-7.25%",
          term: "3-15年",
          targetPageId: "corporateLoanDetail"
        },
        {
          id: 5,
          name: "设备融资租赁",
          icon: "hzb-icon-s-release",
          amount: "100万-1亿",
          interestRate: "5.25%-7.55%",
          term: "1-7年",
          targetPageId: "corporateLoanDetail"
        },
        {
          id: 6,
          name: "小微企业贷款",
          icon: "hzb-icon-s-management",
          amount: "10万-500万",
          interestRate: "5.55%-8.15%",
          term: "1个月-5年",
          targetPageId: "corporateLoanDetail"
        }
      ],
      // 申请流程步骤
      applicationSteps: [
        {
          title: "选择产品",
          description: "根据企业需求选择合适的贷款产品"
        },
        {
          title: "填写申请",
          description: "在线填写贷款申请表单并提交相关资料"
        },
        {
          title: "审核评估",
          description: "银行对申请资料进行审核和风险评估"
        },
        {
          title: "签约放款",
          description: "审核通过后签署合同并完成放款"
        }
      ]
    }
  },
  methods: {
    // 跳转到详情页面
    goToDetail(targetPageId) {
      this.$router.push('/' + targetPageId)
    }
  }
}
</script>

<style scoped lang="scss">
.corporate-loans-page {
  padding: 80px 24px 40px;
  max-width: 1440px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  // 页面头部样式
  .page-header {
    margin-bottom: 40px;
    
    .page-title {
      font-size: 32px;
      font-weight: 600;
      color: #333;
      margin: 20px 0 12px;
      line-height: 1.3;
    }
    
    .page-description {
      font-size: 16px;
      color: #666;
      line-height: 1.6;
      max-width: 600px;
    }
  }

  // 产品列表样式
  .products-section {
    margin-bottom: 60px;
    
    .product-col {
      margin-bottom: 24px;
    }
    
    .product-card {
      background: #fff;
      border-radius: 12px;
      padding: 30px 24px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
      }
      
      .product-icon {
        width: 64px;
        height: 64px;
        background: #f5f7fa;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 20px;
        
        .iconfont {
          font-size: 28px;
          color: #409eff;
        }
      }
      
      .product-name {
        font-size: 20px;
        font-weight: 500;
        color: #333;
        margin-bottom: 20px;
      }
      
      .product-details {
        flex: 1;
        width: 100%;
        margin-bottom: 24px;
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          
          .label {
            color: #666;
            font-size: 14px;
          }
          
          .value {
            color: #333;
            font-weight: 500;
            font-size: 14px;
          }
        }
      }
      
      .apply-button {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border-radius: 8px;
      }
    }
  }

  // 申请流程样式
  .application-process {
    .section-title {
      font-size: 28px;
      font-weight: 600;
      color: #333;
      text-align: center;
      margin-bottom: 40px;
    }
    
    .process-steps {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      
      .step-item {
        display: flex;
        width: 50%;
        margin-bottom: 30px;
        padding-right: 30px;
        box-sizing: border-box;
        
        &:nth-child(odd) {
          padding-right: 60px;
        }
        
        &:nth-child(even) {
          padding-left: 60px;
          padding-right: 0;
        }
        
        .step-icon {
          margin-right: 20px;
          
          .step-number {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px;
            height: 40px;
            background: #409eff;
            color: #fff;
            border-radius: 50%;
            font-size: 18px;
            font-weight: 500;
          }
        }
        
        .step-content {
          .step-title {
            font-size: 20px;
            font-weight: 500;
            color: #333;
            margin-bottom: 10px;
          }
          
          .step-description {
            font-size: 16px;
            color: #666;
            line-height: 1.6;
          }
        }
      }
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .products-section {
      .product-col {
        &:nth-child(3n+1) {
          clear: both;
        }
      }
    }
    
    .application-process {
      .process-steps {
        .step-item {
          width: 100%;
          padding: 0 !important;
        }
      }
    }
  }
  
  @media (max-width: 768px) {
    padding: 80px 16px 30px;
    
    .page-header {
      .page-title {
        font-size: 28px;
      }
    }
    
    .products-section {
      .product-col {
        &:nth-child(2n+1) {
          clear: both;
        }
      }
    }
    
    .application-process {
      .section-title {
        font-size: 24px;
      }
      
      .process-steps {
        .step-item {
          .step-content {
            .step-title {
              font-size: 18px;
            }
            
            .step-description {
              font-size: 14px;
            }
          }
        }
      }
    }
  }
}
</style>