import { ViteSSG } from 'vite-ssg'
import { getRoutes } from './routes'
import App from './App.vue'
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import './style/index.css'
/* __imports__ */
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'

const routes = getRoutes(/* __layouts__ */)

export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
