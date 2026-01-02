<template>
  <div class="home">
    <div class="title">
      <div class="imageText"></div>
      <p class="text">
        只需输入你的需求，AI为你高效生产网站与App的视觉设计、交互原型及前端代码。
      </p>
      <el-input
        type="textarea"
        placeholder="无论你输入的是简单的创意，还是详尽复杂的项目需求，都能为你一次性生成完整的项目设计和前端代码"
        v-model="textarea"
      >
      </el-input>
      <div class="type">
        <el-select
          v-model="model"
          size="small"
          style="width: 7.5rem; margin-right: 0.4rem"
        >
          <el-option
            v-for="item in modelList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
        <el-select
          v-model="target"
          size="small"
          style="width: 7.1rem; margin-right: 0.4rem"
          @change="handleTargetChange"
        >
          <el-option label="Web网站" value="web"> </el-option>
          <el-option label="手机App" value="phone"> </el-option>
          <el-option label="平板端" value="平板端"> </el-option>
          <el-option label="桌面端" value="桌面端"> </el-option>
        </el-select>
        <el-select v-model="resolution" size="small" style="width: 7.5rem">
          <el-option
            v-for="item in resolutionList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          >
          </el-option>
        </el-select>
      </div>
      <span class="searchButton" @click="onSubmit">
        <el-icon><Top /></el-icon>
      </span>
    </div>
    <div class="project">
      <div class="projectT">
        <p class="pTitle">我的项目</p>
        <div class="filter">
          <el-input
            placeholder="请输入内容"
            v-model="input"
            clearable
            style="width: 22.5rem; margin-right: 0.3125rem"
            @input="handleSearchInput"
          >
            <template #suffix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-select
            v-model="sort"
            placeholder="请选择"
            style="width: 13.75rem"
            @change="getProjectList"
          >
            <el-option label="项目时间" value="createTime"> </el-option>
            <el-option label="项目名称" value="projectName"> </el-option>
          </el-select>
        </div>
      </div>
      <div class="main">
        <div class="projectContent">
          <div v-if="projectList.length" class="projectItem">
            <div
              v-for="(item, index) in projectList"
              :key="index"
              class="projectCard"
              @click="
                goToFlowchart(
                  item.projectId,
                  item.projectName,
                  item.projectPrompt
                )
              "
            >
              <div class="projectCardimg">
                <!-- 项目预览图 -->
                <img
                  v-if="item.imgUrl"
                  :src="item.imgUrl"
                  class="preview-image"
                />
                <div v-else class="preview-no-image">
                  <img src="@/assets/images/home/AI图标.png" />
                </div>
              </div>
              <div class="projectInfo">
                <div class="projectHeader">
                  <img
                    v-if="item.target === 'web'"
                    src="@/assets/images/home/PC.png"
                    alt="PC"
                    class="projectTypeIcon"
                  />
                  <img
                    v-else-if="item.target === 'phone'"
                    src="@/assets/images/home/App.png"
                    alt="App"
                    class="projectTypeIcon"
                  />
                  <h3 class="projectName">
                    {{ item.projectName || "未命名项目" }}
                  </h3>
                  <!-- 三点菜单按钮 -->
                  <el-dropdown
                    @command="(command) => handleMenuCommand(item, command)"
                  >
                    <div class="menu-trigger" @click.stop>
                      <img
                        src="@/assets/images/home/more.svg"
                        alt="更多操作"
                        class="more-icon"
                      />
                    </div>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="rename"
                          >重命名</el-dropdown-item
                        >
                        <el-dropdown-item command="duplicate"
                          >创建副本</el-dropdown-item
                        >
                        <el-dropdown-item command="delete"
                          >删除</el-dropdown-item
                        >
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <div class="projectMeta">
                  <span class="createTime">{{
                    formatTime(item.createAt)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="noneImage" v-else>
            <div class="image-container">
              <div class="no-data-image"></div>
              <span class="no-data-text"> 当前暂无项目 </span>
            </div>
          </div>
        </div>

        <div class="paginationContainer">
          <el-pagination
            v-if="total > 0"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page="currentPage"
            :page-sizes="[12, 24, 36, 48]"
            :page-size="pageSize"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
          >
          </el-pagination>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox, ElInput } from "element-plus";
import { extractJSONFromContent } from "../../codeParser";
import request from "@/common/request.js";
import createApiEndpoints from "@/common/api.js";
import { modelList } from "@/common/modelConfig.js";
import { useAppStore } from "@/stores/app";

function host() {
  const { hostname, protocol } = window.location;
  const port = window.location.port ? `:${window.location.port}` : "";
  return `${protocol}//${hostname}${port}`;
}

const route = useRoute();
const router = useRouter();
const appStore = useAppStore();
let api;

// 响应式数据
const textarea = ref("");
const sort = ref("createTime");
const input = ref("");
const projectList = ref([]);
const target = ref("web");
const resolution = ref("1920*1080");
const currentPage = ref(1);
const pageSize = ref(12);
const total = ref(0);
const searchTimer = ref(null);
const model = ref("qwen-coder");

const resolutionLists = ref({
  web: [
    { label: "1920x1080", value: "1920*1080" },
    { label: "2560x1440", value: "2560*1440" },
    { label: "3840x2160", value: "3840*2160" },
  ],
  phone: [
    { label: "412x917", value: "412*917" },
    { label: "700x840", value: "700*840" },
    { label: "402x874", value: "402*874" },
    { label: "440x956", value: "440*956" },
    { label: "430x932", value: "430*932" },
    { label: "393x852", value: "393*852" },
    { label: "390x844", value: "390*844" },
    { label: "428x926", value: "428*926" },
    { label: "375x812", value: "375*812" },
    { label: "320x568", value: "320*568" },
  ],
  平板端: [
    { label: "1280x800", value: "1280*800" },
    { label: "1440x960", value: "1440*960" },
    { label: "744x1133", value: "744*1133" },
    { label: "834x1194", value: "834*1194" },
    { label: "1024x1366", value: "1024*1366" },
  ],
  桌面端: [
    { label: "1280x832", value: "1280*832" },
    { label: "1512x982", value: "1512*982" },
    { label: "1728x1117", value: "1728*1117" },
    { label: "1440x1024", value: "1440*1024" },
  ],
});

// 计算属性
const resolutionList = computed(() => {
  return resolutionLists.value[target.value] || resolutionLists.value.web;
});

// 监听model变化
watch(model, (newVal) => {
  // 当model改变时，保存到localStorage
  localStorage.setItem("workflowModel", newVal);
});

// 生命周期钩子
onMounted(async () => {
  window.electronAPI?.sendMessage("initial-uxbot", { type: "server" });
  api = await createApiEndpoints();
  getProjectList();

  // 从localStorage获取保存的model值
  const workflowModel = localStorage.getItem("workflowModel");
  if (workflowModel) {
    // 验证保存的model是否在modelList中
    const isValidModel = modelList.some((item) => item.value === workflowModel);
    if (isValidModel) {
      model.value = workflowModel;
    }
  }
});

// 方法
const onSubmit = () => {
  generateCode();
};

const generateCode = async () => {
  let code = Date.now();

  // 保存textarea内容到localStorage
  localStorage.setItem("aiPromptTextarea", textarea.value);

  try {
    const response = request({
      url: api.chatCompletions,
      method: "POST",
      data: {
        prompt: textarea.value,
        target: target.value,
        resolution: resolution.value,
        projectId: code + "",
        model: model.value,
      },
    });

    router.push({
      path: "flowchart",
      query: {
        projectId: code,
        target: target.value,
        resolution: resolution.value,
      },
    });
  } catch (error) {
    console.error("Error:", error);
  }
};

// 防抖搜索函数
const handleSearchInput = (val) => {
  // 清除之前的定时器
  if (searchTimer.value) {
    clearTimeout(searchTimer.value);
  }
  // 设置新的定时器
  searchTimer.value = setTimeout(() => {
    searchProjects(input.value);
  }, 1000); // 1000ms防抖延迟
};

// 搜索项目方法
const searchProjects = (keyword) => {
  // 这里调用搜索项目的API
  // 可以重置分页到第一页
  currentPage.value = 1;
  getProjectList(input.value);
};

const handleSizeChange = (val) => {
  pageSize.value = val;
  currentPage.value = 1;
  // 这里可以调用获取项目列表的方法
  getProjectList();
};

const handleCurrentChange = (val) => {
  currentPage.value = val;
  // 这里可以调用获取项目列表的方法
  getProjectList();
};

// 时间格式化方法
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

const getProjectList = async (keyword = "") => {
  // 获取项目列表的逻辑
  // 这里应该调用API获取数据，并更新projectList和total
  // keyword参数用于搜索关键词
  console.log(keyword);
  try {
    let result = await request({
      url: api.getProjects,
      method: "post",
      data: {
        keyword: input.value,
        sort: sort.value,
        page: currentPage.value,
        pageSize: pageSize.value,
      },
    });
    console.log("搜索关键词:", keyword);
    console.log("项目数据:", result.data);
    let arr = result.data.list.map((item) => {
      let obj = {
        ...item,
        createAt: item.createAt,
        content: item.content,
      };
      if (item.imgUrl) {
        obj.imgUrl = `${appStore.serverUrl}${item.imgUrl}`;
      } else {
        obj.imgUrl = "";
      }
      return obj;
    });
    console.log("处理后结果:", arr);
    projectList.value = [...arr];
    total.value = result.data.total || 0;
  } catch (error) {
    console.error("获取项目列表失败:", error);
    projectList.value = [];
    total.value = 0;
  }
};

// 跳转到流程图页面
const goToFlowchart = (projectId, projectName, projectPrompt) => {
  localStorage.setItem("aiPromptTextarea", projectPrompt);
  router.push({
    name: "flowchart",
    query: {
      projectId: projectId,
      target: target.value,
      resolution: resolution.value,
      projectName: projectName,
    },
  });
};

// 处理菜单命令
const handleMenuCommand = (project, command) => {
  switch (command) {
    case "rename":
      renameProject(project);
      break;
    case "duplicate":
      duplicateProject(project);
      break;
    case "delete":
      showDeleteConfirm(project);
      break;
  }
};

// 重命名项目
const renameProject = (project) => {
  // 这里实现重命名逻辑
  console.log("重命名项目:", project);
  // 使用Element Plus的弹窗输入框
  ElMessageBox.prompt("请输入新的项目名称", "重命名项目", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputValue: project.projectName || "",
  })
    .then(({ value }) => {
      if (value) {
        // 调用API更新项目名称
        updateProjectName(project.projectId, value);
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 更新项目名称API调用
const updateProjectName = async (projectId, newName) => {
  try {
    const result = await request({
      url: api.updateProject,
      method: "POST",
      data: {
        projectId: projectId,
        projectName: newName,
      },
    });
    // 更新成功后刷新列表
    getProjectList();
    ElMessage.success("项目重命名成功");
  } catch (error) {
    console.error("重命名失败:", error);
    ElMessage.error(error.message || "项目重命名失败");
  }
};

// 创建副本
const duplicateProject = (project) => {
  // 这里实现创建副本逻辑
  console.log("创建副本:", project);
  ElMessageBox.confirm(
    `确定要创建项目 "${project.projectName}" 的副本吗？`,
    "创建副本",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        // 调用API创建副本
        await request({
          url: api.duplicateProject,
          method: "POST",
          data: {
            projectId: project.projectId,
          },
        });
        // 更新列表
        getProjectList();
        ElMessage.success("项目副本创建成功");
      } catch (error) {
        console.error("创建副本失败:", error);
        ElMessage.error(error.message || "项目副本创建失败");
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 显示删除确认弹窗
const showDeleteConfirm = (project) => {
  ElMessageBox.confirm(
    `确定要删除项目 "${project.projectName}" 吗？此操作不可撤销。`,
    "确认删除",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    }
  )
    .then(async () => {
      try {
        // 调用API删除项目
        await request({
          url: api.deleteProject,
          method: "POST",
          data: {
            projectId: project.projectId,
          },
        });

        // 删除成功后刷新列表
        getProjectList();
        ElMessage.success("项目删除成功");
      } catch (error) {
        console.error("删除失败:", error);
        ElMessage.error(error.message || "项目删除失败");
      }
    })
    .catch(() => {
      // 用户取消操作
    });
};

// 根据target值改变resolution值
const handleTargetChange = (value) => {
  switch (value) {
    case "web":
      resolution.value = "1920*1080";
      break;
    case "phone":
      resolution.value = "402*874";
      break;
    case "平板端":
      resolution.value = "1024*1366";
      break;
    case "桌面端":
      resolution.value = "1440*1024";
      break;
    default:
      resolution.value = "1920*1080";
  }
};
</script>

<style lang="scss" scoped>
.home {
  background-image: url("@/assets/images/home/背景图.png");
  background-size: 100% 100%;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  overflow: hidden;
}
.title {
  height: 24.6875rem;
  width: 60rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url("@/assets/images/home/文字背景.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  box-sizing: border-box;
  margin-top: 120px;
  position: relative;
  .imageText {
    height: 4.8125rem;
    width: 38.25rem;
    background-image: url("@/assets/images/home/文字.png");
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
    margin-bottom: 1rem;
  }
  .text {
    font-size: 1.25rem;
    color: #212d73;
    font-weight: 400;
  }
  .type {
    position: absolute;
    bottom: 0.5rem;
    left: 1rem;
  }
  .searchButton {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    background-color: #409eff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  .searchButton i {
    color: white;
    font-size: 1.25rem;
  }
  ::v-deep .el-textarea {
    background-color: rgba(255, 255, 255, 0.7) !important;
  }
  ::v-deep .el-textarea__inner {
    min-height: 200px !important;
    max-height: 400px !important;
    border: 1px solid transparent !important;
    border-radius: 5px !important;
    background: linear-gradient(white, white) padding-box,
      linear-gradient(to right, #67d4ff, #bc61ff) border-box !important;
    background-clip: padding-box, border-box !important;
    overflow-y: auto !important;
    box-shadow: none !important;
  }
  ::v-deep .el-textarea {
    margin-top: auto;
  }
}
.project {
  max-height: calc(100vh - 466px);
  box-sizing: border-box;
  width: 90rem;
  padding-top: 80px;
  .projectT {
    height: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    .pTitle {
      font-size: 1.5rem;
      color: #1f1f1f;
      font-weight: 600;
    }
    .filter {
      display: flex;
      gap: 0.625rem;
    }
  }
  .main {
    max-height: calc(100vh - 607px);
    height: calc(100vh - 607px);
    background-color: white;
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    .projectContent {
      flex: 1;
      overflow-y: scroll;
      padding: 1.25rem;
      .projectItem {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
        width: 100%;
        .projectCard {
          border: 1px solid rgba(223, 225, 231, 1);
          border-radius: 0.5rem;
          // min-height: 10rem;
          transition: all 0.3s ease;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .projectCard:hover {
          transform: translateY(-0.3125rem);
          box-shadow: 0 0.625rem 1.25rem rgba(0, 0, 0, 0.15);
          background-color: #ffffff;
        }
      }
    }

    .paginationContainer {
      display: flex;
      justify-content: flex-end;
      padding: 8px;
      background-color: white;
      border-top: 1px solid #eee;
    }
    .projectCardimg {
      height: 130px;
      background-color: #e0e0e0;
      border-radius: 0.25rem;
      margin-bottom: 0.5rem;
      overflow: hidden;
    }
    .preview-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .preview-no-image {
      width: 100%;
      height: 100%;
      background-color: #f2f5f6;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview-no-image img {
      width: 36px;
      height: 36px;
    }
    .projectInfo {
      padding: 4px 12px;
      flex: 1;
      height: 70px;
      display: flex;
      flex-direction: column;
    }
    .projectHeader {
      display: flex;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .projectTypeIcon {
      width: 1rem;
      height: 1rem;
      margin-right: 0.5rem;
    }
    .projectName {
      font-size: 1.125rem;
      font-weight: 600;
      color: #333;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
    .projectMeta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
      color: #999;
    }
    .createTime {
      flex: 1;
    }
    .noneImage {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }
    .image-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .no-data-image {
      width: 12.5rem;
      height: 12.5rem;
      background-image: url("@/assets/images/home/无数据.png");
      background-size: contain;
      background-position: center;
      background-repeat: no-repeat;
      margin-bottom: 1.25rem;
    }
    .no-data-text {
      font-size: 1rem;
      color: #666;
    }

    /* 三点菜单样式 */
    .menu-trigger {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      cursor: pointer;
      padding: 4px;
      margin-left: 8px;
      border-radius: 4px;
    }

    .menu-trigger:hover {
      background-color: #f5f5f5;
    }

    .more-icon {
      width: 16px;
      height: 16px;
    }
  }
}
</style>
