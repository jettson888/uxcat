<template>
  <div class="faq-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="content-wrapper">
      <!-- 面包屑导航 -->
      <hzb-breadcrumb separator="/" class="breadcrumb">
        <hzb-breadcrumb-item @click.native="$router.push('/customerService')">客户服务</hzb-breadcrumb-item>
        <hzb-breadcrumb-item>常见问题</hzb-breadcrumb-item>
      </hzb-breadcrumb>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>常见问题</h1>
        <p>为您解答在使用杭州银行服务过程中可能遇到的常见问题</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-section">
        <hzb-input
          v-model="searchKeyword"
          placeholder="请输入关键词搜索问题"
          class="search-input"
          prefix-icon="hzb-icon-search"
        ></hzb-input>
      </div>

      <!-- 问题列表 -->
      <div class="faq-list">
        <hzb-collapse v-model="activeNames" accordion>
          <hzb-collapse-item
            v-for="item in filteredFaqList"
            :key="item.id"
            :name="item.id"
            :title="item.question"
          >
            <div class="faq-answer" v-html="item.answer"></div>
          </hzb-collapse-item>
        </hzb-collapse>

        <!-- 无匹配结果提示 -->
        <div v-if="filteredFaqList.length === 0" class="no-results">
          <i class="iconfont hzb-icon-question no-results-icon"></i>
          <p>未找到与“{{ searchKeyword }}”相关的问题</p>
          <p class="sub-text">您可以尝试其他关键词，或通过下方反馈告诉我们</p>
        </div>
      </div>

      <!-- 问题反馈入口 -->
      <div class="feedback-section">
        <hzb-card class="feedback-card">
          <div slot="header" class="feedback-header">
            <span>没有找到您的问题？</span>
          </div>
          <div class="feedback-content">
            <p>您可以通过以下方式提交您的问题或建议：</p>
            <hzb-button type="primary" @click="handleFeedback">问题反馈</hzb-button>
          </div>
        </hzb-card>
      </div>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"
import GlobalNavigation from '@/components/GlobalNavigation.vue'

export default {
  name: "FaqPage",
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      searchKeyword: '',
      activeNames: '',
      faqList: [
        {
          id: '1',
          question: '如何开通网上银行？',
          answer: '您可以通过以下方式开通网上银行：<br/>1. 携带有效身份证件和银行卡到我行任意网点办理；<br/>2. 通过手机银行APP在线申请开通。'
        },
        {
          id: '2',
          question: '忘记登录密码怎么办？',
          answer: '如您忘记网上银行登录密码，请携带有效身份证件到我行任意网点进行密码重置。'
        },
        {
          id: '3',
          question: '如何提高转账限额？',
          answer: '个人客户可通过手机银行或网上银行申请调整转账限额，企业客户需到开户网点办理。'
        },
        {
          id: '4',
          question: '信用卡还款方式有哪些？',
          answer: '信用卡还款方式包括：<br/>1. 自动转账还款；<br/>2. 网上银行转账还款；<br/>3. 手机银行还款；<br/>4. ATM机还款；<br/>5. 网点柜台还款。'
        },
        {
          id: '5',
          question: '如何申请贷款？',
          answer: '您可以通过以下渠道申请贷款：<br/>1. 我行官方网站在线申请；<br/>2. 手机银行APP申请；<br/>3. 前往就近网点咨询办理。'
        },
        {
          id: '6',
          question: '理财产品风险等级如何划分？',
          answer: '我行理财产品风险等级分为五个级别：<br/>R1(低风险)、R2(中低风险)、R3(中等风险)、R4(中高风险)、R5(高风险)，请您根据自身风险承受能力选择合适的产品。'
        },
        {
          id: '7',
          question: '如何查询账户余额？',
          answer: '您可以通过以下方式查询账户余额：<br/>1. 手机银行；<br/>2. 网上银行；<br/>3. ATM机；<br/>4. 电话银行；<br/>5. 网点柜台。'
        },
        {
          id: '8',
          question: '境外刷卡需要注意什么？',
          answer: '境外刷卡时请注意：<br/>1. 确认卡片已开通境外交易功能；<br/>2. 了解汇率和手续费标准；<br/>3. 保管好卡片和密码；<br/>4. 保留交易凭证以备查询。'
        }
      ]
    }
  },
  computed: {
    filteredFaqList() {
      if (!this.searchKeyword) {
        return this.faqList
      }
      const keyword = this.searchKeyword.toLowerCase()
      return this.faqList.filter(item => 
        item.question.toLowerCase().includes(keyword) || 
        item.answer.toLowerCase().includes(keyword)
      )
    }
  },
  methods: {
    handleFeedback() {
      // 模拟反馈操作
      this.$message({
        message: '感谢您的反馈，我们将尽快处理您的问题',
        type: 'success'
      })
    }
  }
}
</script>

<style scoped lang="scss">
.faq-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.breadcrumb {
  margin-bottom: 24px;
  font-size: 14px;
}

.page-header {
  margin-bottom: 32px;
  
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

.search-section {
  margin-bottom: 32px;
  
  .search-input {
    max-width: 500px;
  }
}

.faq-list {
  margin-bottom: 40px;
  
  ::v-deep .hzb-collapse-item__header {
    font-size: 16px;
    font-weight: 500;
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 8px;
    transition: all 0.3s ease;
    
    &:hover {
      background-color: #f0f5ff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }
  }
  
  ::v-deep .hzb-collapse-item__wrap {
    padding: 0 20px 20px;
    background-color: #fafafa;
    border-radius: 0 0 8px 8px;
    margin-bottom: 8px;
  }
  
  .faq-answer {
    line-height: 1.8;
    color: #555;
    font-size: 15px;
  }
}

.no-results {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  
  .no-results-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: #ccc;
  }
  
  p {
    margin: 8px 0;
  }
  
  .sub-text {
    font-size: 14px;
  }
}

.feedback-section {
  margin-bottom: 40px;
  
  .feedback-card {
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
  }
  
  ::v-deep .hzb-card__header {
    border-bottom: 1px solid #eee;
    padding: 20px 24px;
    font-size: 18px;
    font-weight: 500;
  }
  
  .feedback-content {
    padding: 24px;
    
    p {
      margin-bottom: 20px;
      color: #666;
      font-size: 15px;
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .content-wrapper {
    padding: 16px;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .faq-list ::v-deep .hzb-collapse-item__header {
    padding: 14px 16px;
    font-size: 15px;
  }
}
</style>