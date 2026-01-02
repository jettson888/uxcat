# Vue2 + Vite 项目 - Axios封装说明

## 项目结构
```
src/
├── api/                    # API接口封装
│   ├── request.js         # axios核心封装
│   ├── index.js           # API接口统一出口
│   └── README.md          # API使用说明
├── views/                 # 页面组件
│   ├── home/              # 首页
│   │   ├── Index.vue      # 首页组件
│   │   └── ApiDemo.vue    # API示例组件
│   └── about/             # 关于页面
├── router/                # 路由配置
├── store/                 # 状态管理
└── ...                    # 其他文件
```

## Axios封装说明

### 1. 核心功能
- **请求拦截器**: 统一设置请求头、token认证等
- **响应拦截器**: 统一处理响应状态码、错误处理等
- **超时处理**: 默认15秒超时
- **环境配置**: 支持不同环境的API基础地址配置

### 2. 文件说明

#### `src/api/request.js`
这是axios的核心封装文件，包含：
- axios实例创建
- 请求拦截器配置
- 响应拦截器配置
- 统一错误处理

#### `src/api/index.js`
API接口的统一出口，按模块组织接口：
- 用户相关接口
- 系统相关接口
- 可扩展其他业务模块

### 3. 使用方法

#### 基本使用
```javascript
import api from '@/api'

// 获取用户信息
api.user.getInfo().then(res => {
  console.log('用户信息:', res.data)
}).catch(err => {
  console.error('获取用户信息失败:', err)
})

// 用户登录
const loginData = {
  username: 'admin',
  password: '123456'
}
api.user.login(loginData).then(res => {
  console.log('登录成功:', res.data)
}).catch(err => {
  console.error('登录失败:', err)
})
```

#### 在Vue组件中使用
```vue
<template>
  <div>
    <h1>用户信息</h1>
    <div v-if="userInfo">
      <p>用户名: {{ userInfo.name }}</p>
      <p>角色: {{ userInfo.role }}</p>
    </div>
  </div>
</template>

<script>
import api from '@/api'

export default {
  name: 'UserInfo',
  data() {
    return {
      userInfo: null
    }
  },
  created() {
    this.getUserInfo()
  },
  methods: {
    async getUserInfo() {
      try {
        const res = await api.user.getInfo()
        this.userInfo = res.data
      } catch (error) {
        console.error('获取用户信息失败:', error)
      }
    }
  }
}
</script>
```

### 4. 功能特性

#### 请求拦截器
- 自动设置Content-Type为application/json
- 可扩展token认证机制（已预留代码）
- 统一超时处理（15秒）

#### 响应拦截器
- 统一状态码处理（基于code字段）
- 错误信息统一提示
- 特殊状态码处理：
  - 401: 未登录或token过期
  - 403: 没有权限访问
  - 500: 服务器内部错误
- 网络错误处理：
  - 请求超时
  - 网络连接错误

### 5. 环境配置

支持多环境配置，不同环境会自动使用对应的配置文件：
- `.env.development`  开发环境
- `.env.test`        测试环境  
- `.env.production`  生产环境
- `.env`            默认环境配置

```env
# .env.development  开发环境
VITE_APP_BASE_API=http://work.lowcode.hzbdev:8900/

# .env.test        测试环境  
VITE_APP_BASE_API=http://work.lowcode.hzbtest:8900/

# .env.production  生产环境
VITE_APP_BASE_API=http://work.lowcode.hzb:8900/
```

运行不同环境的命令：
```bash
# 开发环境
npm run dev

# 测试环境
npm run dev --mode test

# 生产环境构建
npm run build
```

### 6. 扩展使用

#### 添加新的API接口
在 `src/api/index.js` 中添加：
```javascript
const api = {
  // ...现有接口
  
  // 新增业务模块
  product: {
    // 获取商品列表
    getList: (params) => request({
      url: '/product/list',
      method: 'get',
      params
    }),
    
    // 创建商品
    create: (data) => request({
      url: '/product/create',
      method: 'post',
      data
    })
  }
}
```

#### 自定义请求配置
```javascript
// 带参数的GET请求
api.product.getList({
  page: 1,
  size: 10,
  keyword: '手机'
})

// 带请求头的POST请求
api.user.login(loginData, {
  headers: {
    'X-Custom-Header': 'custom-value'
  }
})
```

## 运行项目

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建生产环境
npm run build
```

## 测试API示例

项目中已包含API调用示例页面，可以通过以下方式访问：
1. 运行项目：`npm run dev`
2. 在首页点击"API接口示例"按钮
3. 在API示例页面中测试各种接口调用

## 注意事项

1. 请根据实际后端接口格式调整响应拦截器中的状态码处理逻辑
2. 如需添加token认证，请取消注释并完善请求拦截器中的相关代码
3. 可根据项目需要调整超时时间和错误处理策略
