# 使用说明 - ProjectMap 到 Workflow 数据同步

## 新增功能

我们添加了一个新的 API 接口用于将 project-map.json 中的数据同步到 workflow.json 中：

**POST /platform/project/sync-workflow**

### 请求参数
```javascript
{
  "projectId": "项目ID"
}
```

### 功能说明

此接口会：
1. 读取 project-map.json 中指定项目的信息
2. 读取对应的 workflow.json 文件
3. 将 projectMap 中的项目信息同步到 workflow 数据中
4. 保存更新后的 workflow.json

### 同步的数据字段

- `projectInfo`: 完整的项目信息对象
- `content.projectName`: 项目名称
- `content.target`: 目标平台
- `content.resolution`: 分辨率

### 使用示例

```javascript
// JavaScript 示例
fetch('/platform/project/sync-workflow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    projectId: 'your-project-id'
  })
})
.then(response => response.json())
.then(data => {
  console.log('同步结果:', data);
});
```

### 响应格式

**成功响应:**
```javascript
{
  "header": {
    "errorCode": "0",
    "errorMessage": "",
    "error": null
  },
  "body": {
    "data": {
      "status": "success",
      "workflow": {
        // 完整的 workflow 数据，包含同步后的 projectInfo
      },
      "message": "数据同步完成"
    }
  }
}
```

**错误响应:**
```javascript
{
  "header": {
    "errorCode": "4004", // 或其他错误码
    "errorMessage": "项目或工作流未找到", // 或其他错误信息
    "error": null
  },
  "body": {
    "data": {}
  }
}
```

### 注意事项

1. 确保项目已存在且有对应的 workflow 数据
2. 此操作会直接修改 workflow.json 文件
3. 建议在项目创建或更新后调用此接口以保持数据一致性
