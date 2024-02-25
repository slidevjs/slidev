/// <reference types="@slidev/types/client" />

import { createApp } from 'vue'
import { createHead } from '@unhead/vue'
import App from './App.vue'
import setupMain from './setup/main'
import { router } from './routes'
import { createVClickDirectives } from './modules/v-click'
import { createVMarkDirective } from './modules/v-mark'
import { createSlidevContext } from './modules/context'

import '#slidev/styles'

const app = createApp(App)
app.use(router)
app.use(createHead())
app.use(createVClickDirectives())
app.use(createVMarkDirective())
app.use(createSlidevContext())

setupMain({ app, router })

app.mount('#app')
