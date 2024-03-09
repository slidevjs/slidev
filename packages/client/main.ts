/// <reference types="@slidev/types/client" />

import { createApp } from 'vue'
import App from './App.vue'
import setupMain from './setup/main'

const app = createApp(App)
setupMain(app)
app.mount('#app')
