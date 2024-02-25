import type { RouteLocationNormalized, RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

import { rawRoutes, redirects } from '#slidev/routes'
import configs from '#slidev/configs'

export { rawRoutes }

export const routes: RouteRecordRaw[] = [
  {
    name: 'play',
    path: '/',
    component: () => import('./pages/play.vue'),
    children: [
      ...rawRoutes,
      ...redirects,
    ],
  },
  {
    name: 'print',
    path: '/print',
    component: () => import('./pages/print.vue'),
  },

  // Redirects
  { path: '', redirect: { path: '/1' } },
  { path: '/:pathMatch(.*)', redirect: { path: '/1' } },
]

if (__SLIDEV_FEATURE_PRESENTER__) {
  function passwordGuard(to: RouteLocationNormalized) {
    if (!configs.remote || configs.remote === to.query.password)
      return true
    if (configs.remote && to.query.password === undefined) {
      // eslint-disable-next-line no-alert
      const password = prompt('Enter password')
      if (configs.remote === password)
        return true
    }
    if (to.params.no)
      return { path: `/${to.params.no}` }
    return { path: '' }
  }

  routes.push({
    path: '/presenter/print',
    component: () => import('./pages/presenter/print.vue'),
  })
  if (__SLIDEV_HAS_SERVER__) {
    routes.push({
      name: 'entry',
      path: '/entry',
      component: () => import('./pages/entry.vue'),
    })
    routes.push({
      name: 'overview',
      path: '/overview',
      component: () => import('./pages/overview.vue'),
    })
    routes.push({
      name: 'notes',
      path: '/notes',
      component: () => import('./pages/notes.vue'),
      beforeEnter: passwordGuard,
    })
  }
  routes.push({
    name: 'presenter',
    path: '/presenter/:no',
    component: () => import('./pages/presenter.vue'),
    beforeEnter: passwordGuard,
  })
  routes.push({
    path: '/presenter',
    redirect: { path: '/presenter/1' },
  })
}

export const router = createRouter({
  history: __SLIDEV_HASH_ROUTE__
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes,
})
