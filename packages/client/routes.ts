import type { RouteRecordRaw } from 'vue-router'
import type { SlideTransition } from '@slidev/types'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'
import Play from './internals/Play.vue'
import Print from './internals/Print.vue'
// @ts-expect-error missing types
import _rawRoutes from '/@slidev/routes'
// @ts-expect-error missing types
import _configs from '/@slidev/configs'

export const rawRoutes = _rawRoutes as RouteRecordRaw[]

export const routes: RouteRecordRaw[] = [
  {
    name: 'play',
    path: '/',
    component: Play,
    children: [
      ...rawRoutes,
    ],
  },
  { name: 'print', path: '/print', component: Print },
  { path: '', redirect: { path: '/1' } },
  { path: '/:pathMatch(.*)', redirect: { path: '/1' } },
]

if (__SLIDEV_FEATURE_PRESENTER__) {
  routes.push({ path: '/presenter/print', component: () => import('./internals/PresenterPrint.vue') })
  routes.push({
    name: 'presenter',
    path: '/presenter/:no',
    component: () => import('./internals/Presenter.vue'),
    beforeEnter: (to) => {
      if (!_configs.remote || _configs.remote === to.query.password)
        return true
      if (_configs.remote && to.query.password === undefined) {
        // eslint-disable-next-line no-alert
        const password = prompt('Enter password')
        if (_configs.remote === password)
          return true
      }
      if (to.params.no)
        return { path: `/${to.params.no}` }
      return { path: '' }
    },
  })
  routes.push({
    path: '/presenter',
    redirect: { path: '/presenter/1' },
  })
}

export const router = createRouter({
  history: __SLIDEV_HASH_ROUTE__ ? createWebHashHistory(import.meta.env.BASE_URL) : createWebHistory(import.meta.env.BASE_URL),
  routes,
})

declare module 'vue-router' {
  interface RouteMeta {
    layout: string
    name?: string
    class?: string
    clicks?: number
    slide?: {
      start: number
      end: number
      note?: string
      notesHTML?: string
      id: number
      no: number
      filepath: string
      title?: string
      level?: number
    }
    transition?: string | SlideTransition
    // private fields
    __clicksElements: HTMLElement[]
    __preloaded?: boolean
  }
}
