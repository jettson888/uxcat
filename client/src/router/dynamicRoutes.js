const dynamicRoutes = []

// 获取所有动态组件
const modules = import.meta.glob('../views/dynamic/*.vue')

// 转换为路由配置
for (const path in modules) {
  // 提取文件名作为路由名称
  const name = path.replace(/(\.\.\/views\/dynamic\/|\.vue)/g, '')
  
  // 动态导入组件并在加载时添加混入
  const originalComponent = modules[path];
  const enhancedComponent = () => originalComponent().then(component => {
    if (component && component.default) {
      // 为动态组件添加混入
      const mixins = component.default.mixins || [];
      // 动态导入混入（避免在构建时被包含）
      return import('@/common/mixin.js').then(mixinModule => {
        mixins.push(mixinModule.default);
        component.default.mixins = mixins;
        return component;
      });
    }
    return component;
  });
  
  dynamicRoutes.push({
    path: `/${name}`,
    name: name,
    component: enhancedComponent,
    meta: {
      title: name,
      dynamic: true
    }
  })
}

export default dynamicRoutes
