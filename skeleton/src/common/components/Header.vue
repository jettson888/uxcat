<template>
  <div class="header-container">
    <div class="header-left">
      <div class="logo">
        <img src="/src/assets/images/project@2x.png" alt="" class="logo-img" />
      </div>
      <div class="breadcrumb">
        <span class="breadcrumb-all" @click="goToHome">全部项目</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-current">{{ displayProjectName }}</span>
      </div>
    </div>
    <div class="header-center" v-if="isShowHeaderCenter">
      <ul class="header-center-tab">
        <li
          :class="{ select: activeTab === 'flowchart' }"
          @click="switchTab('flowchart')"
        >
          流程图
        </li>
        <li
          :class="{ select: activeTab === 'product' }"
          @click="switchTab('product')"
        >
          产品页面
        </li>
        <!-- <li :class="{ select: activeTab === 'code' }" @click="switchTab('code')">
        项目代码
      </li> -->
      </ul>
    </div>
    <div class="header-right">
      <div
        class="header-right-inner"
        v-show="isShowHeaderRight && !isPreviewPage"
      >
        <span class="custom-button preview" @click="switchTab('preview')">
          <img
            src="/src/assets/images/product/header-preview.svg"
            alt=""
            class="header-icon"
          />
          预览
        </span>
        <!-- <span class="custom-button share" @click="handleShare">
          <img
            src="/src/assets/images/product/header-share.svg"
            alt=""
            class="header-icon"
          />
          分享
        </span> -->
        <el-dropdown class="custom-button export" @command="handleExport">
          <span class="el-dropdown-link">
            <img
              src="/src/assets/images/product/header-export.svg"
              alt=""
              class="header-icon"
            />
            导出
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="html">Html演示包</el-dropdown-item>
              <el-dropdown-item command="web">Web(Vue.js)</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      <div
        class="header-right-inner"
        v-show="isShowHeaderRight && isPreviewPage"
      >
        <span class="custom-button back" @click="switchTab('product')">
          <img
            src="/src/assets/images/product/header-back.png"
            alt=""
            class="header-icon"
          />
          返回
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import request from "@/common/request";
import createApiEndpoints from "@/common/api.js";

const props = defineProps({
  projectName: {
    type: String,
    default: "",
  },
});

const route = useRoute();
const router = useRouter();
let api;

// 计算属性
const displayProjectName = computed(() => {
  // 优先使用路由查询参数中的projectName，如果没有则使用props传入的值
  return props.projectName || route.query.projectName || "";
});

const isPreviewPage = computed(() => {
  // 判断是否是预览页
  return route.name === "preview";
});

const activeTab = computed(() => {
  // 根据当前路由自动计算激活的tab
  return route.name || "flowchart";
});

const isShowHeaderCenter = computed(() => {
  // 预览页不显示header-center
  return !isPreviewPage.value;
});

const isShowHeaderRight = computed(() => {
  // 流程图页面不显示header-right，预览页显示返回按钮
  return route.name !== "flowchart";
});

// 生命周期钩子
onMounted(async () => {
  api = await createApiEndpoints();
});

// 方法
const goToHome = () => {
  router.push("/");
};

const switchTab = (tabName) => {
  // 路由跳转，携带当前路由的所有查询参数
  const query = route.query || {};
  router.push({
    name: tabName,
    query: query,
  });
};

const handleShare = () => {
  // 分享逻辑
  console.log("分享按钮被点击");
  ElMessage.info("分享功能待实现");
};

const handleExport = (command) => {
  // 导出逻辑 - 调用同一个接口，传入不同参数
  console.log("导出按钮被点击，导出类型:", command);

  // 获取当前项目ID
  const projectId = route.query.projectId || "";

  if (!projectId) {
    ElMessage.error("项目ID不存在，无法导出");
    return;
  }

  // 调用导出接口
  request({
    url: api.export,
    method: "post",
    data: {
      projectId: projectId,
      type: command, // 'html' 或 'web'
    },
    responseType: "blob", // 用于下载文件
  })
    .then((response) => {
      // 创建下载链接
      const blob = new Blob([response], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download =
        command === "html"
          ? "html-demo-package.zip"
          : "vue-project-package.zip";
      link.click();
      window.URL.revokeObjectURL(url);

      ElMessage.success(
        command === "html" ? "Html演示包导出成功" : "Web(Vue.js)包导出成功"
      );
    })
    .catch((error) => {
      console.error("导出失败:", error);
      ElMessage.error("导出失败，请稍后重试");
    });
};
</script>

<style lang="scss" scoped>
.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 56px;
  padding: 0 20px;
  background-color: #fff;
  box-shadow: inset 0px -1px 0px 0px rgba(239, 239, 239, 1);
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 200px;
  font-size: 14px;

  .logo {
    display: flex;
    align-items: center;

    .logo-img {
      width: 28px;
      height: 28px;
    }

    .logo-text {
      color: #666;
      font-size: 16px;
      font-weight: 500;
      margin-left: 8px;
      vertical-align: middle;
    }
  }

  .breadcrumb {
    margin-left: 10px;
    font-size: 14px;
    color: #666;

    .breadcrumb-all {
      cursor: pointer;

      &:hover {
        color: #358aff;
      }
    }

    .breadcrumb-separator {
      margin: 0 8px;
    }

    .breadcrumb-current {
      color: #1f1f1f;
      font-weight: 700;
    }
  }
}

.header-center {
  display: flex;
  justify-content: center;
  flex: 1;
}

.header-center-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px;
  line-height: 30px;
  border: 1px solid rgba(230, 230, 230, 1);
  border-radius: 8px;
  li {
    width: 96px;
    line-height: 32px;
    margin-left: 3px;
    text-align: center;
    color: #666;
    cursor: pointer;

    &:first-child {
      margin-left: 0;
    }

    &.select,
    &:hover {
      background: #358aff;
      color: #fff;
      border-radius: 4px;
      font-family: PingFangSC-Semibold;
      font-weight: 600;
    }
  }
}

.header-right {
  min-width: 250px;
}

.header-right-inner {
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .custom-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    background-color: #ffffff;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    color: #4e4e4e;
    cursor: pointer;
    transition: all 0.2s ease;
    user-select: none;
    box-sizing: border-box;
    margin-left: 8px;

    &:hover {
      background-color: #f5f7fa;
      border-color: #c0c4cc;
      color: #4e4e4e;
    }

    &:active {
      background-color: #ebeef5;
      border-color: #c0c4cc;
    }

    &.preview {
      &:hover {
        background-color: #f5f7fa;
        border-color: #c0c4cc;
        color: #4e4e4e;
      }

      &:active {
        background-color: #ebeef5;
        border-color: #c0c4cc;
      }
    }

    &.share {
      &:hover {
        background-color: #f5f7fa;
        border-color: #c0c4cc;
        color: #4e4e4e;
      }

      &:active {
        background-color: #ebeef5;
        border-color: #c0c4cc;
      }
    }

    &.export,
    &.back {
      background-color: #409eff;
      border-color: #409eff;
      color: #ffffff;

      &:hover {
        background-color: #66b1ff;
        border-color: #66b1ff;
        color: #ffffff;
      }

      &:active {
        background-color: #3a8ee6;
        border-color: #3a8ee6;
        color: #ffffff;
      }
    }

    .header-icon {
      width: 16px;
      height: 16px;
      margin-right: 4px;
      vertical-align: middle;
    }
  }
}
</style>
