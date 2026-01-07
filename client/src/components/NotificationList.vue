<template>
  <div class="notification-list">
    <h3 class="list-title">{{ title }}</h3>
    <ul class="notifications">
      <li 
        v-for="(notification, index) in notifications" 
        :key="index" 
        class="notification-item"
        :class="{ 'unread': notification.unread }"
      >
        <div class="notification-icon">
          <i class="iconfont hzb-icon-notification" />
        </div>
        <div class="notification-content">
          <p class="notification-text">{{ notification.text }}</p>
          <span class="notification-time">{{ notification.time }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'NotificationList',
  props: {
    title: {
      type: String,
      required: true,
    },
    notifications: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
.notification-list {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
}

.list-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 16px 0;
}

.notifications {
  list-style: none;
  padding: 0;
  margin: 0;
}

.notification-item {
  display: flex;
  padding: 12px 0;
  border-bottom: 1px solid #eee;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item.unread .notification-text {
  font-weight: 500;
  color: #333;
}

.notification-icon {
  margin-right: 12px;
}

.notification-icon i {
  font-size: 20px;
  color: #666;
}

.notification-content {
  flex: 1;
}

.notification-text {
  font-size: 14px;
  color: #666;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #999;
}
</style>