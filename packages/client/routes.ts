import { createRouter, RouteRecordRaw, createWebHistory, createWebHashHistory } from 'vue-router'
import Play from './internals/Play.vue'
// @ts-expect-error
import _rawRoutes from '/@slidev/routes'

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
  { path: '', redirect: { path: '/1' } },
  { path: '/:pathMatch(.*)', redirect: { path: '/1' } },
]

if (import.meta.env.DEV) {
  routes.push(
    {
      name: 'presenter',
      path: '/presenter/:no',
      component: () => import('./internals/Presenter.vue'),
    },
    {
      path: '/presenter',
      redirect: { path: '/presenter/1' },
    },
  )
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
      id: number
      no: number
      filepath: string
    }

    // private fields
    __clicksElements: HTMLElement[]
    __preloaded?: boolean
  }
}
