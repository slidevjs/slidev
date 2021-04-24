import { createRouter, RouteRecordRaw, createWebHistory } from 'vue-router'
import Presenter from './internals/Presenter.vue'
import Play from './internals/Play.vue'
// @ts-expect-error
import _rawRoutes from '/@slidev/routes'

export const rawRoutes = _rawRoutes as RouteRecordRaw[]

export const routes: RouteRecordRaw[] = [
  {
    name: 'presenter',
    path: '/presenter/:no',
    component: Presenter,
  },
  {
    name: 'play',
    path: '/',
    component: Play,
    children: [
      ...rawRoutes,
    ],
  },
  { path: '', redirect: { path: '/0' } },
  { path: '/presenter', redirect: { path: '/presenter/0' } },
]

export const router = createRouter({
  history: createWebHistory(),
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
