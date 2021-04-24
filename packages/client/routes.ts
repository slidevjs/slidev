import { RouteRecordRaw } from 'vue-router'
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
]
