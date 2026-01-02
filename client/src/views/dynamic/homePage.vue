<template>
  <div class="home-page">
    <!-- 全局导航栏 -->
    <GlobalNavigation />

    <!-- 轮播图区域 -->
    <div class="carousel-section">
      <hzb-carousel trigger="click" height="500px">
        <hzb-carousel-item v-for="(image, index) in carouselImages" :key="index">
          <div class="carousel-item-container">
            <img :src="image" alt="轮播图" class="carousel-image" />
          </div>
        </hzb-carousel-item>
      </hzb-carousel>
    </div>

    <!-- 快速服务入口 -->
    <div class="quick-services-section">
      <div class="section-title">快速服务</div>
      <hzb-row :gutter="20" class="services-grid">
        <hzb-col :span="4" v-for="service in quickServices" :key="service.id" class="service-col">
          <div class="service-card" @click="handleServiceClick(service.targetPageId)">
            <i :class="['iconfont', service.icon, 'service-icon']"></i>
            <div class="service-name">{{ service.name }}</div>
          </div>
        </hzb-col>
      </hzb-row>
    </div>

    <!-- 新闻资讯 -->
    <div class="news-section">
      <div class="section-title">新闻资讯</div>
      <hzb-row :gutter="20">
        <hzb-col :span="8" v-for="news in newsList" :key="news.id" class="news-col">
          <div class="news-card" @click="handleNewsClick(news.targetPageId)">
            <div class="news-image-container">
              <img :src="news.image" alt="新闻图片" class="news-image" />
            </div>
            <div class="news-content">
              <div class="news-title">{{ news.title }}</div>
              <div class="news-date">{{ news.date }}</div>
            </div>
          </div>
        </hzb-col>
      </hzb-row>
    </div>

    <!-- 产品推荐 -->
    <div class="products-section">
      <div class="section-title">产品推荐</div>
      <hzb-row :gutter="20">
        <hzb-col :span="6" v-for="product in productList" :key="product.id" class="product-col">
          <hzb-card class="product-card" shadow="hover">
            <div slot="header" class="product-card-header">
              <i :class="['iconfont', product.icon, 'product-icon']"></i>
              <span class="product-name">{{ product.name }}</span>
            </div>
            <div class="product-description">{{ product.description }}</div>
            <div class="product-features">
              <div v-for="(feature, index) in product.features" :key="index" class="feature-item">
                <i class="iconfont hzb-icon-check"></i>
                <span>{{ feature }}</span>
              </div>
            </div>
            <hzb-button type="primary" class="product-button" @click="handleProductClick(product.targetPageId)">了解更多</hzb-button>
          </hzb-card>
        </hzb-col>
      </hzb-row>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"
import GlobalNavigation from '@/components/GlobalNavigation.vue'
import hzbBackground001 from '@/assets/images/backgroundImages/hzb-background-001.webp'
import hzbBackground002 from '@/assets/images/backgroundImages/hzb-background-002.webp'
import hzbBackground003 from '@/assets/images/backgroundImages/hzb-background-003.webp'
import hzbBackground004 from '@/assets/images/backgroundImages/hzb-background-004.webp'
import hzbBackground005 from '@/assets/images/backgroundImages/hzb-background-005.webp'

export default {
  name: 'HomePage',
  mixins: [screenshotMixin],
  components: {
    GlobalNavigation
  },
  data() {
    return {
      carouselImages: [
        hzbBackground001,
        hzbBackground002,
        hzbBackground003
      ],
      quickServices: [
        { id: 1, name: '账户查询', icon: 'hzb-icon-bank-card', targetPageId: 'accountManagement' },
        { id: 2, name: '贷款申请', icon: 'hzb-icon-document', targetPageId: 'personalLoan' },
        { id: 3, name: '网点查询', icon: 'hzb-icon-place', targetPageId: 'branchLocator' },
        { id: 4, name: '在线客服', icon: 'hzb-icon-headset', targetPageId: 'onlineSupport' },
        { id: 5, name: '下载中心', icon: 'hzb-icon-service', targetPageId: 'downloads' },
        { id: 6, name: '常见问题', icon: 'hzb-icon-news', targetPageId: 'faq' }
      ],
      newsList: [
        { 
          id: 1, 
          title: '杭州银行2023年度业绩报告发布', 
          date: '2024-03-15', 
          image: hzbBackground004,
          targetPageId: 'newsDetail'
        },
        { 
          id: 2, 
          title: '关于防范非法集资的风险提示', 
          date: '2024-03-10', 
          image: hzbBackground005,
          targetPageId: 'newsDetail'
        },
        { 
          id: 3, 
          title: '杭州银行荣获最佳数字银行奖', 
          date: '2024-03-05', 
          image: hzbBackground001,
          targetPageId: 'newsDetail'
        }
      ],
      productList: [
        {
          id: 1,
          name: '个人储蓄账户',
          icon: 'hzb-icon-house',
          description: '安全便捷的储蓄服务，多种利率选择',
          features: ['高安全性', '灵活存取', '多种账户类型'],
          targetPageId: 'savingsAndWealth'
        },
        {
          id: 2,
          name: '企业贷款',
          icon: 'hzb-icon-office-building',
          description: '助力企业发展，提供多样化融资方案',
          features: ['快速审批', '额度高', '期限灵活'],
          targetPageId: 'corporateLoans'
        },
        {
          id: 3,
          name: '信用卡服务',
          icon: 'hzb-icon-bank-card',
          description: '丰富权益，专享优惠，畅享品质生活',
          features: ['积分兑换', '专属优惠', '全球服务'],
          targetPageId: 'creditCardProducts'
        },
        {
          id: 4,
          name: '国际业务',
          icon: 'hzb-icon-place',
          description: '跨境金融服务，助力企业走向世界',
          features: ['外汇兑换', '贸易融资', '全球账户'],
          targetPageId: 'internationalBusiness'
        }
      ]
    }
  },
  methods: {
    handleServiceClick(targetPageId) {
      if (targetPageId) {
        this.$router.push('/' + targetPageId)
      }
    },
    handleNewsClick(targetPageId) {
      if (targetPageId) {
        this.$router.push('/' + targetPageId)
      }
    },
    handleProductClick(targetPageId) {
      if (targetPageId) {
        this.$router.push('/' + targetPageId)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.home-page {
  padding-top: 60px;
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.carousel-section {
  margin-bottom: 40px;
  
  ::v-deep .hzb-carousel__item {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.carousel-item-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.section-title {
  font-size: 28px;
  font-weight: 500;
  color: #333;
  text-align: center;
  margin: 40px 0;
  position: relative;
  
  &::after {
    content: '';
    display: block;
    width: 60px;
    height: 3px;
    background: #007aff;
    margin: 10px auto 0;
    border-radius: 2px;
  }
}

.quick-services-section {
  max-width: 1200px;
  margin: 0 auto 60px;
  padding: 0 20px;
}

.services-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.service-col {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.service-card {
  width: 160px;
  height: 140px;
  background: #ffffff;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
}

.service-icon {
  font-size: 36px;
  color: #007aff;
  margin-bottom: 12px;
}

.service-name {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.news-section {
  max-width: 1200px;
  margin: 0 auto 60px;
  padding: 0 20px;
}

.news-col {
  margin-bottom: 20px;
}

.news-card {
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
}

.news-image-container {
  width: 100%;
  height: 180px;
  overflow: hidden;
}

.news-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.news-card:hover .news-image {
  transform: scale(1.05);
}

.news-content {
  padding: 20px;
}

.news-title {
  font-size: 18px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  line-height: 1.4;
}

.news-date {
  font-size: 14px;
  color: #999;
}

.products-section {
  max-width: 1200px;
  margin: 0 auto 80px;
  padding: 0 20px;
}

.product-col {
  margin-bottom: 20px;
}

.product-card {
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
  
  ::v-deep .hzb-card__header {
    padding: 20px;
    border-bottom: 1px solid #eee;
  }
}

.product-card-header {
  display: flex;
  align-items: center;
}

.product-icon {
  font-size: 24px;
  color: #007aff;
  margin-right: 10px;
}

.product-name {
  font-size: 20px;
  font-weight: 500;
  color: #333;
}

.product-description {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin: 20px 0;
  min-height: 60px;
}

.product-features {
  margin: 20px 0;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
  
  i {
    color: #28a745;
    margin-right: 8px;
    font-size: 16px;
  }
}

.product-button {
  width: 100%;
  margin-top: 20px;
}

// 响应式设计
@media (max-width: 768px) {
  .section-title {
    font-size: 24px;
    margin: 30px 0;
  }
  
  .service-card {
    width: 140px;
    height: 120px;
  }
  
  .service-icon {
    font-size: 28px;
  }
  
  .service-name {
    font-size: 14px;
  }
  
  .news-image-container {
    height: 150px;
  }
  
  .news-title {
    font-size: 16px;
  }
  
  ::v-deep .hzb-carousel {
    height: 300px !important;
  }
}

@media (max-width: 480px) {
  .services-grid {
    ::v-deep .hzb-col {
      width: 50%;
    }
  }
  
  .news-section,
  .products-section {
    ::v-deep .hzb-col {
      width: 100%;
    }
  }
  
  .product-card-header {
    flex-direction: column;
    text-align: center;
  }
  
  .product-icon {
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>