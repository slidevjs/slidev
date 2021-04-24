import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import setup from './setup/main'
import { routes } from './routes'

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
    setup()
    Object.values(import.meta.globEager('./modules/*.ts')).map(i => i.install?.(ctx))
  },
)
