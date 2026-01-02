<template>
  <div class="savings-wealth-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面主体内容 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item @click.native="$router.push('/personalBanking')">个人银行</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>储蓄理财</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>储蓄理财</h1>
        <p>为您提供多样化的储蓄和理财产品，满足您的不同需求</p>
      </div>

      <!-- 筛选区域 -->
      <div class="filter-section">
        <div class="filter-item">
          <label>产品类型：</label>
          <hzb-select v-model="filter.productType" placeholder="请选择" clearable>
            <hzb-option
              v-for="item in productTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </hzb-option>
          </hzb-select>
        </div>
        <div class="filter-item">
          <label>收益率：</label>
          <hzb-select v-model="filter.returnRate" placeholder="请选择" clearable>
            <hzb-option
              v-for="item in returnRates"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </hzb-option>
          </hzb-select>
        </div>
        <hzb-button type="primary" @click="handleFilter">筛选</hzb-button>
        <hzb-button @click="resetFilter">重置</hzb-button>
      </div>

      <!-- 储蓄产品板块 -->
      <div class="product-section">
        <div class="section-header">
          <h2>储蓄产品</h2>
          <i class="iconfont hzb-icon-s-finance"></i>
        </div>
        <div class="product-list">
          <div 
            v-for="product in savingsProducts" 
            :key="product.id"
            class="product-card"
            @click="goToDetail(product.id, 'deposit')"
          >
            <div class="product-icon">
              <i class="iconfont hzb-icon-s-data"></i>
            </div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="product-rate">年化收益率：<span>{{ product.rate }}%</span></p>
              <p class="product-term">期限：{{ product.term }}</p>
              <p class="product-description">{{ product.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 理财产品板块 -->
      <div class="product-section">
        <div class="section-header">
          <h2>理财产品</h2>
          <i class="iconfont hzb-icon-s-grid"></i>
        </div>
        <div class="product-list">
          <div 
            v-for="product in wealthProducts" 
            :key="product.id"
            class="product-card"
            @click="goToDetail(product.id, 'wealth')"
          >
            <div class="product-icon">
              <i class="iconfont hzb-icon-s-operation"></i>
            </div>
            <div class="product-info">
              <h3>{{ product.name }}</h3>
              <p class="product-rate">预期年化收益率：<span>{{ product.rate }}%</span></p>
              <p class="product-term">期限：{{ product.term }}</p>
              <p class="product-description">{{ product.description }}</p>
            </div>
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
  name: 'SavingsAndWealth',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      filter: {
        productType: '',
        returnRate: ''
      },
      productTypes: [
        { value: 'savings', label: '储蓄产品' },
        { value: 'wealth', label: '理财产品' }
      ],
      returnRates: [
        { value: '3', label: '3%以上' },
        { value: '4', label: '4%以上' },
        { value: '5', label: '5%以上' }
      ],
      allSavingsProducts: [
        {
          id: 's001',
          name: '活期储蓄账户',
          rate: 0.3,
          term: '灵活存取',
          description: '资金灵活存取，收益稳定，适合日常资金管理'
        },
        {
          id: 's002',
          name: '定期存款-3个月',
          rate: 1.5,
          term: '3个月',
          description: '固定期限存款，收益稳定，适合短期资金规划'
        },
        {
          id: 's003',
          name: '定期存款-6个月',
          rate: 1.8,
          term: '6个月',
          description: '中等期限存款，收益较活期更高'
        },
        {
          id: 's004',
          name: '定期存款-1年',
          rate: 2.1,
          term: '1年',
          description: '长期存款产品，收益更高，适合长期资金规划'
        },
        {
          id: 's005',
          name: '大额存单-20万起',
          rate: 2.5,
          term: '1年',
          description: '起存金额较高，收益更优，适合大额资金存储'
        }
      ],
      allWealthProducts: [
        {
          id: 'w001',
          name: '稳健理财A款',
          rate: 3.2,
          term: '30天',
          description: '低风险理财产品，收益稳定，适合保守型投资者'
        },
        {
          id: 'w002',
          name: '平衡理财B款',
          rate: 4.1,
          term: '90天',
          description: '中等风险产品，收益较稳健，适合平衡型投资者'
        },
        {
          id: 'w003',
          name: '成长理财C款',
          rate: 4.8,
          term: '180天',
          description: '中高风险产品，收益潜力大，适合成长型投资者'
        },
        {
          id: 'w004',
          name: '进取理财D款',
          rate: 5.5,
          term: '365天',
          description: '高风险高收益产品，适合风险承受能力强的投资者'
        },
        {
          id: 'w005',
          name: '货币基金E款',
          rate: 2.8,
          term: '灵活存取',
          description: '流动性强，风险极低，收益高于活期储蓄'
        }
      ]
    }
  },
  computed: {
    savingsProducts() {
      return this.allSavingsProducts.filter(product => {
        if (this.filter.productType && this.filter.productType !== 'savings') return false
        if (this.filter.returnRate && product.rate < parseFloat(this.filter.returnRate)) return false
        return true
      })
    },
    wealthProducts() {
      return this.allWealthProducts.filter(product => {
        if (this.filter.productType && this.filter.productType !== 'wealth') return false
        if (this.filter.returnRate && product.rate < parseFloat(this.filter.returnRate)) return false
        return true
      })
    }
  },
  methods: {
    handleFilter() {
      // 筛选逻辑已在computed中实现
    },
    resetFilter() {
      this.filter = {
        productType: '',
        returnRate: ''
      }
    },
    goToDetail(productId, type) {
      if (type === 'deposit') {
        this.$router.push(`/depositDetail?productId=${productId}`)
      } else {
        this.$router.push(`/creditCardDetail?productId=${productId}`)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.savings-wealth-page {
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
  margin-bottom: 20px;
  padding: 10px 0;
  
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
    margin-bottom: 10px;
  }
  
  p {
    font-size: 16px;
    color: #666;
  }
}

.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  
  .filter-item {
    display: flex;
    align-items: center;
    
    label {
      margin-right: 10px;
      font-size: 14px;
      color: #333;
      white-space: nowrap;
    }
    
    ::v-deep .hzb-select {
      width: 180px;
    }
  }
  
  ::v-deep .hzb-button {
    margin-left: 10px;
  }
}

.product-section {
  margin-bottom: 40px;
  
  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      font-size: 22px;
      font-weight: 600;
      color: #333;
      margin-right: 10px;
    }
    
    .iconfont {
      font-size: 20px;
      color: #409eff;
    }
  }
}

.product-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  display: flex;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
  
  .product-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #e8f4ff;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 15px;
    flex-shrink: 0;
    
    .iconfont {
      font-size: 24px;
      color: #409eff;
    }
  }
  
  .product-info {
    flex: 1;
    
    h3 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
    }
    
    .product-rate {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
      
      span {
        font-weight: 600;
        color: #ff6b35;
      }
    }
    
    .product-term {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }
    
    .product-description {
      font-size: 13px;
      color: #999;
      line-height: 1.5;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
  
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .product-list {
    grid-template-columns: 1fr;
  }
  
  .product-card {
    flex-direction: column;
    
    .product-icon {
      margin-right: 0;
      margin-bottom: 15px;
    }
  }
}
</style>