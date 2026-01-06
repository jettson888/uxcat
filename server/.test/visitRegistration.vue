<template>
 <div class="visit-registration">
    <div class="header">
      <h2 style="color:#fff;font-weight:bold">到访登记</h2>
      <p>请填写以下信息完成到访登记</p>
    </div>
    <el-form :model="form" label-width="120px" class="registration-form" style="color:#fff;font-weight:bold">
      <el-form-item label="访客姓名">
        <el-input v-model="form.visitorName" placeholder="请输入访客姓名"/>
      </el-form-item>
      <el-form-item label="联系方式">
        <el-input v-model="form.contact" placeholder="请输入联系方式"/>
      </el-form-item>
      <el-form-item label="到访时间">
        <el-date-picker v-model="form.visitTime" type="datetime" placeholder="选择到访时间" format="yyyy-MM-dd HH:mm:ss" value-format="yyyy-MM-dd HH:mm:ss"/>    
      </el-form-item>
      <el-form-item label="接待人员">
        <el-select v-model="form.receptionist" placeholder="请选择接待人员">
          <el-option v-for="receptionist in receptionists" :key="receptionist.id" :label="receptionist.name" :value="receptionist.id"/>
        </el-select>
      </el-form-item>
      <el-form-item label="访问事由">
        <el-input type="textarea" v-model="form.reason" placeholder="请输入访问事由" :rows="4"/>
      </el-form-item>
      <el-form-item style="color:#fff;font-weight:bold">
        <el-button type="primary" @click="submitForm">提交</el-button>
        <el-button @click="resetForm">取消</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import screenshotMixin from "@/common/mixin.js"

export default {
  mixins: [screenshotMixin],
  data() {
    return {
      form: {
        visitorName: '',
        contact: '',
        visitTime: '',
        receptionist: '',
        reason: '',
      },
      receptionists: [
        { id: '1', name: '张三' },
        { id: '2', name: '李四' },
        { id: '3', name: '王五' },
      ],
    }
  },
  methods: {
    submitForm() {
      this.$message.success('到访信息登记成功')
      this.resetForm()
    },
    resetForm() {
      this.form = {
        visitorName: '',
        contact: '',
        visitTime: '',
        receptionist: '',
        reason: '',
      }
    },
  },
}
</script>

<style scoped lang="scss">
.visit-registration {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  .header {
    text-align: center;
    margin-bottom: 30px;
    h2 {
      font-size: 24px;
      margin-bottom: 10px;
    }
    p {
      color: #666;
    }
  }
  .registration-form {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  }
  .el-form-item {
    margin-bottom: 20px;
  }
  .el-button {
    margin-right: 10px;
  }
}
</style>