# Natural Language to Code Service

一个通过自然语言生成代码的服务系统，支持工作流设计和Vue页面代码生成。

## 功能特性

- 通过自然语言生成项目工作流结构
- 自动生成Vue页面代码
- 项目管理（创建、删除、重命名、复制、导出）
- 页面图片上传和管理
- 工作流和页面状态管理
- 错误处理和重试机制

## API 接口

### 核心路由

1. **POST /v1/chat/completions** - 接收自然语言输入，生成工作流结构
2. **POST /v1/generate-code** - 根据页面列表生成Vue代码
3. **POST /v1/regenerate-code** - 重新生成指定页面代码
4. **POST /v1/generate-recode** - 重新生成单个页面代码
5. **POST /v1/update-workflow** - 更新工作流数据

### 项目管理路由

6. **POST /platform/project** - 获取项目列表
7. **POST /platform/initial** - 项目初始化
8. **POST /platform/project/upload/pages/img** - 上传页面图片
9. **POST /platform/project/design/pages** - 获取项目页面列表
10. **POST /platform/project/design/workflow/detail** - 获取工作流详情
11. **POST /platform/project/export** - 导出项目
12. **POST /platform/project/duplicate** - 复制项目
13. **POST /platform/project/rename** - 重命名项目
14. **POST /platform/project/delete** - 删除项目
15. **POST /platform/project/page/error** - 页面错误处理

## 项目结构

```
项目根目录/
├── {projectId}/
│   ├── {version}/
│   │   ├── code/          # 生成的Vue代码文件
│   │   ├── data/          # 工作流数据
│   │   ├── cover/         # 页面封面图片
│   │   └── components/    # 组件文件
├── project-map.json       # 项目映射文件
```

## 安装和运行

```bash
# 安装依赖
npm install

# 启动服务
npm start
# 或
npm run dev
```

服务将运行在 `http://localhost:3000`

## 数据结构

### Workflow 结构

```javascript
{
    content: { 
        projectName: "",
        description: "",
        pages: [],
        workflows: [],
        status: "",
        error: null,
        errorMessage: "",
    },
    createAt: "",
    target: "",
    resolution: "",
}
```

### Page 结构

```javascript
{
    pageId: "",           // 页面ID
    name: "",             // 页面名称
    description: "",      // 页面描述
    status: "",           // 页面状态
    navigationList: [],   // 导航列表
    imgUrl: ""            // 页面图片URL
}
```

## 使用示例

### 1. 生成工作流

```javascript
fetch('/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: "创建一个用户管理系统，包含用户列表、用户详情和用户编辑页面",
    projectId: "my-project-123"
  })
})
```

### 2. 生成页面代码

```javascript
fetch('/v1/generate-code', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: "my-project-123",
    pages: [/* 页面列表 */],
    workflows: [/* 工作流列表 */]
  })
})
```

## 技术栈

- Node.js (ES Modules)
- axios (HTTP请求)
- fs-extra (文件操作)

## 注意事项

- 所有请求方法都是POST
- 使用ES Module语法，不使用require
- 不使用TypeScript
- 支持CORS跨域请求
- 图片资源通过`/assets/`路径访问
