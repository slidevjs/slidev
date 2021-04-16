import { ViteSSG } from 'vite-ssg'
import { getRoutes } from './routes'
import App from './App.vue'
/* __imports__ */

const routes = getRoutes(/* __layouts__ */)

export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
