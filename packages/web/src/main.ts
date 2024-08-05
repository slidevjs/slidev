/// <reference types="@slidev/types/client" />

import { createApp } from 'vue'
import './styles'
import setupMain from '../../client/setup/main'
import App from '../../client/App.vue'

const app = createApp(App)
setupMain(app)
app.mount('#app')
