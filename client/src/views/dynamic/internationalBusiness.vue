<template>
  <div class="international-business-page">
    <!-- 页面头部：面包屑导航 -->
    <div class="page-header">
      <hzb-breadcrumb separator="/">
        <hzb-breadcrumb-item @click.native="$router.push('/corporateBanking')">企业银行</hzb-breadcrumb-item>
        <hzb-breadcrumb-item>国际业务</hzb-breadcrumb-item>
      </hzb-breadcrumb>
    </div>

    <!-- 页面标题 -->
    <div class="page-title">
      <h1>国际业务</h1>
      <p>为您提供安全、便捷的跨境金融服务</p>
    </div>

    <!-- 业务卡片区域 -->
    <div class="business-cards">
      <hzb-row :gutter="24">
        <hzb-col :span="8" v-for="item in businessList" :key="item.id">
          <div class="business-card" @click="goToDetail(item.targetPageId)">
            <div class="card-icon">
              <i :class="['iconfont', item.icon]"></i>
            </div>
            <div class="card-content">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description }}</p>
              <hzb-button type="text" class="detail-link">查看详情 ></hzb-button>
            </div>
          </div>
        </hzb-col>
      </hzb-row>
    </div>

    <!-- 在线咨询区域 -->
    <div class="consultation-section">
      <h2>在线业务咨询</h2>
      <p>如有疑问，请填写以下表单，我们将尽快为您解答</p>
      <div class="consultation-form">
        <hzb-row :gutter="20">
          <hzb-col :span="12">
            <hzb-input v-model="form.name" placeholder="您的姓名"></hzb-input>
          </hzb-col>
          <hzb-col :span="12">
            <hzb-input v-model="form.company" placeholder="企业名称"></hzb-input>
          </hzb-col>
        </hzb-row>
        <hzb-row :gutter="20" style="margin-top: 20px;">
          <hzb-col :span="12">
            <hzb-input v-model="form.phone" placeholder="联系电话"></hzb-input>
          </hzb-col>
          <hzb-col :span="12">
            <hzb-input v-model="form.email" placeholder="电子邮箱"></hzb-input>
          </hzb-col>
        </hzb-row>
        <div style="margin-top: 20px;">
          <hzb-input
            type="textarea"
            :rows="4"
            placeholder="咨询内容"
            v-model="form.content">
          </hzb-input>
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <hzb-button type="primary" @click="submitForm">提交咨询</hzb-button>
        </div>
      </div>
    </div>

    <!-- 弹窗提示 -->
    <hzb-dialog
      title="提示"
      :visible.sync="dialogVisible"
      width="400px">
      <span>您的咨询已提交，我们将尽快与您联系。</span>
      <span slot="footer" class="dialog-footer">
        <hzb-button @click="dialogVisible = false">确 定</hzb-button>
      </span>
    </hzb-dialog>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"

export default {
  name: 'InternationalBusiness',
  mixins: [screenshotMixin],
  data() {
    return {
      dialogVisible: false,
      form: {
        name: '',
        company: '',
        phone: '',
        email: '',
        content: ''
      },
      businessList: [
        {
          id: 1,
          title: '外汇兑换',
          description: '提供多种货币兑换服务，汇率优惠，操作便捷',
          icon: 'hzb-icon-money',
          targetPageId: 'tradeFinanceProducts'
        },
        {
          id: 2,
          title: '跨境汇款',
          description: '快速安全的跨境资金转移服务，覆盖全球主要国家和地区',
          icon: 'hzb-icon-bank-card',
          targetPageId: 'tradeFinanceDetail'
        },
        {
          id: 3,
          title: '信用证业务',
          description: '专业的信用证开立、通知、议付等全流程服务',
          icon: 'hzb-icon-document',
          targetPageId: 'tradeFinanceProducts'
        },
        {
          id: 4,
          title: '贸易融资',
          description: '为进出口贸易提供全方位的融资解决方案',
          icon: 'hzb-icon-service',
          targetPageId: 'tradeFinanceDetail'
        },
        {
          id: 5,
          title: '外汇账户',
          description: '多种外汇账户选择，满足不同业务需求',
          icon: 'hzb-icon-bank-card',
          targetPageId: 'corporateAccountProducts'
        },
        {
          id: 6,
          title: '国际保函',
          description: '提供投标保函、履约保函等多种国际保函服务',
          icon: 'hzb-icon-document',
          targetPageId: 'tradeFinanceProducts'
        }
      ]
    }
  },
  methods: {
    goToDetail(targetPageId) {
      this.$router.push('/' + targetPageId)
    },
    submitForm() {
      // 表单验证
      if (!this.form.name || !this.form.content) {
        this.$message.warning('请填写必填项')
        return
      }
      this.dialogVisible = true
      // 重置表单
      this.form = {
        name: '',
        company: '',
        phone: '',
        email: '',
        content: ''
      }
    }
  }
}
</script>

<style scoped lang="scss">
.international-business-page {
  padding: 80px 40px 40px;
  max-width: 1440px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

  .page-header {
    margin-bottom: 24px;
  }

  .page-title {
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
    }
  }

  .business-cards {
    margin-bottom: 60px;
    
    .hzb-row {
      margin: 0 -12px;
    }
    
    .hzb-col {
      padding: 0 12px;
    }
  }

  .business-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    padding: 30px 24px;
    margin-bottom: 24px;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid #f0f0f0;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      border-color: #e0e0e0;
    }
    
    .card-icon {
      text-align: center;
      margin-bottom: 20px;
      
      i {
        font-size: 40px;
        color: #1890ff;
      }
    }
    
    .card-content {
      text-align: center;
      
      h3 {
        font-size: 20px;
        font-weight: 500;
        color: #333;
        margin-bottom: 12px;
      }
      
      p {
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 20px;
        min-height: 44px;
      }
      
      .detail-link {
        font-size: 14px;
        color: #1890ff;
      }
    }
  }

  .consultation-section {
    background: #fafafa;
    border-radius: 8px;
    padding: 40px;
    margin-top: 40px;
    
    h2 {
      font-size: 24px;
      font-weight: 500;
      color: #333;
      text-align: center;
      margin-bottom: 12px;
    }
    
    p {
      font-size: 16px;
      color: #666;
      text-align: center;
      margin-bottom: 30px;
    }
    
    .consultation-form {
      max-width: 800px;
      margin: 0 auto;
    }
  }

  // 响应式设计
  @media (max-width: 1200px) {
    .business-card {
      padding: 24px 20px;
    }
  }

  @media (max-width: 992px) {
    .business-card {
      .card-icon i {
        font-size: 36px;
      }
      
      .card-content h3 {
        font-size: 18px;
      }
    }
    
    .consultation-section {
      padding: 30px 20px;
    }
  }

  @media (max-width: 768px) {
    padding: 80px 20px 40px;
    
    .page-title h1 {
      font-size: 28px;
    }
    
    .business-cards {
      .hzb-col {
        margin-bottom: 20px;
      }
    }
    
    .business-card {
      .card-icon {
        margin-bottom: 16px;
        
        i {
          font-size: 32px;
        }
      }
      
      .card-content {
        h3 {
          font-size: 16px;
          margin-bottom: 8px;
        }
        
        p {
          font-size: 13px;
          margin-bottom: 16px;
        }
      }
    }
    
    .consultation-section {
      padding: 24px 16px;
      
      h2 {
        font-size: 20px;
        margin-bottom: 8px;
      }
      
      p {
        font-size: 14px;
        margin-bottom: 20px;
      }
    }
  }
}
</style>