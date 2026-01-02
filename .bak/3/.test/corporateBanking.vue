<template>
  <div class="corporate-bank-page">
    <!-- 全局导航栏 -->
    <div class="navigation-bar">
      <hzb-ui-navbar :routes="navRoutes" @navigate="handleNavigate" />
    </div>

    <!-- 页面主内容 -->
    <div class="main-content">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1>企业银行服务</h1>
        <p>专为企业客户打造的全方位金融服务解决方案</p>
      </div>

      <!-- 核心服务模块 -->
      <div class="service-modules">
        <div 
          v-for="module in serviceModules" 
          :key="module.id"
          class="module-card"
          @click="goToService(module.targetPageId)"
        >
          <div class="module-icon">
            <i :class="['iconfont', module.icon]" />
          </div>
          <h3>{{ module.title }}</h3>
          <p>{{ module.description }}</p>
        </div>
      </div>

      <!-- 成功案例 -->
      <div class="case-section">
        <h2>成功案例</h2>
        <div class="case-list">
          <div 
            v-for="caseItem in caseStudies" 
            :key="caseItem.id"
            class="case-item"
          >
            <div class="case-image">
              <img :src="caseItem.image" :alt="caseItem.title" />
            </div>
            <div class="case-info">
              <h4>{{ caseItem.title }}</h4>
              <p>{{ caseItem.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 快速申请入口 -->
      <div class="quick-application">
        <h2>快速申请企业服务</h2>
        <hzb-ui-button type="primary" @click="openApplicationForm">
          在线申请
        </hzb-ui-button>
      </div>

      <!-- 底部链接 -->
      <div class="footer-links">
        <a href="#" @click.prevent="downloadAgreement">企业银行服务协议</a>
        <a href="#" @click.prevent="downloadManual">操作手册下载</a>
      </div>
    </div>

    <!-- 申请表单弹窗 -->
    <hzb-ui-dialog 
      v-model="showApplicationForm" 
      title="企业服务申请"
      width="500px"
    >
      <div class="application-form">
        <hzb-ui-form :model="applicationData" label-width="100px">
          <hzb-ui-form-item label="企业名称">
            <hzb-ui-input v-model="applicationData.companyName" placeholder="请输入企业全称" />
          </hzb-ui-form-item>
          <hzb-ui-form-item label="联系人">
            <hzb-ui-input v-model="applicationData.contactPerson" placeholder="请输入联系人姓名" />
          </hzb-ui-form-item>
          <hzb-ui-form-item label="联系电话">
            <hzb-ui-input v-model="applicationData.contactPhone" placeholder="请输入联系电话" />
          </hzb-ui-form-item>
          <hzb-ui-form-item label="服务类型">
            <hzb-ui-select v-model="applicationData.serviceType" placeholder="请选择需要的服务">
              <hzb-ui-option 
                v-for="service in serviceTypes" 
                :key="service.value" 
                :label="service.label" 
                :value="service.value"
              />
            </hzb-ui-select>
          </hzb-ui-form-item>
          <hzb-ui-form-item label="备注">
            <hzb-ui-input 
              v-model="applicationData.remarks" 
              type="textarea" 
              placeholder="请输入其他需求或备注信息" 
            />
          </hzb-ui-form-item>
        </hzb-ui-form>
        <div class="form-actions">
          <hzb-ui-button @click="showApplicationForm = false">取消</hzb-ui-button>
          <hzb-ui-button type="primary" @click="submitApplication">提交</hzb-ui-button>
        </div>
      </div>
    </hzb-ui-dialog>
  </div>
</template>

<script>
// 引入截图mixin
import screenshotMixin from "@/common/mixin.js";

export default {
  name: "CorporateBank",
  mixins: [screenshotMixin],
  data() {
    return {
      // 导航数据
      navRoutes: [
        { id: "goHomePageFromCorporate", name: "首页", targetPageId: "homePage" },
      ],
      
      // 服务模块数据
      serviceModules: [
        {
          id: "businessLoans",
          title: "企业贷款",
          description: "提供多样化的贷款产品，满足企业不同发展阶段的资金需求",
          icon: "hzb-icon-document-checked",
          targetPageId: "businessLoans",
        },
        {
          id: "cashManagement",
          title: "现金管理",
          description: "帮助企业优化现金流，提高资金使用效率",
          icon: "hzb-icon-user",
          targetPageId: "cashManagement",
        },
        {
          id: "internationalBusiness",
          title: "国际业务",
          description: "提供全方位的跨境金融服务解决方案",
          icon: "hzb-icon-home",
          targetPageId: "internationalBusiness",
        },
        {
          id: "corporateOnlineBanking",
          title: "企业网银",
          description: "安全便捷的在线银行服务，随时随地管理企业账户",
          icon: "hzb-icon-document-checked",
          targetPageId: "corporateOnlineBanking",
        },
      ],
      
      // 成功案例数据
      caseStudies: [
        {
          id: 1,
          title: "制造业资金管理优化",
          description: "为某大型制造企业设计现金管理方案，提升资金使用效率30%",
          image: "/src/assets/images/backgroundImages/hzb-background-001.webp",
        },
        {
          id: 2,
          title: "跨境贸易融资",
          description: "为进出口企业提供一站式跨境金融服务，降低融资成本20%",
          image: "/src/assets/images/backgroundImages/hzb-background-002.webp",
        },
      ],
      
      // 申请表单数据
      showApplicationForm: false,
      applicationData: {
        companyName: "",
        contactPerson: "",
        contactPhone: "",
        serviceType: "",
        remarks: "",
      },
      
      // 服务类型选项
      serviceTypes: [
        { value: "businessLoans", label: "企业贷款" },
        { value: "cashManagement", label: "现金管理" },
        { value: "internationalBusiness", label: "国际业务" },
        { value: "corporateOnlineBanking", label: "企业网银" },
      ],
    };
  },
  methods: {
    // 处理导航跳转
    handleNavigate(route) {
      this.$router.push(route.targetPageId);
    },
    
    // 跳转到具体服务页面
    goToService(targetPageId) {
      this.$router.push(targetPageId);
    },
    
    // 打开申请表单
    openApplicationForm() {
      this.showApplicationForm = true;
    },
    
    // 提交申请
    submitApplication() {
      // 表单验证
      if (!this.applicationData.companyName) {
        this.$message.warning("请输入企业名称");
        return;
      }
      if (!this.applicationData.contactPerson) {
        this.$message.warning("请输入联系人");
        return;
      }
      if (!this.applicationData.contactPhone) {
        this.$message.warning("请输入联系电话");
        return;
      }
      if (!this.applicationData.serviceType) {
        this.$message.warning("请选择服务类型");
        return;
      }
      
      // 模拟提交成功
      this.$message.success("申请已提交，我们将尽快与您联系");
      this.showApplicationForm = false;
      
      // 重置表单
      this.applicationData = {
        companyName: "",
        contactPerson: "",
        contactPhone: "",
        serviceType: "",
        remarks: "",
      };
    },
    
    // 下载服务协议
    downloadAgreement() {
      this.$message.info("正在下载企业银行服务协议...");
    },
    
    // 下载操作手册
    downloadManual() {
      this.$message.info("正在下载操作手册...");
    },
  },
};
</script>

<style lang="scss" scoped>
.corporate-bank-page {
  min-height: 100vh;
  background-color: #f8f9fa;
  
  .navigation-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background-color: #ffffff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .main-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    
    .page-header {
      text-align: center;
      margin-bottom: 40px;
      padding: 30px 0;
      
      h1 {
        font-size: 32px;
        font-weight: 600;
        color: #333;
        margin-bottom: 10px;
      }
      
      p {
        font-size: 18px;
        color: #666;
      }
    }
    
    .service-modules {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 30px;
      margin-bottom: 50px;
      
      .module-card {
        background: #ffffff;
        border-radius: 12px;
        padding: 30px 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        
        &:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        }
        
        .module-icon {
          font-size: 40px;
          margin-bottom: 20px;
          color: #409eff;
        }
        
        h3 {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 15px;
          color: #333;
        }
        
        p {
          font-size: 14px;
          color: #666;
          line-height: 1.6;
        }
      }
    }
    
    .case-section {
      margin-bottom: 50px;
      
      h2 {
        font-size: 24px;
        font-weight: 600;
        text-align: center;
        margin-bottom: 30px;
        color: #333;
      }
      
      .case-list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 30px;
        
        .case-item {
          background: #ffffff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          
          &:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          }
          
          .case-image {
            height: 180px;
            overflow: hidden;
            
            img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              transition: transform 0.3s ease;
            }
          }
          
          .case-info {
            padding: 20px;
            
            h4 {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #333;
            }
            
            p {
              font-size: 14px;
              color: #666;
              line-height: 1.6;
            }
          }
        }
      }
    }
    
    .quick-application {
      text-align: center;
      padding: 50px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      margin-bottom: 50px;
      
      h2 {
        font-size: 28px;
        color: #ffffff;
        margin-bottom: 20px;
      }
      
      ::v-deep .hzb-ui-button {
        background: #ffffff;
        color: #667eea;
        border: none;
        font-size: 16px;
        padding: 12px 30px;
        border-radius: 30px;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }
      }
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 30px;
      padding: 20px 0;
      
      a {
        color: #666;
        text-decoration: none;
        font-size: 14px;
        transition: color 0.3s ease;
        
        &:hover {
          color: #409eff;
          text-decoration: underline;
        }
      }
    }
  }
  
  .application-form {
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 15px;
      margin-top: 20px;
    }
  }
}
</style>