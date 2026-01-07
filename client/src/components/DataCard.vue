<template>
  <div class="data-card">
    <div class="card-icon">
      <i class="iconfont" :class="iconClass" />
    </div>
    <div class="card-content">
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-value">{{ value }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DataCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
    iconClass: {
      type: String,
      required: true,
    },
  },
};
</script>

<style scoped>
.data-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
  display: flex;
  align-items: center;
  transition: box-shadow 0.3s;
}

.data-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-icon {
  width: 48px;
  height: 48px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}

.card-icon i {
  font-size: 24px;
  color: #666;
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 14px;
  color: #999;
  margin: 0 0 4px 0;
  font-weight: 500;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}
</style>