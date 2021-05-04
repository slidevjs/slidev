import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import setupMain from './setup/main'
import { router } from './routes'
import createDirectives from './modules/directives'

import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import './styles/index.css'
import './styles/shiki.css'
/* __imports__ */
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'

const app = createApp(App)
app.use(router)
app.use(createHead())
app.use(createDirectives())

setupMain({ app, router })

app.mount('#app')
