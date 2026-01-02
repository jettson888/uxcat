<template>
  <div class="corporate-account-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面主体内容 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>企业银行</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>对公账户</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>对公账户管理</h1>
        <p>查看和管理您的企业银行对公账户信息</p>
      </div>

      <!-- 账户概览卡片 -->
      <div class="account-overview">
        <hzb-card class="account-card">
          <div slot="header" class="card-header">
            <span>账户概览</span>
            <hzb-button style="float: right; padding: 3px 0" type="text" @click="refreshData">
              <i class="hzb-icon-refresh"></i> 刷新
            </hzb-button>
          </div>
          <div class="account-info">
            <div class="info-item">
              <div class="label">账户名称</div>
              <div class="value">杭州科技有限公司基本账户</div>
            </div>
            <div class="info-item">
              <div class="label">账户号码</div>
              <div class="value">1234 5678 9012 3456</div>
            </div>
            <div class="info-item">
              <div class="label">账户余额</div>
              <div class="value balance">¥ 1,256,890.50</div>
            </div>
            <div class="info-item">
              <div class="label">账户类型</div>
              <div class="value">基本存款账户</div>
            </div>
            <div class="info-item">
              <div class="label">开户日期</div>
              <div class="value">2020-05-15</div>
            </div>
            <div class="info-item">
              <div class="label">账户状态</div>
              <div class="value status-active">正常</div>
            </div>
          </div>
        </hzb-card>
      </div>

      <!-- 功能操作区 -->
      <div class="function-section">
        <div class="section-title">账户操作</div>
        <div class="function-grid">
          <div 
            class="function-card" 
            v-for="item in functionList" 
            :key="item.id"
            @click="handleFunctionClick(item)"
          >
            <div class="icon-wrapper">
              <i :class="['iconfont', item.icon]"></i>
            </div>
            <div class="function-name">{{ item.name }}</div>
          </div>
        </div>
      </div>

      <!-- 交易记录 -->
      <div class="transaction-section">
        <div class="section-header">
          <div class="section-title">最近交易记录</div>
          <hzb-button type="text" @click="viewAllTransactions">查看全部</hzb-button>
        </div>
        <hzb-table
          :data="transactionData"
          style="width: 100%"
          class="transaction-table"
        >
          <hzb-table-column prop="date" label="交易时间" width="180"></hzb-table-column>
          <hzb-table-column prop="description" label="交易描述"></hzb-table-column>
          <hzb-table-column prop="amount" label="交易金额" width="150"></hzb-table-column>
          <hzb-table-column prop="balance" label="账户余额" width="150"></hzb-table-column>
          <hzb-table-column prop="status" label="状态" width="100">
            <template slot-scope="scope">
              <span :class="['status', `status-${scope.row.status.toLowerCase()}`]">
                {{ scope.row.status }}
              </span>
            </template>
          </hzb-table-column>
        </hzb-table>
      </div>
    </div>

    <!-- 功能操作弹窗 -->
    <hzb-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="500px"
      :before-close="handleDialogClose"
    >
      <div class="dialog-content">
        <div v-if="currentFunction.id === 'transfer'">
          <hzb-input v-model="transferForm.amount" placeholder="请输入转账金额" class="form-item"></hzb-input>
          <hzb-input v-model="transferForm.account" placeholder="请输入收款账户" class="form-item"></hzb-input>
          <hzb-input v-model="transferForm.remark" placeholder="备注信息" class="form-item"></hzb-input>
        </div>
        <div v-else-if="currentFunction.id === 'settings'">
          <hzb-input v-model="settingsForm.password" placeholder="请输入新密码" type="password" class="form-item"></hzb-input>
          <hzb-input v-model="settingsForm.phone" placeholder="请输入新手机号" class="form-item"></hzb-input>
        </div>
        <div v-else>
          <p>您选择了 {{ currentFunction.name }} 功能</p>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <hzb-button @click="dialogVisible = false">取 消</hzb-button>
        <hzb-button type="primary" @click="confirmFunction">确 定</hzb-button>
      </span>
    </hzb-dialog>
  </div>
</template>

<script>
// 引入截图mixin
import screenshotMixin from "@/common/mixin.js"
// 引入公共导航组件
import GlobalNavigation from '@/components/GlobalNavigation.vue'

export default {
  name: 'CorporateAccount',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      dialogVisible: false,
      dialogTitle: '',
      currentFunction: {},
      transferForm: {
        amount: '',
        account: '',
        remark: ''
      },
      settingsForm: {
        password: '',
        phone: ''
      },
      functionList: [
        { id: 'transfer', name: '转账汇款', icon: 'hzb-icon-data-line' },
        { id: 'settings', name: '账户设置', icon: 'hzb-icon-setting' },
        { id: 'detail', name: '账户详情', icon: 'hzb-icon-bank-card' },
        { id: 'history', name: '交易历史', icon: 'hzb-icon-search' }
      ],
      transactionData: [
        {
          date: '2023-06-15 14:30:22',
          description: '收到杭州电子商务有限公司货款',
          amount: '+¥250,000.00',
          balance: '¥1,256,890.50',
          status: '成功'
        },
        {
          date: '2023-06-14 09:15:45',
          description: '支付员工工资',
          amount: '-¥85,600.00',
          balance: '¥1,006,890.50',
          status: '成功'
        },
        {
          date: '2023-06-12 16:42:18',
          description: '收到杭州软件开发项目款',
          amount: '+¥120,000.00',
          balance: '¥1,092,490.50',
          status: '成功'
        },
        {
          date: '2023-06-10 11:20:33',
          description: '支付办公设备采购款',
          amount: '-¥32,500.00',
          balance: '¥972,490.50',
          status: '成功'
        },
        {
          date: '2023-06-08 13:45:12',
          description: '收到技术服务费',
          amount: '+¥65,000.00',
          balance: '¥1,004,990.50',
          status: '成功'
        }
      ]
    }
  },
  methods: {
    refreshData() {
      this.$message.success('数据刷新成功')
    },
    handleFunctionClick(item) {
      this.currentFunction = item
      this.dialogTitle = item.name
      this.dialogVisible = true
    },
    handleDialogClose(done) {
      this.$hzbConfirm('确认关闭？')
        .then(_ => {
          done();
        })
        .catch(_ => {});
    },
    confirmFunction() {
      this.dialogVisible = false
      this.$message.success(`${this.currentFunction.name}操作成功`)
    },
    viewAllTransactions() {
      this.$message.info('查看全部交易记录')
    }
  }
}
</script>

<style scoped lang="scss">
.corporate-account-page {
  min-height: 100vh;
  background-color: #f5f6f7;
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
  
  .account-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    
    ::v-deep .hzb-card__header {
      border-bottom: 1px solid #eee;
      padding: 16px 20px;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .account-info {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    padding: 20px;
  }
  
  .info-item {
    .label {
      font-size: 14px;
      color: #999;
      margin-bottom: 6px;
    }
    
    .value {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
    
    .balance {
      font-size: 20px;
      color: #409eff;
      font-weight: 600;
    }
    
    .status-active {
      color: #67c23a;
      font-weight: 500;
    }
  }
}

.function-section {
  margin-bottom: 32px;
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 20px;
  }
  
  .function-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 20px;
  }
  
  .function-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }
    
    .icon-wrapper {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f0f8ff;
      border-radius: 50%;
      
      i {
        font-size: 24px;
        color: #409eff;
      }
    }
    
    .function-name {
      font-size: 16px;
      color: #333;
      font-weight: 500;
    }
  }
}

.transaction-section {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
  }
  
  .transaction-table {
    ::v-deep .hzb-table__row {
      cursor: pointer;
      
      &:hover {
        background-color: #f5f7fa;
      }
    }
  }
  
  .status {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    
    &.status-成功 {
      background-color: #f0f9eb;
      color: #67c23a;
    }
    
    &.status-处理中 {
      background-color: #f4f4f5;
      color: #909399;
    }
    
    &.status-失败 {
      background-color: #fef0f0;
      color: #f56c6c;
    }
  }
}

.dialog-content {
  .form-item {
    margin-bottom: 20px;
  }
}

.dialog-footer {
  text-align: right;
}

// 响应式设计
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
  
  .account-info {
    grid-template-columns: 1fr !important;
  }
  
  .function-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
  
  .page-header h1 {
    font-size: 24px;
  }
}
</style>