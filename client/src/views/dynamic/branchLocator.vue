<template>
  <div class="branch-locator-page">
    <!-- 公共导航组件 -->
    <GlobalNavigation />

    <!-- 页面主体内容 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item @click.native="$router.push('/customerService')">客户服务</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>网点查询</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">网点查询</h1>
        <p class="page-subtitle">查找附近的杭州银行网点，获取详细信息和导航指引</p>
      </div>

      <!-- 搜索和筛选区域 -->
      <div class="search-section">
        <div class="search-box">
          <hzb-input
            v-model="searchKeyword"
            placeholder="请输入网点名称或地址关键词"
            prefix-icon="hzb-icon-search"
            @keyup.enter.native="handleSearch"
          ></hzb-input>
          <hzb-button type="primary" @click="handleSearch">搜索</hzb-button>
        </div>
        <div class="filter-box">
          <hzb-select v-model="selectedArea" placeholder="请选择区域" clearable>
            <hzb-option
              v-for="area in areaOptions"
              :key="area.value"
              :label="area.label"
              :value="area.value"
            ></hzb-option>
          </hzb-select>
        </div>
      </div>

      <!-- 地图和列表区域 -->
      <div class="content-layout">
        <!-- 地图展示区 -->
        <div class="map-container">
          <div class="map-placeholder">
            <i class="iconfont hzb-icon-map-location map-icon"></i>
            <p>交互式地图展示区</p>
            <p class="map-desc">支持缩放和拖拽操作查看网点位置</p>
          </div>
        </div>

        <!-- 网点列表区 -->
        <div class="list-container">
          <div class="list-header">
            <h2 class="section-title">网点列表</h2>
            <span class="result-count">共 {{ filteredBranches.length }} 个网点</span>
          </div>
          
          <div class="branch-list">
            <div 
              v-for="branch in paginatedBranches"
              :key="branch.id"
              class="branch-item"
              @click="viewBranchDetail(branch.id)"
            >
              <div class="branch-info">
                <h3 class="branch-name">{{ branch.name }}</h3>
                <div class="branch-meta">
                  <div class="meta-item">
                    <i class="iconfont hzb-icon-place"></i>
                    <span>{{ branch.address }}</span>
                  </div>
                  <div class="meta-item">
                    <i class="iconfont hzb-icon-phone"></i>
                    <span>{{ branch.phone }}</span>
                  </div>
                  <div class="meta-item">
                    <i class="iconfont hzb-icon-time"></i>
                    <span>{{ branch.businessHours }}</span>
                  </div>
                </div>
              </div>
              <hzb-button type="text" class="detail-button">查看详情</hzb-button>
            </div>
          </div>

          <!-- 分页组件 -->
          <div class="pagination-container">
            <hzb-pagination
              layout="prev, pager, next, jumper"
              :total="filteredBranches.length"
              :page-size="pageSize"
              :current-page.sync="currentPage"
            ></hzb-pagination>
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
  name: 'BranchLocator',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      searchKeyword: '',
      selectedArea: '',
      currentPage: 1,
      pageSize: 5,
      areaOptions: [
        { value: 'xihu', label: '西湖区' },
        { value: 'gongshu', label: '拱墅区' },
        { value: 'shangcheng', label: '上城区' },
        { value: 'xiacheng', label: '下城区' },
        { value: 'jianggan', label: '江干区' },
        { value: 'binjiang', label: '滨江区' },
        { value: 'xiaoshan', label: '萧山区' },
        { value: 'yuhang', label: '余杭区' }
      ],
      // Mock网点数据
      branches: [
        {
          id: '1',
          name: '杭州银行西湖支行',
          address: '杭州市西湖区文三路259号昌地火炬大厦1楼',
          phone: '0571-88888888',
          businessHours: '周一至周五 9:00-17:00',
          area: 'xihu'
        },
        {
          id: '2',
          name: '杭州银行武林支行',
          address: '杭州市下城区武林路289号',
          phone: '0571-88888889',
          businessHours: '周一至周日 8:30-17:30',
          area: 'xiacheng'
        },
        {
          id: '3',
          name: '杭州银行滨江支行',
          address: '杭州市滨江区江南大道3888号',
          phone: '0571-88888890',
          businessHours: '周一至周五 9:00-17:00',
          area: 'binjiang'
        },
        {
          id: '4',
          name: '杭州银行钱江支行',
          address: '杭州市上城区钱江路1366号华润大厦',
          phone: '0571-88888891',
          businessHours: '周一至周五 9:00-17:00',
          area: 'shangcheng'
        },
        {
          id: '5',
          name: '杭州银行萧山支行',
          address: '杭州市萧山区市心中路588号',
          phone: '0571-88888892',
          businessHours: '周一至周日 8:30-17:30',
          area: 'xiaoshan'
        },
        {
          id: '6',
          name: '杭州银行余杭支行',
          address: '杭州市余杭区临平南大街268号',
          phone: '0571-88888893',
          businessHours: '周一至周五 9:00-17:00',
          area: 'yuhang'
        },
        {
          id: '7',
          name: '杭州银行城东支行',
          address: '杭州市江干区新塘路388号',
          phone: '0571-88888894',
          businessHours: '周一至周日 9:00-17:00',
          area: 'jianggan'
        },
        {
          id: '8',
          name: '杭州银行城北支行',
          address: '杭州市拱墅区莫干山路1168号',
          phone: '0571-88888895',
          businessHours: '周一至周五 9:00-17:00',
          area: 'gongshu'
        }
      ]
    }
  },
  computed: {
    filteredBranches() {
      return this.branches.filter(branch => {
        const matchesKeyword = !this.searchKeyword || 
          branch.name.includes(this.searchKeyword) || 
          branch.address.includes(this.searchKeyword);
        const matchesArea = !this.selectedArea || branch.area === this.selectedArea;
        return matchesKeyword && matchesArea;
      });
    },
    paginatedBranches() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredBranches.slice(start, start + this.pageSize);
    }
  },
  methods: {
    handleSearch() {
      this.currentPage = 1;
    },
    viewBranchDetail(branchId) {
      // 跳转到网点详情页面（此处为示例，实际应根据路由配置调整）
      this.$router.push(`/branchDetail/${branchId}`);
    }
  }
}
</script>

<style scoped lang="scss">
.branch-locator-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  padding-top: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.breadcrumb-container {
  margin-bottom: 20px;
}

.page-header {
  margin-bottom: 30px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  line-height: 1.3;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  line-height: 1.5;
}

.search-section {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  
  .search-box {
    flex: 1;
    min-width: 300px;
    display: flex;
    gap: 12px;
    
    ::v-deep .hzb-input__inner {
      height: 40px;
      font-size: 14px;
    }
    
    .hzb-button {
      height: 40px;
      padding: 0 24px;
    }
  }
  
  .filter-box {
    width: 200px;
    
    ::v-deep .hzb-input__inner {
      height: 40px;
      font-size: 14px;
    }
  }
}

.content-layout {
  display: flex;
  gap: 24px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.map-container {
  flex: 1;
  min-width: 300px;
  height: 500px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  
  .map-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-color: #f0f4f8;
    
    .map-icon {
      font-size: 64px;
      color: #909399;
      margin-bottom: 16px;
    }
    
    p {
      font-size: 16px;
      color: #666;
      margin: 8px 0;
    }
    
    .map-desc {
      font-size: 14px;
      color: #999;
    }
  }
}

.list-container {
  width: 400px;
  min-width: 300px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  padding: 24px;
  display: flex;
  flex-direction: column;
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin: 0;
  }
  
  .result-count {
    font-size: 14px;
    color: #999;
  }
}

.branch-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 20px;
}

.branch-item {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    border-radius: 4px;
    padding-left: 16px;
    padding-right: 16px;
    margin-left: -16px;
    margin-right: -16px;
  }
  
  .branch-info {
    .branch-name {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin: 0 0 12px 0;
    }
    
    .branch-meta {
      .meta-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        i {
          font-size: 16px;
          margin-right: 8px;
          color: #999;
          min-width: 16px;
        }
        
        span {
          line-height: 1.5;
        }
      }
    }
  }
  
  .detail-button {
    margin-top: 12px;
    font-size: 14px;
    color: #0066ff;
    
    &:hover {
      color: #0052cc;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding-top: 20px;
  border-top: 1px solid #eee;
  
  ::v-deep .hzb-pagination {
    .btn-prev,
    .btn-next {
      width: 32px;
      height: 32px;
      line-height: 30px;
    }
    
    .hzb-pager li {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .content-layout {
    flex-direction: column;
  }
  
  .map-container {
    height: 400px;
  }
  
  .list-container {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
  
  .search-section {
    flex-direction: column;
    
    .search-box {
      min-width: 100%;
    }
    
    .filter-box {
      width: 100%;
    }
  }
  
  .map-container {
    height: 300px;
  }
  
  .page-title {
    font-size: 24px;
  }
}
</style>