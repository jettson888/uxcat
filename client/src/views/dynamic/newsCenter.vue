<template>
  <div class="news-center-page">
    <!-- 全局导航 -->
    <GlobalNavigation />

    <!-- 页面内容区域 -->
    <div class="page-content">
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <hzb-breadcrumb separator="/">
          <hzb-breadcrumb-item :to="{ path: '/' }">首页</hzb-breadcrumb-item>
          <hzb-breadcrumb-item>新闻资讯</hzb-breadcrumb-item>
        </hzb-breadcrumb>
      </div>

      <!-- 页面标题 -->
      <div class="page-header">
        <h1>新闻资讯</h1>
        <p>了解杭州银行最新动态、公告及行业资讯</p>
      </div>

      <!-- 搜索区域 -->
      <div class="search-section">
        <hzb-input
          v-model="searchKeyword"
          placeholder="请输入关键词搜索新闻"
          class="search-input"
          @keyup.enter.native="handleSearch"
        >
          <i slot="suffix" class="hzb-icon-search"></i>
        </hzb-input>
        <hzb-button type="primary" @click="handleSearch">搜索</hzb-button>
      </div>

      <!-- 新闻列表 -->
      <div class="news-list">
        <div
          v-for="news in filteredNewsList"
          :key="news.id"
          class="news-item"
          @click="goToNewsDetail(news.id)"
        >
          <div class="news-content">
            <h2 class="news-title">{{ news.title }}</h2>
            <p class="news-summary">{{ news.summary }}</p>
            <div class="news-meta">
              <span class="news-date">{{ news.date }}</span>
              <span class="news-category">{{ news.category }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div class="pagination-container">
        <hzb-pagination
          :current-page="currentPage"
          :page-size="pageSize"
          :total="filteredNewsList.length"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import screenshotMixin from "@/common/mixin.js"

// 模拟新闻数据
const mockNewsData = [
  {
    id: 1,
    title: '杭州银行发布2023年度业绩报告',
    summary: '杭州银行今日发布2023年度业绩报告，全年实现净利润同比增长15%，资产质量持续优化。',
    date: '2024-03-28',
    category: '业绩报告'
  },
  {
    id: 2,
    title: '杭州银行推出全新企业数字金融服务平台',
    summary: '为更好地服务企业客户，杭州银行正式推出企业数字金融服务平台，提供一站式金融解决方案。',
    date: '2024-03-25',
    category: '产品发布'
  },
  {
    id: 3,
    title: '杭州银行荣获“最佳城市商业银行”称号',
    summary: '在年度金融评选中，杭州银行凭借卓越的服务质量和创新能力荣获“最佳城市商业银行”称号。',
    date: '2024-03-20',
    category: '荣誉奖项'
  },
  {
    id: 4,
    title: '杭州银行与多家科技企业签署战略合作协议',
    summary: '杭州银行与五家知名科技企业签署战略合作协议，共同推进金融科技发展。',
    date: '2024-03-15',
    category: '合作动态'
  },
  {
    id: 5,
    title: '杭州银行优化个人理财服务体验',
    summary: '杭州银行全新升级个人理财服务平台，为客户提供更加便捷、智能的理财服务。',
    date: '2024-03-10',
    category: '服务升级'
  },
  {
    id: 6,
    title: '杭州银行开展消费者权益保护宣传活动',
    summary: '3·15期间，杭州银行开展系列消费者权益保护宣传活动，提升公众金融风险防范意识。',
    date: '2024-03-05',
    category: '公益活动'
  },
  {
    id: 7,
    title: '杭州银行支持小微企业复工复产',
    summary: '杭州银行推出专项信贷产品，全力支持小微企业复工复产，助力经济恢复发展。',
    date: '2024-02-28',
    category: '政策支持'
  },
  {
    id: 8,
    title: '杭州银行数字化转型取得新突破',
    summary: '杭州银行在数字化转型方面取得显著成果，线上业务占比持续提升。',
    date: '2024-02-20',
    category: '转型发展'
  }
]

export default {
  name: 'NewsCenter',
  components: {
    GlobalNavigation
  },
  mixins: [screenshotMixin],
  data() {
    return {
      searchKeyword: '',
      currentPage: 1,
      pageSize: 5,
      newsList: mockNewsData
    }
  },
  computed: {
    filteredNewsList() {
      // 根据搜索关键词过滤新闻
      if (!this.searchKeyword) {
        return this.newsList
      }
      
      const keyword = this.searchKeyword.toLowerCase()
      return this.newsList.filter(news => 
        news.title.toLowerCase().includes(keyword) || 
        news.summary.toLowerCase().includes(keyword) ||
        news.category.toLowerCase().includes(keyword)
      )
    }
  },
  methods: {
    handleSearch() {
      // 搜索功能实现
      this.currentPage = 1
    },
    handlePageChange(page) {
      this.currentPage = page
      // 滚动到页面顶部
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    goToNewsDetail(newsId) {
      // 跳转到新闻详情页面
      this.$router.push('/newsDetail')
    }
  }
}
</script>

<style scoped lang="scss">
.news-center-page {
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
    font-size: 32px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 16px;
    color: #666;
  }
}

.search-section {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  
  .search-input {
    flex: 1;
  }
}

.news-list {
  margin-bottom: 32px;
}

.news-item {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .news-title {
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
    transition: color 0.3s ease;
  }
  
  &:hover .news-title {
    color: #0066cc;
  }
  
  .news-summary {
    font-size: 15px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 16px;
  }
  
  .news-meta {
    display: flex;
    gap: 16px;
    
    .news-date {
      font-size: 14px;
      color: #999;
    }
    
    .news-category {
      font-size: 14px;
      color: #0066cc;
      background: rgba(0, 102, 204, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 32px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 16px;
  }
  
  .search-section {
    flex-direction: column;
  }
  
  .page-header h1 {
    font-size: 28px;
  }
  
  .news-item {
    padding: 16px;
  }
  
  .news-title {
    font-size: 18px;
  }
}
</style>