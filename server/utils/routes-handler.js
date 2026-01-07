const fs = require('fs-extra');
const path = require('path');
const config = require('../config.js');

async function resetRoutes(routePath) {
  let routerConfig = await fs.readFile(routePath, {
    encoding: 'utf-8'
  });

  // 1. 找到staticRoutes数组的开始和结束位置
  const staticRoutesStart = routerConfig.indexOf('const staticRoutes = [');
  const staticRoutesEnd = routerConfig.indexOf('];', staticRoutesStart) + 2;

  // 2. 创建初始路由配置
  const initialRoutes = `const staticRoutes = [
      {
          path: "/",
          redirect: "/homePage",
      },    
  ];`;

  // 3. 替换原文件中的staticRoutes部分
  routerConfig = routerConfig.slice(0, staticRoutesStart) +
    initialRoutes +
    routerConfig.slice(staticRoutesEnd);

  // 写入更新后的路由配置文件
  await fs.writeFile(routePath, routerConfig, {
    encoding: 'utf-8'
  });
}

async function updateRoutes(page, routePath) {
  let routerConfig = await fs.readFile(routePath, {
    encoding: 'utf-8'
  });

  // 新路由模板
  const newRoute = {
    path: `/${page.pageId}`,
    name: page.pageId,
    meta: {
      dynamic: true,
    },
    component: `() => import('@/views/dynamic/${page.pageId}.vue')`
  };

  // 1. 找到staticRoutes数组的开始和结束位置
  const staticRoutesStart = routerConfig.indexOf('const staticRoutes = [');
  const staticRoutesEnd = routerConfig.indexOf('];', staticRoutesStart) + 2;

  // 2. 提取现有的staticRoutes内容
  const existingStaticRoutes = routerConfig.slice(staticRoutesStart, staticRoutesEnd);

  // 3. 在最后一个路由项后添加逗号和换行
  let updatedStaticRoutes = existingStaticRoutes.replace(/\s*];$/, '');

  // 4. 追加新路由 (考虑格式化)
  if (updatedStaticRoutes.trim().endsWith('}')) {
    updatedStaticRoutes += ',';
  }

  updatedStaticRoutes += `\n    ${JSON.stringify(newRoute, null, 4).replace(
    /"component": "(.*?)"/,
    'component: $1'  // 将字符串转为实际函数
  )}`;

  updatedStaticRoutes += '\n  ];'; // 补回数组的结束部分

  // 5. 替换原文件中的staticRoutes部分
  routerConfig = routerConfig.slice(0, staticRoutesStart) +
    updatedStaticRoutes +
    routerConfig.slice(staticRoutesEnd);

  // 写入更新后的路由配置文件
  await fs.writeFile(routePath, routerConfig, {
    encoding: 'utf-8'
  });
}


async function insertClientAllRoutes(pages) {
  const routePath = path.join(config.CLIENT_DIR, 'src', 'router', 'index.js');
  for (const page of pages) {
    const dynamicPath = path.join(config.CLIENT_DIR, 'src', 'views', 'dynamic', `${page.pageId}.vue`);
    try {
      // 先检查文件是否已存在
      await fs.access(dynamicPath, fs.constants.F_OK);
      await updateRoutes(page, routePath);
      console.log(`文件 ${page.pageId}.vue 已存在，跳过创建`);
    } catch (err) {
      // 文件不存在时创建
      if (err.code === 'ENOENT') {
        try {
          await fs.promises.writeFile(
            dynamicPath,
            `<script>export default { name: "${page.pageId}" }</script>\n<template></template>`
          );
          console.log(`已创建新组件: ${page.pageId}.vue`);
          await updateRoutes(page, routePath);
        } catch (writeErr) {
          console.error(`创建文件 ${page.pageId}.vue 失败:`, writeErr);
        }
      } else {
        console.error(`检查文件 ${page.pageId}.vue 时发生错误:`, err);
      }
    }
  }
}


module.exports = {
  resetRoutes,
  updateRoutes,
  insertClientAllRoutes
}