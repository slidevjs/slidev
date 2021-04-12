import { ViteSSG } from 'vite-ssg'
import { routes } from './routes'
import App from './App.vue'
import './styles'

export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
