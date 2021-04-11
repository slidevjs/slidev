import { ViteSSG } from 'vite-ssg'
import generatedRoutes from 'virtual:generated-pages'
import { setupLayouts } from 'layouts-generated'
import { RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import './styles/main.css'
import './styles/code.css'
import './styles/markdown.css'
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'

const routes: RouteRecordRaw[] = [
  ...setupLayouts(generatedRoutes),
  { path: '/', redirect: { path: '/00' } },
]

export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
