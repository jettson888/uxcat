import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/home/Index.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/flowchart',
    name: 'flowchart',
    component: () => import('@/views/flowchart/Index.vue')
  },
  {
    path: '/product',
    name: 'product',
    component: () => import('@/views/product/Index.vue')
  },
  {
    path: '/code',
    name: 'code',
    component: () => import('@/views/code/Index.vue')
  },
  {
    path: '/preview',
    name: 'preview',
    component: () => import('@/views/product/Preview.vue')
  },
  {
    path: '/collapse-demo',
    name: 'collapse-demo',
    component: () => import('@/views/product/CollapseDemo.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.MODE === 'production' ? '/ai-prototype/' : '/'),
  routes
})

export default router
