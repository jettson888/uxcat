<template>
  <div class="home-page">
    <!-- 顶部导航栏 -->
    <el-menu mode="horizontal" class="top-navigation">
      <el-menu-item
        v-for="nav in navigation"
        :key="nav.navigationId"
        @click="handleNavigation(nav.targetPageId)"
      >
        {{ nav.name }}
      </el-menu-item>
    </el-menu>

    <!-- 页面主体内容 -->
    <div class="main-content">
      <!-- 左侧栏：用户信息和快捷操作 -->
      <div class="left-sidebar">
        <div class="user-info">
          <img src="/src/assets/images/backgroundImages/hzb-background-001.webp" alt="用户头像" class="avatar" />
          <h3>张三</h3>
          <p>产品经理</p>
        </div>
        <div class="quick-actions">
          <el-button type="primary" icon="el-icon-plus" @click="handleNavigation('taskCreate')">创建任务</el-button>
          <el-button @click="handleNavigation('taskList')">查看我的任务</el-button>
          <el-button @click="handleNavigation('taskList')">查看团队任务</el-button>
        </div>
      </div>

      <!-- 中间栏：任务统计概览 -->
      <div class="center-content">
        <div class="stats-cards">
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <i class="iconfont hzb-icon-document-checked" />
              <div>
                <h4>今日待办任务</h4>
                <p>{{ stats.todayTasks }}</p>
              </div>
            </div>
          </el-card>
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <i class="iconfont hzb-icon-document" />
              <div>
                <h4>本周完成任务</h4>
                <p>{{ stats.completedTasks }}</p>
              </div>
            </div>
          </el-card>
          <el-card class="stat-card" shadow="hover">
            <div class="stat-item">
              <i class="iconfont hzb-icon-warning" />
              <div>
                <h4>逾期任务数</h4>
                <p>{{ stats.overdueTasks }}</p>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 右侧栏：通知公告 -->
      <div class="right-sidebar">
        <el-card class="notification-card" header="系统公告">
          <ul>
            <li v-for="(notice, index) in notices" :key="index">{{ notice.title }}</li>
          </ul>
        </el-card>
        <el-card class="notification-card" header="团队动态">
          <ul>
            <li v-for="(activity, index) in activities" :key="index">{{ activity.title }}</li>
          </ul>
        </el-card>
      </div>
    </div>

    <!-- 底部系统信息 -->
    <footer class="footer">
      <p>© 2023 系统名称 版权所有</p>
    </footer>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js";

export default {
  name: "HomePage",
  mixins: [screenshotMixin],
  data() {
    return {
      navigation: [
        {
          name: "创建任务",
          navigationId: "goTaskCreate",
          navigationType: "页面导航",
          targetPageId: "taskCreate",
          trigger: "",
        },
        {
          name: "任务列表",
          navigationId: "goTaskList",
          navigationType: "页面导航",
          targetPageId: "taskList",
          trigger: "",
        },
        {
          name: "任务报告",
          navigationId: "goTaskReport",
          navigationType: "页面导航",
          targetPageId: "taskReport",
          trigger: "",
        },
      ],
      stats: {
        todayTasks: 5,
        completedTasks: 12,
        overdueTasks: 2,
      },
      notices: [
        { title: "系统维护通知" },
        { title: "新功能上线提醒" },
      ],
      activities: [
        { title: "李四完成了任务A" },
        { title: "王五提交了任务B" },
      ],
    };
  },
  methods: {
    handleNavigation(targetPageId) {
      this.$router.push(targetPageId);
    },
  },
};
</script>

<style lang="scss" scoped>
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;

  .top-navigation {
    flex-shrink: 0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .left-sidebar {
      width: 240px;
      padding: 20px;
      background-color: #f9f9f9;
      border-right: 1px solid #eaeaea;
      display: flex;
      flex-direction: column;
      align-items: center;

      .user-info {
        text-align: center;
        margin-bottom: 30px;

        .avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          object-fit: cover;
          margin-bottom: 10px;
        }

        h3 {
          margin: 10px 0 5px;
          font-weight: 500;
        }

        p {
          color: #999;
        }
      }

      .quick-actions {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .el-button {
          width: 100%;
          transition: all 0.3s ease;

          &:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
        }
      }
    }

    .center-content {
      flex: 1;
      padding: 20px;
      overflow-y: auto;

      .stats-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 20px;

        .stat-card {
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          }

          .stat-item {
            display: flex;
            align-items: center;

            i {
              font-size: 36px;
              margin-right: 15px;
              color: #409eff;
            }

            div {
              h4 {
                margin: 0 0 5px;
                font-weight: 500;
              }

              p {
                margin: 0;
                font-size: 24px;
                font-weight: bold;
              }
            }
          }
        }
      }
    }

    .right-sidebar {
      width: 300px;
      padding: 20px;
      background-color: #f9f9f9;
      border-left: 1px solid #eaeaea;
      overflow-y: auto;

      .notification-card {
        margin-bottom: 20px;
        animation: fadeIn 0.5s ease-in-out;

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
            transition: background-color 0.3s;

            &:hover {
              background-color: #f0f0f0;
            }

            &:last-child {
              border-bottom: none;
            }
          }
        }
      }
    }
  }

  .footer {
    flex-shrink: 0;
    text-align: center;
    padding: 15px;
    background-color: #f5f5f5;
    border-top: 1px solid #eaeaea;
    color: #999;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
}
</style>