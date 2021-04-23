import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
// @ts-expect-error
import routes from '/@slidev/routes'
import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import './style/index.css'
/* __imports__ */
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'

export const createApp = ViteSSG(
  App,
  { routes },
  (ctx) => {
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
