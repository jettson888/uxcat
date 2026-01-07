<template>
  <div class="home-page">
    <!-- 顶部导航 -->
    <div class="header">
      <el-menu mode="horizontal" router>
        <el-menu-item index="/taskCreate">创建任务</el-menu-item>
        <el-menu-item index="/taskList">任务列表</el-menu-item>
        <el-menu-item index="/taskReport">任务报告</el-menu-item>
      </el-menu>
    </div>

    <!-- 页面主体内容 -->
    <div class="main-content">
      <!-- 左侧栏：用户信息和快速操作 -->
      <div class="left-sidebar">
        <div class="user-info">
          <h2>用户信息</h2>
          <p>用户名：张三</p>
          <p>角色：项目经理</p>
        </div>
        <div class="quick-actions">
          <h2>快速操作</h2>
          <el-button type="primary" @click="$router.push('/taskCreate')">创建任务</el-button>
          <el-button @click="$router.push('/taskList')">查看我的任务</el-button>
          <el-button @click="$router.push('/taskList')">查看团队任务</el-button>
        </div>
      </div>

      <!-- 中间栏：任务统计概览 -->
      <div class="center-content">
        <div class="task-overview">
          <el-card class="overview-card">
            <div slot="header">今日待办任务</div>
            <p>5</p>
          </el-card>
          <el-card class="overview-card">
            <div slot="header">本周完成任务</div>
            <p>12</p>
          </el-card>
          <el-card class="overview-card">
            <div slot="header">逾期任务</div>
            <p>2</p>
          </el-card>
        </div>
      </div>

      <!-- 右侧栏：通知公告 -->
      <div class="right-sidebar">
        <div class="notifications">
          <h2>通知公告</h2>
          <ul>
            <li>系统维护通知</li>
            <li>新功能上线提醒</li>
            <li>团队协作指南更新</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 底部系统信息 -->
    <div class="footer">
      <p>© 2023 任务管理系统</p>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js";

export default {
  name: "HomePage",
  mixins: [screenshotMixin],
  data() {
    return {};
  },
  methods: {},
};
</script>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  flex-shrink: 0;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.left-sidebar,
.center-content,
.right-sidebar {
  padding: 20px;
  overflow-y: auto;
}

.left-sidebar {
  width: 250px;
  background-color: #f5f5f5;
}

.center-content {
  flex: 1;
  background-color: #ffffff;
}

.right-sidebar {
  width: 250px;
  background-color: #f5f5f5;
}

.task-overview {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 100%;
}

.overview-card {
  width: 200px;
  text-align: center;
}

.footer {
  flex-shrink: 0;
  text-align: center;
  padding: 10px;
  background-color: #f5f5f5;
}
</style>