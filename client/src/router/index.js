import Vue from "vue";
import Router from "vue-router";
// import dynamicRoutes from "./dynamicRoutes";
import MessageUtils from '@/common/utils.js';

// 安装Vue Router插件
Vue.use(Router);

const staticRoutes = [
  {
    path: "/",
    redirect: "/homePage",
  }, {
    "path": "/homePage",
    "name": "homePage",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/homePage.vue')
},
    {
    "path": "/personalBanking",
    "name": "personalBanking",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/personalBanking.vue')
},
    {
    "path": "/corporateBanking",
    "name": "corporateBanking",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/corporateBanking.vue')
},
    {
    "path": "/newsCenter",
    "name": "newsCenter",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/newsCenter.vue')
},
    {
    "path": "/customerService",
    "name": "customerService",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/customerService.vue')
},
    {
    "path": "/accountManagement",
    "name": "accountManagement",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/accountManagement.vue')
},
    {
    "path": "/savingsAndWealth",
    "name": "savingsAndWealth",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/savingsAndWealth.vue')
},
    {
    "path": "/personalLoan",
    "name": "personalLoan",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/personalLoan.vue')
},
    {
    "path": "/corporateAccounts",
    "name": "corporateAccounts",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/corporateAccounts.vue')
},
    {
    "path": "/corporateLoans",
    "name": "corporateLoans",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/corporateLoans.vue')
},
    {
    "path": "/internationalBusiness",
    "name": "internationalBusiness",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/internationalBusiness.vue')
},
    {
    "path": "/newsDetail",
    "name": "newsDetail",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/newsDetail.vue')
},
    {
    "path": "/faq",
    "name": "faq",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/faq.vue')
},
    {
    "path": "/onlineSupport",
    "name": "onlineSupport",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/onlineSupport.vue')
},
    {
    "path": "/branchLocator",
    "name": "branchLocator",
    "meta": {
        "dynamic": true
    },
    component: () => import('@/views/dynamic/branchLocator.vue')
}
];

// 创建并导出路由实例
const router = new Router({
  mode: "hash", // 使用HTML5 hash模式
  base: "/",
  routes: [
    ...staticRoutes, 
    // ...dynamicRoutes,
    // 404页面路由，必须放在最后
    {
      path: '*',
      name: 'NotFound',
      component: () => import('../views/NotFound.vue')
    }
  ],
});

// 全局路由守卫处理404情况
// router.beforeEach((to, from, next) => {
//   // 如果路由不存在，发送404错误信息给父页面
//   if (!to.name || to.name == 'NotFound') {
//     try {
//       // 使用公共方法将404错误信息传给父页面
//       const notFoundInfo = {
//         pageId: to.path.split('/')[1],
//         message: '访问的页面不存在',
//         statusCode: 404,
//       };
//       MessageUtils.sendMessage('PAGE_NOT_FOUND', notFoundInfo);
//     } catch (e) {
//       console.error('发送404错误信息失败:', e);
//     }
//   }
//   next();
// });

// 全局路由后置守卫，用于监听路由变化并通知父页面
router.afterEach((to, from) => {
  if (from.path == '/') {
    return;
  }
  try {
    // 发送路由变化信息给父页面
    const routeInfo = {
      pageId: to.path.split('/')[1],
      message: '路由变化了',
      from: from.path,
      to: to.path,
      routeName: to.name,
    };
    MessageUtils.sendMessage('ROUTE_CHANGED', routeInfo);
  } catch (e) {
    console.error('发送路由变化信息失败:', e);
  }
});

export default router;
