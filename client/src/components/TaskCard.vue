<template>
  <div class="task-card">
    <div class="card-header">
      <h3>{{ title }}</h3>
      <span class="status" :class="statusClass">{{ statusText }}</span>
    </div>
    <div class="card-body">
      <p class="description">{{ description }}</p>
      <div class="meta">
        <span class="priority">优先级: {{ priority }}</span>
        <span class="assignee">负责人: {{ assignee }}</span>
      </div>
    </div>
    <div class="card-footer">
      <span class="due-date">截止日期: {{ dueDate }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TaskCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      required: true,
    },
    assignee: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
  },
  computed: {
    statusText() {
      const statusMap = {
        'todo': '待办',
        'in-progress': '进行中',
        'done': '已完成',
      };
      return statusMap[this.status] || this.status;
    },
    statusClass() {
      return `status-${this.status}`;
    },
  },
};
</script>

<style scoped>
.task-card {
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
  transition: box-shadow 0.3s;
}

.task-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-todo {
  background-color: #e0e0e0;
  color: #666;
}

.status.in-progress {
  background-color: #fff3cd;
  color: #856404;
}

.status-done {
  background-color: #d4edda;
  color: #155724;
}

.card-body {
  margin-bottom: 16px;
}

.description {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px 0;
}

.meta {
  display: flex;
  justify-content: space-between;
}

.meta span {
  font-size: 12px;
  color: #999;
}

.card-footer {
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.due-date {
  font-size: 12px;
  color: #999;
}
</style>