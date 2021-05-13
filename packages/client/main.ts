import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import setupMain from './setup/main'
import { router } from './routes'
import createDirectives from './modules/directives'
import createSlidevContext from './modules/context'

import 'virtual:windi-base.css'
import 'virtual:windi-components.css'
import '/@slidev/styles'
import 'virtual:windi-utilities.css'
import 'virtual:windi-devtools'

const app = createApp(App)
app.use(router)
app.use(createHead())
app.use(createDirectives())
app.use(createSlidevContext())

setupMain({ app, router })

app.mount('#app')
