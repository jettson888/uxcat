<template>
  <div class="task-list-container">
    <div class="header">
      <el-button type="primary" @click="createTask">创建新任务</el-button>
    </div>
    <div class="main-content">
      <div class="filter-section">
        <el-input
          v-model="searchKeyword"
          placeholder="请输入关键字搜索"
          clearable
          @clear="handleSearch"
          @keyup.enter.native="handleSearch"
        />
        <el-select v-model="statusFilter" placeholder="状态" clearable @change="handleFilterChange">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="priorityFilter" placeholder="优先级" clearable @change="handleFilterChange">
          <el-option
            v-for="item in priorityOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select v-model="assigneeFilter" placeholder="负责人" clearable @change="handleFilterChange">
          <el-option
            v-for="item in assigneeOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
      <div class="table-section">
        <el-table :data="paginatedTasks" style="width: 100%" @sort-change="handleSortChange">
          <el-table-column prop="title" label="任务标题" sortable="custom" />
          <el-table-column prop="status" label="状态" sortable="custom">
            <template slot-scope="scope">
              <el-tag :type="getStatusTagType(scope.row.status)">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" sortable="custom">
            <template slot-scope="scope">
              <el-tag :type="getPriorityTagType(scope.row.priority)">{{ scope.row.priority }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="assignee" label="负责人" sortable="custom" />
          <el-table-column prop="dueDate" label="截止日期" sortable="custom" />
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" @click="viewTaskDetail(scope.row)">查看详情</el-button>
              <el-button size="mini" @click="editTask(scope.row)">编辑</el-button>
              <el-button size="mini" @click="assignTask(scope.row)">分配</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[10, 20, 50]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="filteredTasks.length"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js";

export default {
  mixins: [screenshotMixin],
  data() {
    return {
      searchKeyword: '',
      statusFilter: '',
      priorityFilter: '',
      assigneeFilter: '',
      statusOptions: [
        { value: '未开始', label: '未开始' },
        { value: '进行中', label: '进行中' },
        { value: '已完成', label: '已完成' },
        { value: '已延期', label: '已延期' },
      ],
      priorityOptions: [
        { value: '低', label: '低' },
        { value: '中', label: '中' },
        { value: '高', label: '高' },
        { value: '紧急', label: '紧急' },
      ],
      assigneeOptions: [
        { value: '张三', label: '张三' },
        { value: '李四', label: '李四' },
        { value: '王五', label: '王五' },
        { value: '赵六', label: '赵六' },
      ],
      allTasks: [
        // Mock data for tasks
        { id: 1, title: '设计登录页面', status: '进行中', priority: '高', assignee: '张三', dueDate: '2023-10-15' },
        { id: 2, title: '开发用户管理模块', status: '未开始', priority: '中', assignee: '李四', dueDate: '2023-10-20' },
        { id: 3, title: '测试支付功能', status: '已完成', priority: '紧急', assignee: '王五', dueDate: '2023-10-10' },
        { id: 4, title: '优化首页加载速度', status: '已延期', priority: '低', assignee: '赵六', dueDate: '2023-10-05' },
        { id: 5, title: '编写API文档', status: '进行中', priority: '中', assignee: '张三', dueDate: '2023-10-18' },
        { id: 6, title: '修复已知bug', status: '未开始', priority: '高', assignee: '李四', dueDate: '2023-10-25' },
        { id: 7, title: '部署生产环境', status: '已完成', priority: '紧急', assignee: '王五', dueDate: '2023-10-12' },
        { id: 8, title: '准备产品演示', status: '进行中', priority: '中', assignee: '赵六', dueDate: '2023-10-22' },
        { id: 9, title: '收集用户反馈', status: '未开始', priority: '低', assignee: '张三', dueDate: '2023-10-30' },
        { id: 10, title: '制定下季度计划', status: '已延期', priority: '中', assignee: '李四', dueDate: '2023-10-08' },
      ],
      currentPage: 1,
      pageSize: 10,
      sortField: '',
      sortOrder: '',
    };
  },
  computed: {
    filteredTasks() {
      let result = this.allTasks;
      if (this.searchKeyword) {
        result = result.filter(task => task.title.includes(this.searchKeyword));
      }
      if (this.statusFilter) {
        result = result.filter(task => task.status === this.statusFilter);
      }
      if (this.priorityFilter) {
        result = result.filter(task => task.priority === this.priorityFilter);
      }
      if (this.assigneeFilter) {
        result = result.filter(task => task.assignee === this.assigneeFilter);
      }
      if (this.sortField && this.sortOrder) {
        result = result.sort((a, b) => {
          const order = this.sortOrder === 'ascending' ? 1 : -1;
          return a[this.sortField] > b[this.sortField] ? order : -order;
        });
      }
      return result;
    },
    paginatedTasks() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.filteredTasks.slice(start, start + this.pageSize);
    },
  },
  methods: {
    handleSearch() {
      this.currentPage = 1;
    },
    handleFilterChange() {
      this.currentPage = 1;
    },
    handleSortChange({ column, prop, order }) {
      this.sortField = prop;
      this.sortOrder = order;
    },
    handleSizeChange(newSize) {
      this.pageSize = newSize;
      this.currentPage = 1;
    },
    handleCurrentChange(newPage) {
      this.currentPage = newPage;
    },
    getStatusTagType(status) {
      switch (status) {
        case '未开始': return 'info';
        case '进行中': return 'primary';
        case '已完成': return 'success';
        case '已延期': return 'danger';
        default: return 'info';
      }
    },
    getPriorityTagType(priority) {
      switch (priority) {
        case '低': return 'info';
        case '中': return 'warning';
        case '高': return 'danger';
        case '紧急': return 'danger';
        default: return 'info';
      }
    },
    viewTaskDetail(row) {
      this.$router.push('/taskDetail');
    },
    editTask(row) {
      // 编辑任务逻辑
    },
    assignTask(row) {
      this.$router.push('/taskAssign');
    },
    createTask() {
      // 创建新任务逻辑
    },
  },
};
</script>

<style scoped lang="scss">
.task-list-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;

  .header {
    margin-bottom: 20px;
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;

    .filter-section {
      width: 250px;
      padding-right: 20px;
      border-right: 1px solid #ebeef5;
      display: flex;
      flex-direction: column;
      gap: 15px;

      ::v-deep .el-input,
      ::v-deep .el-select {
        width: 100%;
      }
    }

    .table-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;

      .el-table {
        flex: 1;
        overflow-y: auto;
      }

      .pagination {
        margin-top: 20px;
        text-align: right;
      }
    }
  }
}
</style>