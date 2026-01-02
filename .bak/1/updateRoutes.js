import fs from "fs";
import path from "path";

export async function updateRoutes(page, clientRoutePath) {
    let routerConfig = await fs.promises.readFile(clientRoutePath, 'utf-8');

    // 新路由模板
    const newRoute = {
        path: `/${page.pageId}`,
        name: page.pageId,
        meta: {
            dynamic:true,
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
    await fs.promises.writeFile(clientRoutePath, routerConfig, 'utf-8');
} 


export async function resetRoutes(clientRoutePath) {
    let routerConfig = await fs.promises.readFile(clientRoutePath, 'utf-8');

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
    await fs.promises.writeFile(clientRoutePath, routerConfig, 'utf-8');
}