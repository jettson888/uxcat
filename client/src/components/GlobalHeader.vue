<template>
  <header class="global-header">
    <div class="header-content">
      <h1 class="logo">系统名称</h1>
      <nav class="navigation">
        <ul>
          <li><a href="#home">首页</a></li>
          <li><a href="#tasks">任务</a></li>
          <li><a href="#team">团队</a></li>
          <li><a href="#settings">设置</a></li>
        </ul>
      </nav>
      <div class="user-info">
        <span>用户名</span>
        <i class="iconfont hzb-icon-user" />
      </div>
    </div>
  </header>
</template>

<script>
export default {
  name: 'GlobalHeader',
};
</script>

<style scoped>
.global-header {
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-content {
  width: 100%;
  max-width: 1200px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.navigation ul {
  display: flex;
  list-style: none;
}

.navigation li {
  margin: 0 16px;
}

.navigation a {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  transition: color 0.3s;
}

.navigation a:hover {
  color: #000;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.user-info span {
  margin-right: 8px;
  color: #333;
}

.user-info i {
  font-size: 20px;
  color: #666;
}
</style>