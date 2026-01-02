<template>
  <div class="news-detail-page">
    <!-- 页面头部 -->
    <hzb-page-header @back="goBack" content="新闻详情">
    </hzb-page-header>

    <!-- 新闻内容区域 -->
    <div class="news-content-container">
      <!-- 新闻标题 -->
      <h1 class="news-title">{{ newsData.title }}</h1>

      <!-- 新闻信息 -->
      <div class="news-meta">
        <span class="meta-item">
          <i class="iconfont hzb-icon-date"></i>
          {{ newsData.publishTime }}
        </span>
        <span class="meta-item">
          <i class="iconfont hzb-icon-collection"></i>
          来源：{{ newsData.source }}
        </span>
      </div>

      <!-- 新闻正文 -->
      <div class="news-body">
        <p v-for="(paragraph, index) in newsData.content" :key="index" class="news-paragraph">
          {{ paragraph }}
        </p>

        <!-- 新闻图片 -->
        <div v-for="(image, index) in newsData.images" :key="index" class="news-image-wrapper">
          <hzb-image
            :src="image.src"
            :preview-src-list="newsData.images.map(img => img.src)"
            :initial-index="index"
            fit="cover"
            class="news-image"
          ></hzb-image>
        </div>
      </div>

      <!-- 分享功能 -->
      <div class="news-share">
        <hzb-button type="primary" icon="hzb-icon-share" @click="shareNews">
          分享新闻
        </hzb-button>
      </div>

      <!-- 相关新闻推荐 -->
      <div class="related-news-section">
        <h2 class="section-title">相关新闻</h2>
        <div class="related-news-list">
          <div
            v-for="relatedNews in relatedNewsList"
            :key="relatedNews.id"
            class="related-news-item"
            @click="goToNewsDetail(relatedNews.id)"
          >
            <hzb-image
              :src="relatedNews.image"
              fit="cover"
              class="related-news-image"
            ></hzb-image>
            <div class="related-news-info">
              <h3 class="related-news-title">{{ relatedNews.title }}</h3>
              <p class="related-news-date">{{ relatedNews.date }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 引入截图mixin
import screenshotMixin from "@/common/mixin.js";
// 引入图片资源
import hzbBackground001 from '@/assets/images/backgroundImages/hzb-background-001.webp';
import hzbBackground002 from '@/assets/images/backgroundImages/hzb-background-002.webp';
import hzbBackground003 from '@/assets/images/backgroundImages/hzb-background-003.webp';

export default {
  name: "NewsDetail",
  mixins: [screenshotMixin],
  data() {
    return {
      // 当前新闻数据
      newsData: {
        title: "杭州银行发布全新数字化金融服务平台",
        publishTime: "2023-06-15 10:30",
        source: "杭州银行官方",
        content: [
          "杭州银行近日正式发布全新数字化金融服务平台，旨在为客户提供更加便捷、智能的金融服务体验。该平台整合了人工智能、大数据分析等前沿技术，实现了业务办理的全面线上化。",
          "新平台推出了多项创新功能，包括智能客服、个性化产品推荐、一键式贷款申请等。用户可以通过手机APP或网页端随时随地办理各类银行业务，享受7x24小时不间断服务。",
          "杭州银行行长表示，此次数字化转型是银行顺应金融科技发展趋势的重要举措，未来将继续加大科技投入，为客户提供更加优质、高效的金融服务。",
          "据悉，该平台自试运行以来，已服务超过十万用户，业务办理效率提升30%以上，客户满意度达到95%以上。"
        ],
        images: [
          { src: hzbBackground001 },
          { src: hzbBackground002 }
        ]
      },
      // 相关新闻列表
      relatedNewsList: [
        {
          id: "news001",
          title: "杭州银行推出小微企业专项贷款产品",
          date: "2023-06-10",
          image: hzbBackground003
        },
        {
          id: "news002",
          title: "杭州银行荣获年度最佳数字银行奖",
          date: "2023-06-05",
          image: hzbBackground001
        },
        {
          id: "news003",
          title: "杭州银行与科技公司达成战略合作",
          date: "2023-05-28",
          image: hzbBackground002
        }
      ]
    };
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.go(-1);
    },
    // 分享新闻
    shareNews() {
      // 这里可以调用浏览器的分享API或者自定义分享逻辑
      if (navigator.share) {
        navigator.share({
          title: this.newsData.title,
          text: this.newsData.content[0],
          url: window.location.href
        }).catch(console.error);
      } else {
        // 兼容不支持Web Share API的浏览器
        alert("您可以通过复制链接来分享此新闻");
      }
    },
    // 跳转到相关新闻详情
    goToNewsDetail(newsId) {
      // 根据实际路由配置调整
      this.$router.push(`/newsDetail?newsId=${newsId}`);
    }
  }
};
</script>

<style lang="scss" scoped>
.news-detail-page {
  padding-top: 60px; // 为固定导航留出空间
  min-height: 100vh;
  background-color: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.news-content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #ffffff;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  margin-top: 20px;
}

.news-title {
  font-size: 28px;
  font-weight: 600;
  color: #333333;
  line-height: 1.4;
  margin-bottom: 20px;
  text-align: center;
}

.news-meta {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  padding: 15px 0;
  border-top: 1px solid #eeeeee;
  border-bottom: 1px solid #eeeeee;
}

.meta-item {
  display: flex;
  align-items: center;
  margin: 0 20px;
  font-size: 14px;
  color: #666666;
  
  i {
    margin-right: 8px;
    font-size: 16px;
  }
}

.news-body {
  margin-bottom: 40px;
}

.news-paragraph {
  font-size: 16px;
  line-height: 1.8;
  color: #444444;
  margin-bottom: 20px;
  text-align: justify;
}

.news-image-wrapper {
  text-align: center;
  margin: 30px 0;
  
  .news-image {
    width: 100%;
    max-width: 800px;
    height: 400px;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    
    &:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }
  }
}

.news-share {
  text-align: center;
  margin-bottom: 40px;
  
  .hzb-button {
    padding: 12px 30px;
    font-size: 16px;
    border-radius: 30px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
  }
}

.related-news-section {
  border-top: 1px solid #eeeeee;
  padding-top: 30px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 25px;
  text-align: center;
}

.related-news-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.related-news-item {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  }
}

.related-news-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.related-news-info {
  padding: 20px;
  background-color: #ffffff;
}

.related-news-title {
  font-size: 16px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 10px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.related-news-date {
  font-size: 13px;
  color: #999999;
}

// 响应式设计
@media (max-width: 768px) {
  .news-content-container {
    padding: 20px 15px;
    margin-top: 10px;
  }
  
  .news-title {
    font-size: 24px;
  }
  
  .meta-item {
    margin: 0 10px;
    font-size: 13px;
  }
  
  .news-paragraph {
    font-size: 15px;
  }
  
  .news-image {
    height: 250px !important;
  }
  
  .related-news-list {
    grid-template-columns: 1fr;
  }
}
</style>