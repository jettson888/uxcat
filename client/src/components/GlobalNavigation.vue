<template>
  <div class="global-navigation">
    <div class="nav-container">
      <!-- 左侧区域：LOGO + 应用名称 -->
      <div class="nav-left">
        <div class="logo-container">
          <img :src="logo" alt="logo" />
        </div>
        <span class="app-name">杭州银行</span>
      </div>

      <!-- 中间区域：导航页签 -->
      <div class="nav-center">
        <div
          v-for="item in navigationList"
          :key="item.navigationId"
          class="nav-item"
          :class="{ active: currentRoute === item.targetPageId }"
          @click="handleNavClick(item.targetPageId)"
        >
          {{ item.name }}
        </div>
      </div>

      <!-- 右侧区域：操作图标 + 用户信息 -->
      <div class="nav-right">
        <div class="user-info">
          <div class="avatar-container">
            <img :src="avatar" alt="avatar" />
          </div>
          <span class="user-name">用户名称</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import logo from '@/assets/images/logo.png'
import avatar from '@/assets/images/avatar.png'

export default {
  name: 'GlobalNavigation',
  data() {
    return {
      logo,
      avatar,
      currentRoute: 'homePage',
      navigationList: [
        { name: '首页', navigationId: 'goHome', targetPageId: 'homePage' },
        { name: '个人银行', navigationId: 'goPersonalBanking', targetPageId: 'personalBanking' },
        { name: '企业银行', navigationId: 'goCorporateBanking', targetPageId: 'corporateBanking' },
        { name: '新闻资讯', navigationId: 'goNewsCenter', targetPageId: 'newsCenter' },
        { name: '客户服务', navigationId: 'goCustomerService', targetPageId: 'customerService' }
      ]
    }
  },
  methods: {
    handleNavClick(targetPageId) {
      this.currentRoute = targetPageId
      this.$router.push('/' + targetPageId)
    }
  },
  watch: {
    '$route'(to) {
      const matchedRoute = this.navigationList.find(item => '/' + item.targetPageId === to.path)
      if (matchedRoute) {
        this.currentRoute = matchedRoute.targetPageId
      }
    }
  },
  mounted() {
    const matchedRoute = this.navigationList.find(item => '/' + item.targetPageId === this.$route.path)
    if (matchedRoute) {
      this.currentRoute = matchedRoute.targetPageId
    }
  }
}
</script>

<style scoped>
.global-navigation {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background-color: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 1000;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav-left {
  display: flex;
  align-items: center;
}

.logo-container {
  width: 32px;
  height: 32px;
  overflow: hidden;
}

.logo-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.app-name {
  margin-left: 12px;
  font-size: 18px;
  color: #333333;
  font-weight: 500;
}

.nav-center {
  display: flex;
  align-items: center;
}

.nav-item {
  padding: 0 20px;
  height: 60px;
  line-height: 60px;
  font-size: 16px;
  color: #666666;
  cursor: pointer;
  transition: color 0.3s ease;
}

.nav-item:hover {
  color: #333333;
}

.nav-item.active {
  color: #333333;
  font-weight: 500;
  border-bottom: 2px solid #333333;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-name {
  margin-left: 10px;
  font-size: 14px;
  color: #333333;
}

/* 兼容Chrome 83及以下版本的样式处理 */
.nav-center::after {
  content: '';
  display: table;
  clear: both;
}
</style>