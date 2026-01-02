// 预留变更口子
// 根据环境变量区分本地与线上环境
// 本地环境（local、development）使用 /hzux，线上环境使用 store 中的 serverUrl
const localEnvs = ['local', 'development']
const isLocal = localEnvs.includes(
  import.meta.env.VITE_APP_ENV)

// 创建一个函数来动态获取proxyPrefix
const getProxyPrefix = async() => {
  // if (isLocal) {
  //   return '/hzux'
  // }
  // 在运行时获取store中的serverUrl
  try {
    // 使用ES6动态import替代CommonJS的require
    const storeModule = await
    import ('@/stores/app');
    const {
      useAppStore
    } = storeModule;
    const store = useAppStore();
    return store.serverUrl || 'http://127.0.0.1:9369';
  } catch (error) {
    // 如果store还未初始化或获取失败，使用默认值
    console.warn('Failed to get store:', error);
    return 'http://127.0.0.1:9369';
  }
}

// 创建一个API工厂函数，确保每次调用时都能获取最新的serverUrl
const createApiEndpoints = async() => {
  const proxyPrefix = await getProxyPrefix()
  console.log('proxyPrefix', proxyPrefix)

  return {
    // 公共组件相关接口
    export: `${proxyPrefix}/platform/project/export`, // 导出

    // Product 相关接口
    getPages: `${proxyPrefix}/platform/project/design/pages`,
    regenerateCode: `${proxyPrefix}/v1/regenerate-code`,
    generateRecode: `${proxyPrefix}/v1/generate-recode`,
    saveThumbnail: `${proxyPrefix}/platform/project/upload/pages/img`,
    sendError: `${proxyPrefix}/platform/project/page/error`, // 发送报错信息
    generateStyles: `${proxyPrefix}/v1/generate-styles`, // 可视化数据修改

    // Home 相关接口
    chatCompletions: `${proxyPrefix}/v1/chat/completions`,
    generateCode: `${proxyPrefix}/v1/generate-code`,
    getProjects: `${proxyPrefix}/platform/project`,
    // 更新项目名称
    updateProject: `${proxyPrefix}/platform/project/rename`,
    // 复制项目
    duplicateProject: `${proxyPrefix}/platform/project/duplicate`,
    // 删除项目
    deleteProject: `${proxyPrefix}/platform/project/delete`,

    // Flowchart 相关接口
    updateWorkflow: `${proxyPrefix}/v1/update-workflow`,
    getWorkflowDetail: `${proxyPrefix}/platform/project/design/workflow/detail`,

    // 替换所有内容接口
    initial: `${proxyPrefix}/platform/initial`,
  }
}

// 默认导出一个函数，每次调用时返回最新的API endpoints
export default createApiEndpoints