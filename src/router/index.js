import Vue from 'vue'
import VueRouter from 'vue-router'
import Layout from '@/views/layout/default.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: Layout,
    redirect: {
      name: 'welcome'
    },
    children: [
      {
        name: 'welcome',
        path: 'welcome',
        component: () => import(/* webpackChunkName: "welcome" */ '@/views/welcome.vue')
      },
      {
        path: 'ssh/:id',
        name: 'ssh',
        meta: {
          test: 1
        },
        component: () => import(/* webpackChunkName: "about" */ '@/views/ssh.vue')
      },
      {
        path: 'asset',
        name: 'asset',
        meta: {
          title: '资产列表'
        },
        component: () => import(/* webpackChunkName: "about" */ '@/views/asset.vue')
      },
      {
        path: 'session',
        name: 'session',
        meta: {
          title: '会话管理'
        },
        component: () => import(/* webpackChunkName: "about" */ '@/views/session.vue')
      }
    ]
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/login.vue')
  }
]

const router = new VueRouter({
  routes
})

router.beforeEach((to, from, next) => {
  let XToken = window.localStorage.getItem('X-Auth-Token')
  if (to.name !== 'login' && !XToken) {
    next({
      name: 'login'
    })
  } else {
    next()
  }
})

export default router
