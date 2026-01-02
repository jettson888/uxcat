<template>
  <div class="home-page">
    <!-- 全局导航栏 -->
    <hzb-navigation-bar
      :nav-items="navItems"
      @navigate="handleNavigation"
    />

    <!-- 轮播图区域 -->
    <div class="carousel-container">
      <hzb-carousel
        v-model="carouselIndex"
        :items="carouselImages"
        :autoplay="true"
        :interval="5000"
      />
    </div>

    <!-- 核心产品与服务快捷入口 -->
    <div class="services-section">
      <h2 class="section-title">核心产品与服务</h2>
      <div class="services-grid">
        <hzb-card
          v-for="service in services"
          :key="service.id"
          class="service-card"
          :title="service.title"
          @click="handleServiceClick(service)"
        >
          <template #icon>
            <i :class="['iconfont', service.icon, 'service-icon']" />
          </template>
          <p class="service-description">{{ service.description }}</p>
        </hzb-card>
      </div>
    </div>

    <!-- 新闻公告区域 -->
    <div class="news-section">
      <h2 class="section-title">新闻公告</h2>
      <div class="news-list">
        <div
          v-for="news in newsList"
          :key="news.id"
          class="news-item"
          @click="handleNewsClick(news)"
        >
          <h3 class="news-title">{{ news.title }}</h3>
          <p class="news-date">{{ news.date }}</p>
        </div>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="footer-section">
      <div class="footer-content">
        <div class="footer-links">
          <a href="#" @click.prevent="goToPage('sitemap')">网站地图</a>
          <a href="#" @click.prevent="goToPage('contact')">联系方式</a>
          <a href="#" @click.prevent="goToPage('legal')">法律声明</a>
        </div>
        <p class="copyright">© 2023 杭州银行. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js";

export default {
  name: "Home",
  mixins: [screenshotMixin],
  data() {
    return {
      carouselIndex: 0,
      navItems: [
        { id: "goPersonalBanking", name: "个人银行", targetPageId: "personalBanking" },
        { id: "goCorporateBanking", name: "企业银行", targetPageId: "corporateBanking" },
        { id: "goNewsAndAnnouncements", name: "新闻公告", targetPageId: "newsAndAnnouncements" },
        { id: "goOnlineService", name: "在线服务", targetPageId: "onlineService" },
      ],
      carouselImages: [
        { id: 1, src: "/src/assets/images/backgroundImages/hzb-background-001.webp" },
        { id: 2, src: "/src/assets/images/backgroundImages/hzb-background-002.webp" },
        { id: 3, src: "/src/assets/images/backgroundImages/hzb-background-003.webp" },
      ],
      services: [
        { id: 1, title: "存款服务", icon: "hzb-icon-home", description: "安全可靠的存款产品，满足您的财富增值需求", targetPageId: "deposit" },
        { id: 2, title: "贷款服务", icon: "hzb-icon-user", description: "灵活多样的贷款方案，助力您的事业发展", targetPageId: "loan" },
        { id: 3, title: "信用卡", icon: "hzb-icon-home", description: "专属信用卡服务，享受便捷支付体验", targetPageId: "creditCard" },
        { id: 4, title: "投资理财", icon: "hzb-icon-user", description: "专业理财服务，实现财富稳健增长", targetPageId: "investment" },
      ],
      newsList: [
        { id: 1, title: "杭州银行荣获最佳数字银行奖", date: "2023-10-15", targetPageId: "newsDetail1" },
        { id: 2, title: "关于系统维护的通知", date: "2023-10-10", targetPageId: "newsDetail2" },
        { id: 3, title: "杭州银行推出全新企业贷款产品", date: "2023-10-05", targetPageId: "newsDetail3" },
        { id: 4, title: "关于防范电信诈骗的风险提示", date: "2023-09-28", targetPageId: "newsDetail4" },
      ],
    };
  },
  methods: {
    handleNavigation(item) {
      this.$router.push(`/${item.targetPageId}`);
    },
    handleServiceClick(service) {
      this.$router.push(`/${service.targetPageId}`);
    },
    handleNewsClick(news) {
      this.$router.push(`/${news.targetPageId}`);
    },
    goToPage(page) {
      // 特殊页面跳转处理
      console.log(`跳转到${page}页面`);
    },
  },
};
</script>

<style lang="scss" scoped>
.home-page {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  color: #333;
  line-height: 1.6;
}

.carousel-container {
  width: 100%;
  height: 500px;
  overflow: hidden;
  margin-bottom: 40px;

  ::v-deep .hzb-carousel {
    width: 100%;
    height: 100%;
    
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
}

.services-section {
  max-width: 1200px;
  margin: 0 auto 60px;
  padding: 0 20px;
}

.section-title {
  font-size: 28px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 40px;
  color: #1a1a1a;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.service-card {
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  }
}

.service-icon {
  font-size: 48px;
  color: #0066cc;
  margin-bottom: 20px;
}

.service-description {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
}

.news-section {
  max-width: 1200px;
  margin: 0 auto 60px;
  padding: 0 20px;
}

.news-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.news-item {
  padding: 20px;
  border-radius: 8px;
  background: #f8f9fa;
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    background: #ffffff;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  }
}

.news-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #1a1a1a;
}

.news-date {
  color: #999;
  font-size: 14px;
}

.footer-section {
  background: #f8f9fa;
  padding: 40px 20px;
  margin-top: 60px;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.footer-links {
  margin-bottom: 20px;
  
  a {
    color: #666;
    margin: 0 15px;
    text-decoration: none;
    transition: color 0.3s ease;
    
    &:hover {
      color: #0066cc;
    }
  }
}

.copyright {
  color: #999;
  font-size: 14px;
}
</style>