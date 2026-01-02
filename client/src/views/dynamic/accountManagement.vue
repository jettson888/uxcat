<template>
  <div class="account-management-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>个人银行</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>账户管理</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>账户管理</h1>
        <p>查看和管理您的个人银行账户信息</p>
      </div>

      <!-- 账户概览卡片 -->
      <div class="account-overview">
        <hzb-card class="overview-card">
          <div slot="header" class="clearfix">
            <span>账户概览</span>
            <hzb-button style="float: right; padding: 3px 0" type="text" @click="refreshData">
              <i class="hzb-icon-data-line"></i> 刷新
            </hzb-button>
          </div>
          <div class="account-info">
            <div class="info-item">
              <div class="label">账户类型</div>
              <div class="value">储蓄账户</div>
            </div>
            <div class="info-item">
              <div class="label">账户号码</div>
              <div class="value">**** **** **** 1234</div>
            </div>
            <div class="info-item">
              <div class="label">开户日期</div>
              <div class="value">2020年3月15日</div>
            </div>
            <div class="info-item">
              <div class="label">账户状态</div>
              <div class="value status-active">正常</div>
            </div>
            <div class="info-item">
              <div class="label">当前余额</div>
              <div class="value balance">¥ 25,680.00</div>
            </div>
          </div>
        </hzb-card>
      </div>

      <!-- 功能模块 -->
      <div class="function-modules">
        <div class="module-grid">
          <div 
            class="module-card" 
            v-for="module in modules" 
            :key="module.id"
            @click="handleModuleClick(module)"
          >
            <div class="module-icon">
              <i :class="module.icon"></i>
            </div>
            <div class="module-title">{{ module.title }}</div>
            <div class="module-desc">{{ module.description }}</div>
          </div>
        </div>
      </div>

      <!-- 交易记录 -->
      <div class="transaction-section">
        <hzb-card class="transaction-card">
          <div slot="header" class="clearfix">
            <span>最近交易记录</span>
            <hzb-button style="float: right; padding: 3px 0" type="text" @click="viewAllTransactions">
              查看全部 <i class="hzb-icon-arrow-right"></i>
            </hzb-button>
          </div>
          <hzb-table
            :data="transactions"
            style="width: 100%"
            :show-header="true"
          >
            <hzb-table-column
              prop="date"
              label="交易日期"
              width="120">
            </hzb-table-column>
            <hzb-table-column
              prop="description"
              label="交易描述">
            </hzb-table-column>
            <hzb-table-column
              prop="amount"
              label="交易金额"
              width="120"
              align="right">
            </hzb-table-column>
            <hzb-table-column
              prop="balance"
              label="账户余额"
              width="120"
              align="right">
            </hzb-table-column>
          </hzb-table>
        </hzb-card>
      </div>

      <!-- 账户设置对话框 -->
      <hzb-dialog
        title="账户设置"
        :visible.sync="settingsDialogVisible"
        width="500px"
        :before-close="handleSettingsClose">
        <div class="settings-form">
          <hzb-descriptions title="基本信息">
            <hzb-descriptions-item label="用户名">张三</hzb-descriptions-item>
            <hzb-descriptions-item label="注册手机号">138****8888</hzb-descriptions-item>
            <hzb-descriptions-item label="注册邮箱">zhangs***mail.com</hzb-descriptions-item>
          </hzb-descriptions>
          
          <div class="form-section">
            <h3>安全设置</h3>
            <div class="setting-item">
              <div class="setting-label">登录密码</div>
              <div class="setting-action">
                <hzb-button type="text" @click="changePassword">修改密码</hzb-button>
              </div>
            </div>
            <div class="setting-item">
              <div class="setting-label">绑定手机</div>
              <div class="setting-action">
                <hzb-button type="text" @click="bindPhone">更换绑定手机</hzb-button>
              </div>
            </div>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <hzb-button @click="settingsDialogVisible = false">关闭</hzb-button>
        </span>
      </hzb-dialog>

      <!-- 修改密码对话框 -->
      <hzb-dialog
        title="修改登录密码"
        :visible.sync="passwordDialogVisible"
        width="400px">
        <div class="password-form">
          <div class="form-item">
            <label>原密码</label>
            <hzb-input type="password" v-model="oldPassword" placeholder="请输入原密码"></hzb-input>
          </div>
          <div class="form-item">
            <label>新密码</label>
            <hzb-input type="password" v-model="newPassword" placeholder="请输入新密码"></hzb-input>
          </div>
          <div class="form-item">
            <label>确认新密码</label>
            <hzb-input type="password" v-model="confirmPassword" placeholder="请再次输入新密码"></hzb-input>
          </div>
        </div>
        <span slot="footer" class="dialog-footer">
          <hzb-button @click="passwordDialogVisible = false">取消</hzb-button>
          <hzb-button type="primary" @click="savePassword">确定</hzb-button>
        </span>
      </hzb-dialog>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"
import GlobalNavigation from '@/components/GlobalNavigation.vue'

export default {
  name: 'AccountManagement',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      settingsDialogVisible: false,
      passwordDialogVisible: false,
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      modules: [
        {
          id: 1,
          title: '账户详情',
          description: '查看账户详细信息',
          icon: 'hzb-icon-bank-card',
          action: 'viewDetails'
        },
        {
          id: 2,
          title: '交易记录',
          description: '查询历史交易明细',
          icon: 'hzb-icon-data-line',
          action: 'viewTransactions'
        },
        {
          id: 3,
          title: '账户设置',
          description: '修改密码、绑定信息等',
          icon: 'hzb-icon-setting',
          action: 'openSettings'
        },
        {
          id: 4,
          title: '安全中心',
          description: '管理账户安全设置',
          icon: 'hzb-icon-key',
          action: 'viewSecurity'
        }
      ],
      transactions: [
        {
          date: '2023-06-15',
          description: '工资收入',
          amount: '+¥8,500.00',
          balance: '¥25,680.00'
        },
        {
          date: '2023-06-12',
          description: '超市购物',
          amount: '-¥245.50',
          balance: '¥17,180.00'
        },
        {
          date: '2023-06-10',
          description: '转账支出',
          amount: '-¥3,000.00',
          balance: '¥17,425.50'
        },
        {
          date: '2023-06-08',
          description: '理财收益',
          amount: '+¥125.80',
          balance: '¥20,425.50'
        },
        {
          date: '2023-06-05',
          description: '餐饮消费',
          amount: '-¥89.20',
          balance: '¥20,300.00'
        },
        {
          date: '2023-06-01',
          description: '工资收入',
          amount: '+¥8,500.00',
          balance: '¥20,389.20'
        }
      ]
    }
  },
  methods: {
    handleModuleClick(module) {
      switch (module.action) {
        case 'openSettings':
          this.settingsDialogVisible = true
          break
        case 'viewTransactions':
          this.viewAllTransactions()
          break
        case 'changePassword':
          this.passwordDialogVisible = true
          break
        default:
          this.$message.info(`点击了${module.title}模块`)
      }
    },
    refreshData() {
      this.$message.success('数据已刷新')
    },
    viewAllTransactions() {
      this.$message.info('查看全部交易记录')
    },
    handleSettingsClose(done) {
      this.$hzbConfirm('确认关闭设置窗口？')
        .then(_ => {
          done()
        })
        .catch(_ => {})
    },
    changePassword() {
      this.passwordDialogVisible = true
    },
    bindPhone() {
      this.$message.info('绑定手机功能')
    },
    savePassword() {
      if (this.newPassword !== this.confirmPassword) {
        this.$message.error('两次输入的密码不一致')
        return
      }
      this.$message.success('密码修改成功')
      this.passwordDialogVisible = false
      this.oldPassword = ''
      this.newPassword = ''
      this.confirmPassword = ''
    }
  }
}
</script>

<style scoped lang="scss">
.account-management-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.breadcrumb-container {
  margin-bottom: 24px;
}

.page-header {
  margin-bottom: 32px;
  
  h1 {
    font-size: 28px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 16px;
    color: #666;
  }
}

.account-overview {
  margin-bottom: 32px;
  
  .overview-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transform: translateY(-2px);
    }
  }
  
  .account-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .info-item {
    padding: 12px 0;
    
    .label {
      font-size: 14px;
      color: #999;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
    
    .status-active {
      color: #67c23a;
    }
    
    .balance {
      font-size: 20px;
      color: #333;
      font-weight: 600;
    }
  }
}

.function-modules {
  margin-bottom: 32px;
  
  .module-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
  }
  
  .module-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
    }
    
    .module-icon {
      font-size: 32px;
      margin-bottom: 16px;
      color: #409eff;
    }
    
    .module-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin-bottom: 8px;
    }
    
    .module-desc {
      font-size: 14px;
      color: #999;
    }
  }
}

.transaction-section {
  .transaction-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }
  }
  
  ::v-deep .hzb-table th {
    background-color: #f5f7fa;
  }
  
  ::v-deep .hzb-table td {
    padding: 12px 0;
  }
}

.settings-form {
  .form-section {
    margin-top: 24px;
    
    h3 {
      font-size: 16px;
      margin-bottom: 16px;
      color: #333;
    }
  }
  
  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
    
    .setting-label {
      font-size: 14px;
      color: #666;
    }
  }
  
  ::v-deep .hzb-descriptions__title {
    font-size: 16px;
    font-weight: 500;
  }
}

.password-form {
  .form-item {
    margin-bottom: 20px;
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      color: #666;
    }
  }
}

.dialog-footer {
  text-align: right;
}

// 兼容Chrome 83及以下版本
.clearfix::after {
  content: "";
  display: table;
  clear: both;
}

// 响应式设计
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
  
  .account-info {
    grid-template-columns: 1fr !important;
  }
  
  .module-grid {
    grid-template-columns: 1fr !important;
  }
  
  .page-header h1 {
    font-size: 24px;
  }
}
</style>