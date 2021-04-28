import { createRouter, RouteRecordRaw, createWebHistory } from 'vue-router'
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
  { path: '', redirect: { path: '/0' } },
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
      redirect: { path: '/presenter/0' },
    },
  )
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

declare module 'vue-router' {
  interface RouteMeta {
    layout: string
    slide?: {
      start: number
      end: number
      id: number
      file: string
    }
  }
}
