import { createApp } from 'vue'
import { createHead } from '@vueuse/head'
import App from './App.vue'
import setupMain from './setup/main'
import { router } from './routes'
import createDirectives from './modules/directives'
import createSlidevContext from './modules/context'

import '/@slidev/styles'

const app = createApp(App)
app.use(router)
app.use(createHead())
app.use(createDirectives())
app.use(createSlidevContext())

setupMain({ app, router })

app.mount('#app')
