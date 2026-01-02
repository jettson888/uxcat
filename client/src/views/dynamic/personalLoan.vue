<template>
  <div class="personal-loan-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item @click.native="$router.push('/personalBanking')">个人银行</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>个人贷款</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>个人贷款</h1>
        <p>为您提供多样化的个人贷款产品，满足您的资金需求</p>
      </div>

      <!-- 产品列表 -->
      <div class="loan-products">
        <hzb-row :gutter="20">
          <hzb-col 
            v-for="product in loanProducts" 
            :key="product.id" 
            :span="8"
            class="product-col"
          >
            <div 
              class="product-card" 
              @click="goToDetail(product.id)"
            >
              <div class="product-icon">
                <i class="iconfont hzb-icon-money"></i>
              </div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                <div class="product-detail">
                  <p>额度：{{ product.amount }}</p>
                  <p>利率：{{ product.interestRate }}</p>
                  <p>期限：{{ product.term }}</p>
                </div>
                <hzb-button type="primary" plain class="apply-btn">
                  立即申请
                </hzb-button>
              </div>
            </div>
          </hzb-col>
        </hzb-row>
      </div>

      <!-- 贷款申请表单 -->
      <div class="loan-application">
        <h2>在线贷款申请</h2>
        <div class="application-form">
          <hzb-row :gutter="20">
            <hzb-col :span="12">
              <hzb-form label-width="100px">
                <hzb-form-item label="姓名">
                  <hzb-input v-model="applicationForm.name" placeholder="请输入您的姓名"></hzb-input>
                </hzb-form-item>
                <hzb-form-item label="手机号">
                  <hzb-input v-model="applicationForm.phone" placeholder="请输入您的手机号"></hzb-input>
                </hzb-form-item>
                <hzb-form-item label="贷款金额">
                  <hzb-input v-model="applicationForm.amount" placeholder="请输入申请金额"></hzb-input>
                </hzb-form-item>
              </hzb-form>
            </hzb-col>
            <hzb-col :span="12">
              <hzb-form label-width="100px">
                <hzb-form-item label="身份证号">
                  <hzb-input v-model="applicationForm.idCard" placeholder="请输入您的身份证号"></hzb-input>
                </hzb-form-item>
                <hzb-form-item label="贷款用途">
                  <hzb-select v-model="applicationForm.purpose" placeholder="请选择贷款用途">
                    <hzb-option 
                      v-for="item in purposeOptions" 
                      :key="item.value" 
                      :label="item.label" 
                      :value="item.value">
                    </hzb-option>
                  </hzb-select>
                </hzb-form-item>
                <hzb-form-item label="还款期限">
                  <hzb-select v-model="applicationForm.repaymentTerm" placeholder="请选择还款期限">
                    <hzb-option 
                      v-for="item in termOptions" 
                      :key="item.value" 
                      :label="item.label" 
                      :value="item.value">
                    </hzb-option>
                  </hzb-select>
                </hzb-form-item>
              </hzb-form>
            </hzb-col>
          </hzb-row>
          <div class="form-actions">
            <hzb-button type="primary" @click="submitApplication">提交申请</hzb-button>
            <hzb-button @click="resetForm">重置</hzb-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"
import GlobalNavigation from '@/components/GlobalNavigation.vue'

export default {
  name: 'PersonalLoan',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      // 贷款产品列表
      loanProducts: [
        {
          id: 'loan001',
          name: '个人消费贷款',
          amount: '1万-50万',
          interestRate: '年化4.5%-8.2%',
          term: '1-5年'
        },
        {
          id: 'loan002',
          name: '个人住房贷款',
          amount: '10万-500万',
          interestRate: '年化3.8%-6.5%',
          term: '1-30年'
        },
        {
          id: 'loan003',
          name: '个人经营贷款',
          amount: '5万-200万',
          interestRate: '年化5.2%-10.8%',
          term: '1-10年'
        },
        {
          id: 'loan004',
          name: '个人信用贷款',
          amount: '1万-30万',
          interestRate: '年化6.0%-12.0%',
          term: '1-3年'
        },
        {
          id: 'loan005',
          name: '个人汽车贷款',
          amount: '5万-100万',
          interestRate: '年化4.0%-7.5%',
          term: '1-7年'
        },
        {
          id: 'loan006',
          name: '个人教育贷款',
          amount: '1万-50万',
          interestRate: '年化4.2%-7.8%',
          term: '1-10年'
        }
      ],
      // 贷款申请表单
      applicationForm: {
        name: '',
        phone: '',
        idCard: '',
        amount: '',
        purpose: '',
        repaymentTerm: ''
      },
      // 贷款用途选项
      purposeOptions: [
        { value: 'decoration', label: '房屋装修' },
        { value: 'education', label: '教育培训' },
        { value: 'travel', label: '旅游消费' },
        { value: 'medical', label: '医疗支出' },
        { value: 'business', label: '经营周转' },
        { value: 'other', label: '其他用途' }
      ],
      // 还款期限选项
      termOptions: [
        { value: '12', label: '12个月' },
        { value: '24', label: '24个月' },
        { value: '36', label: '36个月' },
        { value: '60', label: '60个月' },
        { value: '120', label: '120个月' }
      ]
    }
  },
  methods: {
    // 跳转到贷款详情页
    goToDetail(productId) {
      // 根据实际需求跳转到对应详情页
      this.$router.push(`/loanDetail?id=${productId}`)
    },
    // 提交贷款申请
    submitApplication() {
      if (this.validateForm()) {
        this.$hzbMessage({
          message: '贷款申请已提交，我们将尽快与您联系',
          type: 'success'
        })
        this.resetForm()
      }
    },
    // 重置表单
    resetForm() {
      this.applicationForm = {
        name: '',
        phone: '',
        idCard: '',
        amount: '',
        purpose: '',
        repaymentTerm: ''
      }
    },
    // 表单验证
    validateForm() {
      if (!this.applicationForm.name) {
        this.$hzbMessage({
          message: '请输入姓名',
          type: 'warning'
        })
        return false
      }
      if (!this.applicationForm.phone) {
        this.$hzbMessage({
          message: '请输入手机号',
          type: 'warning'
        })
        return false
      }
      if (!this.applicationForm.idCard) {
        this.$hzbMessage({
          message: '请输入身份证号',
          type: 'warning'
        })
        return false
      }
      if (!this.applicationForm.amount) {
        this.$hzbMessage({
          message: '请输入贷款金额',
          type: 'warning'
        })
        return false
      }
      if (!this.applicationForm.purpose) {
        this.$hzbMessage({
          message: '请选择贷款用途',
          type: 'warning'
        })
        return false
      }
      if (!this.applicationForm.repaymentTerm) {
        this.$hzbMessage({
          message: '请选择还款期限',
          type: 'warning'
        })
        return false
      }
      return true
    }
  }
}
</script>

<style scoped lang="scss">
.personal-loan-page {
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
  margin-bottom: 30px;
  
  h1 {
    font-size: 28px;
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

.loan-products {
  margin-bottom: 50px;
  
  .product-col {
    margin-bottom: 20px;
  }
  
  .product-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    cursor: pointer;
    height: 100%;
    display: flex;
    flex-direction: column;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
    }
    
    .product-icon {
      text-align: center;
      margin-bottom: 20px;
      
      .iconfont {
        font-size: 48px;
        color: #409eff;
      }
    }
    
    .product-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      h3 {
        font-size: 20px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
        text-align: center;
      }
      
      .product-detail {
        flex: 1;
        
        p {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
          line-height: 1.5;
        }
      }
      
      .apply-btn {
        margin-top: 20px;
        align-self: center;
      }
    }
  }
}

.loan-application {
  background: #fff;
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  h2 {
    font-size: 24px;
    font-weight: 600;
    color: #333;
    margin-bottom: 24px;
    text-align: center;
  }
  
  .application-form {
    .hzb-row {
      margin-bottom: 20px;
    }
    
    ::v-deep .hzb-form-item {
      margin-bottom: 20px;
    }
    
    ::v-deep .hzb-form-item__label {
      font-weight: 500;
    }
    
    .form-actions {
      text-align: center;
      margin-top: 30px;
      
      .hzb-button {
        margin: 0 10px;
        padding: 12px 30px;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-content {
    padding: 20px 16px;
  }
  
  .loan-products {
    .product-col {
      width: 100%;
    }
  }
  
  .loan-application {
    padding: 20px;
  }
  
  .page-header {
    h1 {
      font-size: 24px;
    }
    
    p {
      font-size: 14px;
    }
  }
}
</style>